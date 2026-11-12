import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { infoCouverture } from '../infoCouverture'
import { VisiteCard } from '../VisiteCard'
import type { Visite } from '../../../../types/api'

const noop = () => {}
const handlers = {
  onAnnuler: noop, onAccepterCP: noop, onRefuserCP: noop, onReproposer: noop, onMarquerEffectuee: noop,
  onIntegration: noop, onPay: noop, onMessage: noop, onContacterEchouee: noop, onFeedback: noop, onPayIntegration: noop,
}
const visite = (v: Partial<Visite>) => ({ id: 3, statut: 'confirmee', ...v }) as Visite
const MAINTENANT = Date.parse('2026-11-12T08:00:00Z')

describe('infoCouverture', () => {
  it('signale une visite offerte et une visite reportée', () => {
    expect(infoCouverture(visite({ couverture: 'bonus' }), MAINTENANT)?.texte).toMatch(/^Visite offerte/)
    expect(infoCouverture(visite({ couverture: 'report' }), MAINTENANT)?.texte).toMatch(/^Visite reportée/)
  })

  it('rappelle le report encore valable sur une visite annulée', () => {
    const v = visite({ statut: 'annulee', report_jusquau: '2026-12-12T08:00:00Z' })
    expect(infoCouverture(v, MAINTENANT)?.texte).toMatch(/sans payer jusqu'au 12 décembre/)
  })

  it('se tait pour un report expiré, une visite annulée offerte ou une visite payée normalement', () => {
    expect(infoCouverture(visite({ statut: 'annulee', report_jusquau: '2026-11-01T08:00:00Z' }), MAINTENANT)).toBeNull()
    expect(infoCouverture(visite({ statut: 'annulee', couverture: 'bonus' }), MAINTENANT)).toBeNull()
    expect(infoCouverture(visite({ paiement_effectue: true }), MAINTENANT)).toBeNull()
  })

  it('apparaît sur la carte de la visite', () => {
    const html = renderToStaticMarkup(<VisiteCard visite={visite({ couverture: 'bonus', paiement_effectue: true })} {...handlers} />)
    expect(html).toContain('Visite offerte')
  })
})
