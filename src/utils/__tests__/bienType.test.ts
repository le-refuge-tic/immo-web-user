import { describe, it, expect } from 'vitest'
import { bienTypeLabel } from '../bienType'

describe('bienTypeLabel', () => {
  it('priorise le sous-type', () =>
    expect(bienTypeLabel({ type: 'appart_vide', amenites: { sous_type: 'villa' } })).toBe('Villa'))
  it('retombe sur le type', () => expect(bienTypeLabel({ type: 'terrain' })).toBe('Terrain'))
  it('gère un bien absent', () => expect(bienTypeLabel(null)).toBe('Bien'))
})

describe('bienTypeLabel — salle de fêtes', () => {
  it('une salle de fêtes reste « Salle de fêtes », jamais un appartement', () => {
    expect(bienTypeLabel({ type: 'salle_fete' })).toBe('Salle de fêtes')
    expect(bienTypeLabel({ type: 'salle_fete', amenites: { sous_type: 'appartement' } })).toBe('Salle de fêtes')
  })
})

describe('bienTypeLabel — guesthouse', () => {
  it('une guesthouse reste « Guesthouse » quel que soit son ancien sous-type', () => {
    expect(bienTypeLabel({ type: 'guesthouse', amenites: { sous_type: 'duplex' } })).toBe('Guesthouse')
    expect(bienTypeLabel({ type: 'guesthouse', amenites: { sous_type: 'appartement' } })).toBe('Guesthouse')
  })
})
