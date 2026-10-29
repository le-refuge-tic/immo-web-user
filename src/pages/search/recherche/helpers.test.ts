import { describe, it, expect } from 'vitest'
import { inBudgetRange, isBudgetVoisin, prixPourBudget, trierParPrix, toleranceBudget } from './helpers'
import type { DetailsSalleFete } from '../../../types/api'

const salle = (id: number, prix: number, duree: number, parHeure?: number) => ({
  id,
  prix,
  type: 'salle_fete' as const,
  details_salle_fete: { prix, duree_heures: duree, prix_par_heure: parHeure } as DetailsSalleFete,
})
const appart = (id: number, prix: number) => ({ id, prix, type: 'appart_vide' as const, details_salle_fete: null })

const A = salle(1, 45000, 8, 5625) // 5 625 FCFA / h
const B = salle(2, 20000, 2, 10000) // 10 000 FCFA / h
const C = salle(3, 30000, 6, 5000) // 5 000 FCFA / h

describe('prixPourBudget', () => {
  it('salle de fêtes recherchée : prix ramené à l’heure', () => {
    expect(prixPourBudget(A, 'salle_fete')).toBe(5625)
    expect(prixPourBudget(C, 'salle_fete')).toBe(5000)
  })
  it('à défaut de prix_par_heure (ancienne réponse), le recalcule', () => {
    expect(prixPourBudget(salle(4, 10000, 3), 'salle_fete')).toBe(3333)
  })
  it('autre recherche ou autre type : prix affiché, comme avant', () => {
    expect(prixPourBudget(A, '')).toBe(45000)
    expect(prixPourBudget(A, 'guesthouse')).toBe(45000)
    expect(prixPourBudget(appart(5, 30000), 'salle_fete')).toBe(30000)
  })
})

describe('inBudgetRange', () => {
  it('non-régression : sans type, compare le prix affiché', () => {
    expect(inBudgetRange(appart(1, 30000), '', '50000')).toBe(true)
    expect(inBudgetRange(appart(1, 60000), '', '50000')).toBe(false)
    expect(inBudgetRange(appart(1, 30000), '40000', '')).toBe(false)
  })
  it('salles : le budget est un prix à l’heure (45 000 pour 8 h passe sous 6 000 / h)', () => {
    expect(inBudgetRange(A, '', '6000', 'salle_fete')).toBe(true)
    expect(inBudgetRange(A, '', '5000', 'salle_fete')).toBe(false)
    expect(inBudgetRange(B, '', '6000', 'salle_fete')).toBe(false)
    expect(inBudgetRange(A, '', '6000')).toBe(false) // sans le type, le prix affiché serait comparé
  })
  it('minimum et maximum combinés', () => {
    expect(inBudgetRange(A, '5100', '6000', 'salle_fete')).toBe(true)
    expect(inBudgetRange(C, '5100', '6000', 'salle_fete')).toBe(false)
  })
})

describe('isBudgetVoisin / toleranceBudget', () => {
  it('la tolérance d’un budget à l’heure est plus fine que celle d’un loyer', () => {
    expect(toleranceBudget('salle_fete')).toBeLessThan(toleranceBudget(''))
    expect(toleranceBudget('')).toBe(10_000)
  })
  it('salle juste au-dessus du budget : proposée comme voisine ; très au-dessus : non', () => {
    expect(isBudgetVoisin(A, '', '5000', 'salle_fete')).toBe(true) // 5 625 ≤ 5 000 + 2 000
    expect(isBudgetVoisin(B, '', '5000', 'salle_fete')).toBe(false) // 10 000 > 7 000
  })
  it('non-régression : un appartement garde la tolérance de 10 000', () => {
    expect(isBudgetVoisin(appart(1, 55000), '', '50000')).toBe(true)
    expect(isBudgetVoisin(appart(1, 61000), '', '50000')).toBe(false)
  })
})

describe('trierParPrix', () => {
  it('salles : classées au prix à l’heure, pas au prix affiché', () => {
    expect(trierParPrix([A, B, C], 'prix_asc', 'salle_fete').map(b => b.id)).toEqual([3, 1, 2])
    expect(trierParPrix([A, B, C], 'prix_desc', 'salle_fete').map(b => b.id)).toEqual([2, 1, 3])
  })
  it('sans type de salle : tri sur le prix affiché, comme avant', () => {
    expect(trierParPrix([A, B, C], 'prix_asc', '').map(b => b.id)).toEqual([2, 3, 1])
  })
  it('ne modifie pas la liste d’origine', () => {
    const liste = [A, B, C]
    trierParPrix(liste, 'prix_asc', 'salle_fete')
    expect(liste.map(b => b.id)).toEqual([1, 2, 3])
  })
})
