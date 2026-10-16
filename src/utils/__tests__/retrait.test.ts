import { describe, it, expect } from 'vitest'
import { messageMontantRetrait } from '../retrait'

describe('messageMontantRetrait', () => {
  it('champ vide : aucun message', () => expect(messageMontantRetrait('', 10000)).toBe(''))
  it('montant valide : aucun message', () => expect(messageMontantRetrait('5000', 10000)).toBe(''))
  it('montant égal au solde : valide', () => expect(messageMontantRetrait('10000', 10000)).toBe(''))
  it('montant supérieur au solde : message avec le solde', () => {
    expect(messageMontantRetrait('20000', 10000)).toContain('dépasse votre solde disponible')
  })
  it('sous le minimum', () => expect(messageMontantRetrait('100', 10000)).toContain('minimum'))
  it('valeur négative ou non numérique', () => {
    expect(messageMontantRetrait('-5', 10000)).toContain('chiffres')
    expect(messageMontantRetrait('abc', 10000)).toContain('chiffres')
  })
})
