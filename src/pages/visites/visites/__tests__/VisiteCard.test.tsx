import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { VisiteCard } from '../VisiteCard'
import { isDatePasseeVisite, isEchoueeVisite } from '../helpers'
import type { Visite } from '../../../../types/api'

const noop = () => {}
const handlers = {
  onAnnuler: noop, onAccepterCP: noop, onRefuserCP: noop, onReproposer: noop, onMarquerEffectuee: noop,
  onIntegration: noop, onPay: noop, onMessage: noop, onContacterEchouee: noop, onFeedback: noop, onPayIntegration: noop,
}
const rendre = (v: Partial<Visite>) =>
  renderToStaticMarkup(<VisiteCard visite={{ id: 5, statut: 'confirmee', ...v } as Visite} {...handlers} />)

const dans = (jours: number) => new Date(Date.now() + jours * 86_400_000).toISOString()
const BIEN = { id: 9, type: 'maison', localisation: { ville: 'Cotonou', quartier: 'Akpakpa' } } as unknown as Visite['bien']
const integrationAPayer = { statut: 'effectuee', client_decision_integration: true, paiement_integration_effectue: false } as const
const BOUTON = 'Payer l&#x27;intégration'

describe("VisiteCard : bouton « Payer l'intégration » (garde sur le bien)", () => {
  it('apparaît quand le bien est présent', () => {
    expect(rendre({ ...integrationAPayer, bien: BIEN })).toContain(BOUTON)
  })

  it('est masqué quand le bien est absent (évite /paiement-integration/undefined)', () => {
    expect(rendre({ ...integrationAPayer, bien: undefined })).not.toContain(BOUTON)
    expect(rendre({ ...integrationAPayer, bien: null as unknown as undefined })).not.toContain(BOUTON)
  })
})

describe('VisiteCard : date affichée', () => {
  const fmt = (iso: string) => {
    const d = new Date(iso)
    const p = (n: number) => String(n).padStart(2, '0')
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} à ${p(d.getHours())}h${p(d.getMinutes())}`
  }

  it("lit creneau.date_debut quand la visite n'a pas de date souhaitée (ancien flux)", () => {
    const debut = dans(2)
    const html = rendre({ bien: BIEN, creneau: { id: 1, date_debut: debut, date_fin: debut } })
    expect(html).toContain(fmt(debut))
  })

  it("affiche la date contre-proposée acceptée d'une visite confirmée", () => {
    const souhaitee = dans(1)
    const contre = dans(3)
    const html = rendre({ bien: BIEN, date_souhaitee: souhaitee, date_contre_proposee: contre })
    expect(html).toContain(fmt(contre))
    expect(html).not.toContain(fmt(souhaitee))
  })

  it("affiche la date souhaitée en l'absence de contre-proposition", () => {
    const souhaitee = dans(1)
    expect(rendre({ bien: BIEN, date_souhaitee: souhaitee })).toContain(fmt(souhaitee))
  })

  it('garde le repli « -- » sans aucune date', () => {
    expect(rendre({ bien: BIEN })).toContain('Prévue : --')
  })
})

describe('helpers de date des visites du client', () => {
  const passe = dans(-1)
  const futur = dans(1)

  it("isDatePasseeVisite lit le créneau de l'ancien flux", () => {
    expect(isDatePasseeVisite({ creneau: { date_debut: passe } })).toBe(true)
    expect(isDatePasseeVisite({ creneau: { date_debut: futur } })).toBe(false)
    expect(isDatePasseeVisite({})).toBe(false)
  })

  it("isEchoueeVisite lit le créneau de l'ancien flux (2 h de grâce)", () => {
    expect(isEchoueeVisite({ statut: 'confirmee', creneau: { date_debut: passe } })).toBe(true)
    expect(isEchoueeVisite({ statut: 'confirmee', creneau: { date_debut: futur } })).toBe(false)
    expect(isEchoueeVisite({ statut: 'confirmee' })).toBe(false)
  })
})
