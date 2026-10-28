import { describe, it, expect } from 'vitest'
import { suffixeUnite, libellePrix } from '../prix'

describe('suffixeUnite', () => {
  it('utilise unite_prix renvoyé par l’API', () => {
    expect(suffixeUnite({ unite_prix: 'nuit' })).toBe('/nuit')
    expect(suffixeUnite({ unite_prix: 'mois' })).toBe('/mois')
    expect(suffixeUnite({ unite_prix: 'total' })).toBe('')
  })
  it('repli sur le type et la transaction si unite_prix est absent', () => {
    expect(suffixeUnite({ type: 'guesthouse', transaction: 'location' })).toBe('/nuit')
    expect(suffixeUnite({ type: 'appart_vide', transaction: 'location' })).toBe('/mois')
    expect(suffixeUnite({ type: 'maison', transaction: 'vente' })).toBe('')
  })
})

describe('libellePrix', () => {
  it('par nuit, loyer mensuel ou prix de vente', () => {
    expect(libellePrix({ unite_prix: 'nuit' })).toBe('par nuit')
    expect(libellePrix({ type: 'appart_vide', transaction: 'location' })).toBe('par mois')
    expect(libellePrix({ type: 'terrain', transaction: 'vente' })).toBe('prix de vente')
  })
})
