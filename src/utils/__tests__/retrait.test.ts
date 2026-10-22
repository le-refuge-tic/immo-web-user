import { describe, expect, it } from 'vitest'
import { messageMontantRetrait, RETRAIT_MINIMUM } from '../retrait'

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
