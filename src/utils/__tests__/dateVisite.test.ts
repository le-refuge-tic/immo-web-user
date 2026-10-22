import { describe, expect, it } from 'vitest'
import { dateEffectiveVisite, minutesAvantVisite } from '../dateVisite'

const NOW = Date.parse('2026-10-22T10:00:00.000Z')
const DANS_1H = '2026-10-22T11:00:00.000Z'
const DANS_2H = '2026-10-22T12:00:00.000Z'
const DANS_3H = '2026-10-22T13:00:00.000Z'

describe('dateEffectiveVisite', () => {
  it('privilégie la contre-proposition (conservée une fois acceptée)', () => {
    expect(dateEffectiveVisite({ date_contre_proposee: DANS_2H, date_souhaitee: DANS_1H })).toBe(DANS_2H)
  })

  it('retombe sur la date souhaitée sans contre-proposition', () => {
    expect(dateEffectiveVisite({ date_contre_proposee: null, date_souhaitee: DANS_1H })).toBe(DANS_1H)
  })

  it("retombe sur creneau.date_debut (ancien flux) quand aucune autre date n'existe", () => {
    expect(dateEffectiveVisite({ creneau: { date_debut: DANS_3H } })).toBe(DANS_3H)
  })

  it('ignore le champ inexistant creneau.debut', () => {
    const v = { creneau: { debut: DANS_3H } } as unknown as Parameters<typeof dateEffectiveVisite>[0]
    expect(dateEffectiveVisite(v)).toBeNull()
  })

  it('renvoie null sans aucune date', () => {
    expect(dateEffectiveVisite({})).toBeNull()
    expect(dateEffectiveVisite({ creneau: null })).toBeNull()
  })
})

describe('minutesAvantVisite', () => {
  it("compte les minutes jusqu'à la date retenue", () => {
    expect(minutesAvantVisite({ date_souhaitee: DANS_1H }, NOW)).toBe(60)
    expect(minutesAvantVisite({ date_souhaitee: DANS_1H, date_contre_proposee: DANS_2H }, NOW)).toBe(120)
  })

  it("utilise le créneau de l'ancien flux", () => {
    expect(minutesAvantVisite({ creneau: { date_debut: DANS_3H } }, NOW)).toBe(180)
  })

  it('est négatif quand la visite est passée', () => {
    expect(minutesAvantVisite({ date_souhaitee: '2026-10-22T09:30:00.000Z' }, NOW)).toBe(-30)
  })

  it('renvoie null sans date ou avec une date invalide', () => {
    expect(minutesAvantVisite({}, NOW)).toBeNull()
    expect(minutesAvantVisite({ date_souhaitee: 'pas une date' }, NOW)).toBeNull()
  })
})
