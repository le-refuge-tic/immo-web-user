import { describe, it, expect } from 'vitest'
import { fraisVisiteBien, fraisVisiteAPayer, estVisiteGratuite, libelleFraisVisite } from '../fraisVisite'

/** Même barème que le backend (immo-backend/src/visites/frais-visite.util.ts). */
describe('fraisVisiteBien (FE-B-012)', () => {
  it('montant renseigné sur le bien', () => {
    expect(fraisVisiteBien({ type: 'maison', frais_visite: 2000 })).toBe(2000)
    expect(fraisVisiteBien({ type: 'maison', frais_visite: '1500.00' })).toBe(1500)
  })

  it('0 ou absent : barème (5 000 terrain, 500 sinon)', () => {
    expect(fraisVisiteBien({ type: 'terrain', frais_visite: 0 })).toBe(5000)
    expect(fraisVisiteBien({ type: 'maison', frais_visite: 0 })).toBe(500)
    expect(fraisVisiteBien({ type: 'appartement_vide' })).toBe(500)
  })

  it('visite gratuite explicite : 0, quel que soit le montant', () => {
    expect(fraisVisiteBien({ type: 'terrain', frais_visite: 3000, amenites: { visite_gratuite: true } })).toBe(0)
    expect(estVisiteGratuite({ amenites: { visite_gratuite: true } })).toBe(true)
    expect(estVisiteGratuite({ amenites: { visite_gratuite: 'oui' } })).toBe(false)
    expect(estVisiteGratuite({})).toBe(false)
  })
})

describe('fraisVisiteAPayer', () => {
  it('montant figé sur la visite', () => {
    expect(fraisVisiteAPayer({ frais_visite: 2040, bien: { type: 'maison', frais_visite: 2000 } })).toBe(2040)
  })

  it('ancienne visite à 0 : barème du bien', () => {
    expect(fraisVisiteAPayer({ frais_visite: 0, bien: { type: 'terrain', frais_visite: 0 } })).toBe(5000)
    expect(fraisVisiteAPayer({ frais_visite: 0, bien: { type: 'maison', amenites: { visite_gratuite: true } } })).toBe(0)
  })

  it('visite à 0 sans bien chargé : barème général', () => {
    expect(fraisVisiteAPayer({ frais_visite: 0 })).toBe(500)
  })
})

describe('libelleFraisVisite', () => {
  it('« Gratuite » à 0, sinon le montant formaté', () => {
    expect(libelleFraisVisite(0)).toBe('Gratuite')
    expect(libelleFraisVisite(2000).replace(/\s/g, ' ')).toBe('2 000 FCFA')
  })
})
