import { describe, expect, it } from 'vitest'
import { TYPES_ALERTE_BIEN, toastPourAlerte } from '../typesAlertes'

describe('lot 8 : alertes liées aux biens', () => {
  it('les décisions de modération ouvrent le bien', () => {
    for (const t of ['bien_approuve', 'bien_rejete', 'bien_conditionnel', 'bien_revoque', 'modification_approuvee', 'modification_rejetee', 'type_bien_change']) {
      expect(TYPES_ALERTE_BIEN.has(t)).toBe(true)
    }
  })

  it('toast pour une décision reçue en direct, avec le bon ton', () => {
    expect(toastPourAlerte({ raison: 'nouvelle', type: 'bien_approuve', titre: '✅ Annonce approuvée', corps: 'Visible.' }))
      .toEqual({ message: '✅ Annonce approuvée — Visible.', ton: 'success' })
    expect(toastPourAlerte({ raison: 'nouvelle', type: 'bien_revoque', titre: 'Retirée', corps: 'Motif : loué' })?.ton).toBe('error')
    expect(toastPourAlerte({ raison: 'nouvelle', type: 'bien_conditionnel', titre: 'Sous conditions', corps: '' })).toEqual({ message: 'Sous conditions', ton: 'info' })
  })

  it('pas de toast pour une lecture, un autre type ou un événement incomplet', () => {
    expect(toastPourAlerte({ raison: 'lue' })).toBeNull()
    expect(toastPourAlerte({ raison: 'nouvelle', type: 'visite_demande', titre: 'Visite' })).toBeNull()
    expect(toastPourAlerte({ raison: 'nouvelle', type: 'bien_approuve' })).toBeNull()
    expect(toastPourAlerte(null)).toBeNull()
  })
})
