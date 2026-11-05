import { describe, expect, it } from 'vitest'
import { lignesTarifsMeuble } from '../helpers'

describe('lignesTarifsMeuble', () => {
  it('sans tarifs meublés : aucune ligne', () => {
    expect(lignesTarifsMeuble(null)).toEqual([])
    expect(lignesTarifsMeuble({})).toEqual([])
  })

  it('mois, nuit, heure puis tarifs personnalisés ; montants vides ignorés', () => {
    const lignes = lignesTarifsMeuble({
      tarifs_meuble: { prix_long_sejour: 400000, prix_sejour_restreint: '25000', prix_heure: 0, autres: [{ label: 'Semaine', prix: 120000 }, { prix: 0 }] },
    })
    expect(lignes).toEqual([
      { label: 'Long séjour', montant: 400000, unite: '/mois' },
      { label: 'Court séjour', montant: 25000, unite: '/nuit' },
      { label: 'Semaine', montant: 120000, unite: '' },
    ])
  })
})
