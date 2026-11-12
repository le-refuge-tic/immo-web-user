import { describe, expect, it } from 'vitest'
import { politiqueAnnulation } from '../annulationVisite'

const MAINTENANT = Date.parse('2026-11-12T08:00:00Z')
const dansMinutes = (min: number) => new Date(MAINTENANT + min * 60_000).toISOString()
const payee = (minutesAvant: number, extra = {}) => ({
  paiement_effectue: true,
  frais_visite: '500.00',
  date_souhaitee: dansMinutes(minutesAvant),
  ...extra,
})

describe('politiqueAnnulation — grille de remboursement', () => {
  it.each([
    [48 * 60, 100, 500, true],
    [24 * 60, 100, 500, true],
    [24 * 60 - 1, 70, 350, false],
    [2 * 60, 70, 350, false],
    [2 * 60 - 1, 50, 250, false],
    [60, 50, 250, false],
    [59, 0, 0, false],
  ])('%i min avant : %i %% (%i F), report %s', (minutes, pourcentage, montant, reportPossible) => {
    expect(politiqueAnnulation(payee(minutes), MAINTENANT)).toEqual({
      fraisPayes: 500, pourcentage, montant, reportPossible,
    })
  })

  it('suit la contre-proposition acceptée plutôt que la date souhaitée', () => {
    const v = payee(48 * 60, { date_contre_proposee: dansMinutes(90) })
    expect(politiqueAnnulation(v, MAINTENANT).pourcentage).toBe(50)
  })

  it('visite non payée, offerte ou gratuite : rien à rembourser ni à reporter', () => {
    for (const v of [
      payee(48 * 60, { paiement_effectue: false }),
      payee(48 * 60, { couverture: 'bonus', frais_visite: 0 }),
      payee(48 * 60, { frais_visite: 0 }),
    ]) {
      expect(politiqueAnnulation(v, MAINTENANT)).toEqual({ fraisPayes: 0, pourcentage: 0, montant: 0, reportPossible: false })
    }
  })

  it('une visite déjà reportée reste remboursable mais ne se reporte plus', () => {
    expect(politiqueAnnulation(payee(48 * 60, { couverture: 'report' }), MAINTENANT)).toMatchObject({
      montant: 500, reportPossible: false,
    })
  })
})
