import { describe, expect, it } from 'vitest'
import { estCompteInactif, formaterDateSuppression, suppressionEnCours, suppressionProgrammee } from '../suppressionCompte'

const erreur = (status: number, data: Record<string, unknown>) => ({ response: { status, data } })
const DATE = '2026-12-02T10:00:00.000Z'

describe('formaterDateSuppression', () => {
  it('formate une date ISO en JJ/MM/AAAA', () => {
    expect(formaterDateSuppression(DATE)).toMatch(/^\d{2}\/12\/2026$/)
  })
  it('renvoie null pour une valeur absente ou illisible', () => {
    expect(formaterDateSuppression(undefined)).toBeNull()
    expect(formaterDateSuppression('pas une date')).toBeNull()
    expect(formaterDateSuppression(42)).toBeNull()
  })
})

describe('suppressionEnCours', () => {
  it('reconnaît le 409 SUPPRESSION_EN_COURS et garde le message du serveur', () => {
    const r = suppressionEnCours(erreur(409, { code: 'SUPPRESSION_EN_COURS', message: 'Ce numéro est en cours de suppression.', suppression_effective_le: DATE }))
    expect(r?.message).toBe('Ce numéro est en cours de suppression.')
    expect(r?.date).toMatch(/2026$/)
  })
  it('ignore un autre 409 ou un autre code', () => {
    expect(suppressionEnCours(erreur(409, { message: 'Numéro déjà utilisé' }))).toBeNull()
    expect(suppressionEnCours(erreur(403, { code: 'SUPPRESSION_EN_COURS' }))).toBeNull()
    expect(suppressionEnCours(new Error('réseau'))).toBeNull()
  })
})

describe('suppressionProgrammee', () => {
  it('reconnaît le 403 SUPPRESSION_PROGRAMMEE', () => {
    const r = suppressionProgrammee(erreur(403, { code: 'SUPPRESSION_PROGRAMMEE', message: 'm', suppression_effective_le: DATE, annulation_possible: true }))
    expect(r).toEqual({ message: 'm', date: formaterDateSuppression(DATE) })
  })
  it('ignore un 403 sans ce code et un 401 avec ce code', () => {
    expect(suppressionProgrammee(erreur(403, { message: 'Accès refusé' }))).toBeNull()
    expect(suppressionProgrammee(erreur(401, { code: 'SUPPRESSION_PROGRAMMEE' }))).toBeNull()
  })
})

describe('estCompteInactif', () => {
  it('vrai pour un 401 SUPPRESSION_PROGRAMMEE ou COMPTE_SUPPRIME', () => {
    expect(estCompteInactif(erreur(401, { code: 'SUPPRESSION_PROGRAMMEE' }))).toBe(true)
    expect(estCompteInactif(erreur(401, { code: 'COMPTE_SUPPRIME' }))).toBe(true)
  })
  it('faux pour un 401 ordinaire (jeton expiré) ou un autre statut', () => {
    expect(estCompteInactif(erreur(401, { message: 'Unauthorized' }))).toBe(false)
    expect(estCompteInactif(erreur(403, { code: 'COMPTE_SUPPRIME' }))).toBe(false)
    expect(estCompteInactif(undefined)).toBe(false)
  })
})
