import { describe, expect, it } from 'vitest'
import { peutPayerVisite } from '../helpers'
import type { Visite } from '../../../../types/api'

const dans = (heures: number) => new Date(Date.now() + heures * 3_600_000).toISOString()
const visite = (v: Partial<Visite>) => ({ statut: 'confirmee', paiement_effectue: false, date_souhaitee: dans(24), ...v }) as Visite

describe('peutPayerVisite', () => {
  it('autorise le paiement d\'une visite confirmée à venir et non payée', () => {
    expect(peutPayerVisite(visite({}))).toBe(true)
  })

  it('refuse une visite déjà payée', () => {
    expect(peutPayerVisite(visite({ paiement_effectue: true }))).toBe(false)
  })

  it('refuse une visite pas encore confirmée (même règle que le backend)', () => {
    expect(peutPayerVisite(visite({ statut: 'en_attente' }))).toBe(false)
    expect(peutPayerVisite(visite({ statut: 'contre_proposee' }))).toBe(false)
  })

  it('refuse une visite échouée, annulée ou effectuée', () => {
    expect(peutPayerVisite(visite({ statut: 'echouee' }))).toBe(false)
    expect(peutPayerVisite(visite({ date_souhaitee: dans(-5) }))).toBe(false)
    expect(peutPayerVisite(visite({ statut: 'annulee' }))).toBe(false)
    expect(peutPayerVisite(visite({ statut: 'effectuee' }))).toBe(false)
  })
})
