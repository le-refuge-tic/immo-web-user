import { describe, expect, it } from 'vitest'
import { isDatePassee, isEchouee, isUrgente, minutesAvant } from '../VisiteCard'
import type { VisiteReservation } from '../../../../types/proprietaire'

const NOW = Date.parse('2026-10-22T10:00:00.000Z')
const iso = (minutes: number) => new Date(NOW + minutes * 60000).toISOString()
const visite = (over: Partial<VisiteReservation>): VisiteReservation =>
  ({ id: 1, statut: 'confirmee', ...over }) as VisiteReservation

describe('minutesAvant (réservations du propriétaire)', () => {
  it('lit la date souhaitée', () => {
    expect(minutesAvant(visite({ date_souhaitee: iso(90) }), NOW)).toBe(90)
  })

  it('préfère la contre-proposition', () => {
    expect(minutesAvant(visite({ date_souhaitee: iso(500), date_contre_proposee: iso(45) }), NOW)).toBe(45)
  })

  it("utilise creneau.date_debut quand l'API ne renvoie aucune autre date", () => {
    expect(minutesAvant(visite({ creneau: { id: 3, date_debut: iso(30), date_fin: iso(60) } }), NOW)).toBe(30)
  })

  it("ignore date_confirmee, champ absent de l'entité Visite du backend", () => {
    const v = visite({ date_souhaitee: iso(90), ...{ date_confirmee: iso(10) } })
    expect(minutesAvant(v, NOW)).toBe(90)
  })

  it('renvoie null sans date', () => {
    expect(minutesAvant(visite({}), NOW)).toBeNull()
  })
})

describe('isUrgente', () => {
  it('vrai pour une visite confirmée dans moins de 125 min', () => {
    expect(isUrgente(visite({ date_souhaitee: iso(100) }), NOW)).toBe(true)
  })

  it('vrai quand seule la contre-proposition est proche', () => {
    expect(isUrgente(visite({ date_souhaitee: iso(1000), date_contre_proposee: iso(60) }), NOW)).toBe(true)
  })

  it('vrai pour une visite de l\'ancien flux (créneau uniquement)', () => {
    expect(isUrgente(visite({ creneau: { id: 3, date_debut: iso(60), date_fin: iso(90) } }), NOW)).toBe(true)
  })

  it('faux au-delà de 125 min, pour une date passée ou un autre statut', () => {
    expect(isUrgente(visite({ date_souhaitee: iso(200) }), NOW)).toBe(false)
    expect(isUrgente(visite({ date_souhaitee: iso(-5) }), NOW)).toBe(false)
    expect(isUrgente(visite({ statut: 'annulee', date_souhaitee: iso(60) }), NOW)).toBe(false)
  })

  it('faux sans date', () => {
    expect(isUrgente(visite({}), NOW)).toBe(false)
  })
})

describe('isDatePassee et isEchouee', () => {
  const dansLePasse = new Date(Date.now() - 3600_000).toISOString()
  const dansLeFutur = new Date(Date.now() + 3600_000).toISOString()

  it("lisent le créneau de l'ancien flux", () => {
    const passe = visite({ creneau: { id: 1, date_debut: dansLePasse, date_fin: dansLePasse } })
    const futur = visite({ creneau: { id: 1, date_debut: dansLeFutur, date_fin: dansLeFutur } })
    expect(isDatePassee(passe)).toBe(true)
    expect(isEchouee(passe)).toBe(true)
    expect(isDatePassee(futur)).toBe(false)
    expect(isEchouee(futur)).toBe(false)
  })

  it('restent faux sans date', () => {
    expect(isDatePassee(visite({}))).toBe(false)
    expect(isEchouee(visite({}))).toBe(false)
  })
})
