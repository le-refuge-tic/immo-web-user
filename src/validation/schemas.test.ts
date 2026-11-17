import { describe, expect, it } from 'vitest'
import { valider } from '../shared/saisie/validation'
import {
  schemaConnexion,
  schemaInscription,
  schemaLoyerGestion,
  schemaModificationBien,
  schemaNumeroMobileMoney,
  schemaProfil,
  schemaRechargement,
} from './schemas'

const champs = (r: ReturnType<typeof valider>) => (r.ok ? [] : Object.keys(r.erreurs))
const premier = (r: ReturnType<typeof valider>) => (r.ok ? null : Object.values(r.erreurs)[0])

describe('schémas du site (lot 15)', () => {
  const inscription = {
    nom: 'Adjovi', prenom: 'Koffi', telephone: '0197000000', email: '', password: 'MotDePasse1', confirmation: 'MotDePasse1', conditions: true,
  }

  it('inscription : messages repris de l’écran, téléphone ou e-mail exigé', () => {
    expect(valider(schemaInscription('+229'), inscription).ok).toBe(true)
    expect(premier(valider(schemaInscription('+229'), { ...inscription, telephone: '019712345' }))).toMatch('saisissez 10 chiffres commençant par 01')
    expect(premier(valider(schemaInscription('+229'), { ...inscription, password: 'Court1', confirmation: 'Court1' }))).toBe('Mot de passe trop court (8 caractères min.)')
    expect(premier(valider(schemaInscription('+229'), { ...inscription, confirmation: 'Autre' }))).toBe('Les mots de passe ne correspondent pas')
    expect(premier(valider(schemaInscription('+229'), { ...inscription, conditions: false }))).toBe("Veuillez accepter les conditions d'utilisation")
    expect(premier(valider(schemaInscription('+229'), { ...inscription, telephone: '', email: '' }))).toBe('Renseignez un téléphone ou un e-mail.')
    expect(valider(schemaInscription('+229'), { ...inscription, telephone: '', email: 'k@refuge.bj' }).ok).toBe(true)
    expect(champs(valider(schemaInscription('+229'), { ...inscription, nom: 'A', email: 'pas-un-mail' }))).toEqual(['nom', 'email'])
    // Hors Bénin : chiffres seulement, longueur raisonnable.
    expect(valider(schemaInscription('+33'), { ...inscription, telephone: '612345678' }).ok).toBe(true)
  })

  it('connexion : champs vides et numéro de mauvaise longueur', () => {
    expect(premier(valider(schemaConnexion('+229'), { telephone: '', password: '' }))).toBe('Remplissez tous les champs')
    expect(champs(valider(schemaConnexion('+229'), { telephone: '01970000000', password: 'x' }))).toEqual(['telephone'])
    expect(valider(schemaConnexion('+229'), { telephone: '0197000000', password: 'x' }).ok).toBe(true)
  })

  it('profil : nom réel (règle du backend)', () => {
    expect(valider(schemaProfil, { nom: 'Hounkpè', prenom: "Ama-Rose", email: '' }).ok).toBe(true)
    expect(champs(valider(schemaProfil, { nom: 'K2', prenom: '--', email: 'a@b' }))).toEqual(['nom', 'prenom', 'email'])
  })

  it('modification d’un bien : prix requis, promo ≥ 100 et inférieure au prix', () => {
    const ok = { prix: '150000', prixPromo: '', fraisVisite: '', description: '' }
    expect(valider(schemaModificationBien, ok)).toEqual({ ok: true, data: { prix: 150000, prixPromo: undefined, fraisVisite: undefined, description: undefined } })
    expect(champs(valider(schemaModificationBien, { ...ok, prix: '' }))).toEqual(['prix'])
    expect(champs(valider(schemaModificationBien, { ...ok, prixPromo: '50' }))).toEqual(['prixPromo'])
    expect(premier(valider(schemaModificationBien, { ...ok, prixPromo: '150000' }))).toBe('Le prix promotionnel doit être inférieur au prix normal.')
    expect(valider(schemaModificationBien, { ...ok, fraisVisite: '0' }).ok).toBe(true)
  })

  it('montants et numéros Mobile Money', () => {
    expect(valider(schemaLoyerGestion, { loyer: '0' }).ok).toBe(false)
    expect(valider(schemaLoyerGestion, { loyer: '50000' }).ok).toBe(true)
    expect(valider(schemaNumeroMobileMoney, { telephone: '97000000' }).ok).toBe(false)
    expect(valider(schemaNumeroMobileMoney, { telephone: '0197000000' }).ok).toBe(true)
    expect(champs(valider(schemaRechargement(100, 1_000_000), { montant: '50', telephone: '0197000000' }))).toEqual(['montant'])
    expect(valider(schemaRechargement(100, 1_000_000), { montant: '5000', telephone: '0197000000' }).ok).toBe(true)
  })
})
