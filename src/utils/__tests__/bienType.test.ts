import { describe, it, expect } from 'vitest'
import { bienTypeLabel } from '../bienType'

describe('bienTypeLabel', () => {
  it('priorise le sous-type', () =>
    expect(bienTypeLabel({ type: 'appart_vide', amenites: { sous_type: 'villa' } })).toBe('Villa'))
  it('retombe sur le type', () => expect(bienTypeLabel({ type: 'terrain' })).toBe('Terrain'))
  it('gère un bien absent', () => expect(bienTypeLabel(null)).toBe('Bien'))
})
