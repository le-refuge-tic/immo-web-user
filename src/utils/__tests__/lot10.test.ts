import { describe, expect, it } from 'vitest'
import { estCreneauExpire, phraseCreneauExpire } from '../creneauExpire'
import { presenterFraisVisite, type TarifFraisVisite } from '../promoVisite'

const MAINTENANT = new Date('2026-11-17T10:00:00Z').getTime()

describe('lot 10 : créneau expiré', () => {
  it('seulement pour une visite non confirmée dont la date retenue est passée', () => {
    const passee = '2026-11-16T09:00:00Z'
    const future = '2026-11-18T09:00:00Z'
    expect(estCreneauExpire({ statut: 'en_attente', date_souhaitee: passee }, MAINTENANT)).toBe(true)
    expect(estCreneauExpire({ statut: 'en_attente', date_souhaitee: future }, MAINTENANT)).toBe(false)
    expect(estCreneauExpire({ statut: 'confirmee', date_souhaitee: passee }, MAINTENANT)).toBe(false)
    expect(estCreneauExpire({ statut: 'effectuee', date_souhaitee: passee }, MAINTENANT)).toBe(false)
    // La contre-proposition prime sur la date souhaitée.
    expect(estCreneauExpire({ statut: 'contre_proposee', date_souhaitee: passee, date_contre_proposee: future }, MAINTENANT)).toBe(false)
    expect(estCreneauExpire({ statut: 'contre_proposee', date_souhaitee: future, date_contre_proposee: passee }, MAINTENANT)).toBe(true)
    expect(estCreneauExpire({ statut: 'en_attente' }, MAINTENANT)).toBe(false)
  })

  it('phrases claires selon le lecteur', () => {
    expect(phraseCreneauExpire({ statut: 'en_attente' }, 'client')).toBe('Le propriétaire n’a pas répondu avant le créneau.')
    expect(phraseCreneauExpire({ statut: 'en_attente' }, 'proprietaire')).toContain('Vous n’avez pas répondu')
    expect(phraseCreneauExpire({ statut: 'contre_proposee' }, 'client')).toContain('sans réponse de votre part')
  })
})

describe('lot 10 : frais de visite promotionnels', () => {
  const tarif: TarifFraisVisite = { montant: 500, montant_normal: 1000, montant_promo: 500, promo_active: true, promo_fin_le: null }

  it('500 F : 1 000 F barré et « Tarif promotionnel » sans date de fin', () => {
    expect(presenterFraisVisite(500, tarif)).toEqual({ montant: 500, barre: 1000, offre: 'Tarif promotionnel' })
  })

  it('avec une date de fin : « Offre de lancement jusqu’au JJ/MM »', () => {
    expect(presenterFraisVisite(500, { ...tarif, promo_fin_le: '2026-12-31' }).offre).toBe('Offre de lancement jusqu’au 31/12')
  })

  it('autre montant, visite gratuite, promotion finie ou tarif inconnu : affichage inchangé', () => {
    const sans = { montant: 1500, barre: null, offre: null }
    expect(presenterFraisVisite(1500, tarif)).toEqual(sans)
    expect(presenterFraisVisite(0, tarif)).toEqual({ montant: 0, barre: null, offre: null })
    expect(presenterFraisVisite(500, { ...tarif, promo_active: false })).toEqual({ montant: 500, barre: null, offre: null })
    expect(presenterFraisVisite(500, undefined)).toEqual({ montant: 500, barre: null, offre: null })
  })
})
