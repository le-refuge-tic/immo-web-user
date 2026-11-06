import { describe, expect, it } from 'vitest'
import { estRetraitEnCours, infoStatutRetrait, libelleOperateur, messageApresDemande, messageMontantRetrait, raisonBlocageRetrait, RETRAIT_MINIMUM } from '../retrait'

describe('messageMontantRetrait', () => {
  it('reste silencieux tant que le champ est vide', () => {
    expect(messageMontantRetrait('', 8000)).toBe('')
    expect(messageMontantRetrait('   ', 8000)).toBe('')
  })

  it('accepte un montant entre le minimum et le solde, bornes comprises', () => {
    expect(messageMontantRetrait('500', 8000)).toBe('')
    expect(messageMontantRetrait('3000', 8000)).toBe('')
    expect(messageMontantRetrait('8000', 8000)).toBe('')
  })

  it('refuse un montant supérieur au solde en citant le solde', () => {
    expect(messageMontantRetrait('9000', 8000)).toMatch(/dépasse votre solde disponible \(8[\s  ]000 FCFA\)/)
  })

  it('refuse un montant sous le minimum de 500 FCFA', () => {
    expect(RETRAIT_MINIMUM).toBe(500)
    expect(messageMontantRetrait('300', 8000)).toMatch(/minimum de retrait est de 500 FCFA/)
    expect(messageMontantRetrait('499', 8000)).not.toBe('')
  })

  it('refuse un montant nul, négatif ou non numérique', () => {
    expect(messageMontantRetrait('0', 8000)).toMatch(/chiffres/)
    expect(messageMontantRetrait('-5', 8000)).toMatch(/chiffres/)
    expect(messageMontantRetrait('abc', 8000)).toMatch(/chiffres/)
  })

  it('annonce le dépassement du solde avant le minimum quand le solde est inférieur à 500', () => {
    expect(messageMontantRetrait('400', 300)).toMatch(/dépasse votre solde/)
  })
})

describe('messageMontantRetrait — limites du serveur', () => {
  it('utilise le minimum et le maximum du serveur', () => {
    expect(messageMontantRetrait('900', 100000, { min: 1000, max: 50000 })).toMatch(/minimum de retrait est de 1[\s  ]000 FCFA/)
    expect(messageMontantRetrait('60000', 100000, { min: 1000, max: 50000 })).toMatch(/maximum par retrait est de 50[\s  ]000 FCFA/)
    expect(messageMontantRetrait('50000', 100000, { min: 1000, max: 50000 })).toBe('')
    expect(messageMontantRetrait('1000', 100000, { min: 1000, max: 50000 })).toBe('')
  })

  it('le solde reste testé avant le maximum', () => {
    expect(messageMontantRetrait('60000', 8000, { min: 500, max: 50000 })).toMatch(/dépasse votre solde/)
  })

  it('refuse un montant avec décimales (le serveur n\'accepte que des FCFA entiers)', () => {
    expect(messageMontantRetrait('1500.5', 8000)).toMatch(/entier/)
  })

  it('sans limites chargées : minimum par défaut, pas de maximum', () => {
    expect(messageMontantRetrait('499', 100000, {})).not.toBe('')
    expect(messageMontantRetrait('90000', 100000, {})).toBe('')
  })
})

describe('statuts de retrait', () => {
  it.each([
    ['en_attente', 'attente'], ['en_cours', 'attente'], ['en_attente_fonds', 'attente'], ['approuve', 'attente'],
    ['envoye', 'succes'], ['echoue', 'echec'], ['rejete', 'echec'],
  ])('%s → %s', (statut, ton) => {
    expect(infoStatutRetrait(statut).ton).toBe(ton)
  })

  it('un statut inconnu s\'affiche tel quel, comme « en cours » (aucune fausse alerte)', () => {
    expect(infoStatutRetrait('nouveau')).toEqual({ label: 'nouveau', ton: 'attente' })
  })

  it('seul un virement non terminé déclenche le rafraîchissement automatique', () => {
    expect(estRetraitEnCours('en_cours')).toBe(true)
    expect(estRetraitEnCours('en_attente_fonds')).toBe(true)
    expect(estRetraitEnCours('envoye')).toBe(false)
    expect(estRetraitEnCours('echoue')).toBe(false)
  })

  it('les libellés ne contiennent aucun détail technique', () => {
    for (const s of ['en_attente', 'en_cours', 'en_attente_fonds', 'envoye', 'echoue', 'rejete']) {
      expect(infoStatutRetrait(s).label).not.toMatch(/fedapay|payout|solde/i)
    }
  })
})

describe('messageApresDemande', () => {
  it('virement lancé : on annonce l\'envoi, pas encore l\'arrivée', () => {
    const m = messageApresDemande({ statut: 'en_cours', message: null })
    expect(m.ok).toBe(true)
    expect(m.texte).toMatch(/lancé/)
  })

  it('échec immédiat : message du serveur (remboursement), présenté comme un échec', () => {
    const m = messageApresDemande({ statut: 'echoue', message: 'Le virement a échoué. Le montant a été remis sur votre portefeuille.' })
    expect(m.ok).toBe(false)
    expect(m.texte).toMatch(/remis sur votre portefeuille/)
  })

  it('en attente de fonds : demande enregistrée, jamais présentée comme un échec', () => {
    expect(messageApresDemande({ statut: 'en_attente_fonds', message: null }).ok).toBe(true)
  })
})

describe('raisonBlocageRetrait', () => {
  const ok = { numero_retrait: '0166000001', operateur_retrait: 'mtn' as const, retraits_suspendus_jusqu_a: null }

  it('rien à signaler quand tout est en place, ou tant que les infos ne sont pas chargées', () => {
    expect(raisonBlocageRetrait(ok)).toBeNull()
    expect(raisonBlocageRetrait(null)).toBeNull()
  })

  it('l\'opérateur n\'est jamais un motif de blocage : il se choisit dans le formulaire', () => {
    const sansOperateur = { ...ok, operateur_retrait: null }
    expect(raisonBlocageRetrait(sansOperateur)).toBeNull()
  })

  it('demande un numéro quand il n\'y en a aucun', () => {
    expect(raisonBlocageRetrait({ ...ok, numero_retrait: null })).toMatch(/numéro/)
  })

  it('annonce la suspension de 48 h tant qu\'elle court, plus après', () => {
    const futur = new Date(Date.now() + 3600_000).toISOString()
    const passe = new Date(Date.now() - 3600_000).toISOString()
    expect(raisonBlocageRetrait({ ...ok, retraits_suspendus_jusqu_a: futur })).toMatch(/suspendus jusqu'au/)
    expect(raisonBlocageRetrait({ ...ok, retraits_suspendus_jusqu_a: passe })).toBeNull()
  })
})

describe('libelleOperateur', () => {
  it('MTN et Moov', () => {
    expect(libelleOperateur('mtn')).toBe('MTN')
    expect(libelleOperateur('moov')).toBe('Moov')
    expect(libelleOperateur(null)).toBe('')
  })
})
