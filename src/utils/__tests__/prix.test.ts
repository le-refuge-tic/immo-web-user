import { describe, it, expect } from 'vitest'
import { suffixeUnite, libellePrix } from '../prix'

describe('suffixeUnite', () => {
  it('utilise unite_prix renvoyé par l’API', () => {
    expect(suffixeUnite({ unite_prix: 'nuit' })).toBe('/nuit')
    expect(suffixeUnite({ unite_prix: 'mois' })).toBe('/mois')
    expect(suffixeUnite({ unite_prix: 'total' })).toBe('')
  })
  it('repli sur le type et la transaction si unite_prix est absent', () => {
    expect(suffixeUnite({ type: 'guesthouse', transaction: 'location' })).toBe('/nuit')
    expect(suffixeUnite({ type: 'appart_vide', transaction: 'location' })).toBe('/mois')
    expect(suffixeUnite({ type: 'maison', transaction: 'vente' })).toBe('')
  })
})

describe('libellePrix', () => {
  it('par nuit, loyer mensuel ou prix de vente', () => {
    expect(libellePrix({ unite_prix: 'nuit' })).toBe('par nuit')
    expect(libellePrix({ type: 'appart_vide', transaction: 'location' })).toBe('par mois')
    expect(libellePrix({ type: 'terrain', transaction: 'vente' })).toBe('prix de vente')
  })
})

describe('salle de fêtes : prix à l’heure', () => {
  const salle = (duree?: number) => ({
    unite_prix: 'heure',
    type: 'salle_fete',
    details_salle_fete: duree === undefined ? undefined : { duree_heures: duree },
  })

  it('le prix couvre plusieurs heures : « / 8 h »', () => {
    expect(suffixeUnite(salle(8))).toBe(' / 8 h')
  })

  it('une heure ou durée inconnue : « / heure »', () => {
    expect(suffixeUnite(salle(1))).toBe(' / heure')
    expect(suffixeUnite(salle())).toBe(' / heure')
    expect(suffixeUnite({ unite_prix: 'heure', details_salle_fete: null })).toBe(' / heure')
  })

  it('jamais affichée comme un loyer ni comme un prix de vente (risque de la feuille de route)', () => {
    expect(suffixeUnite(salle(8))).not.toContain('mois')
    expect(libellePrix(salle(8))).not.toBe('prix de vente')
    expect(libellePrix(salle(8))).not.toBe('par mois')
  })

  it('libellé : « pour 8 h » ou « par heure »', () => {
    expect(libellePrix(salle(8))).toBe('pour 8 h')
    expect(libellePrix(salle(1))).toBe('par heure')
  })

  it('repli sur le type si unite_prix est absent', () => {
    expect(suffixeUnite({ type: 'salle_fete', transaction: 'location', details_salle_fete: { duree_heures: 6 } })).toBe(' / 6 h')
  })

  it('non-régression : nuit et mois gardent leur forme', () => {
    expect(suffixeUnite({ unite_prix: 'nuit' })).toBe('/nuit')
    expect(suffixeUnite({ unite_prix: 'mois' })).toBe('/mois')
  })
})
