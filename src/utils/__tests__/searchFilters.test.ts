import { describe, it, expect } from 'vitest'
import { readSearchFilters, writeSearchFilters, piecesQuery } from '../searchFilters'

const parse = (query: string) => readSearchFilters(new URLSearchParams(query))

describe('readSearchFilters', () => {
  it('URL vide : tout est vide et le tri est « pertinence »', () => {
    expect(parse('')).toEqual({
      q: '', transaction: '', type: '', prixMin: '', prixMax: '', sousType: '',
      pieces: '', superficieMin: '', superficieMax: '', sortBy: 'pertinence',
      capaciteMin: '', equipements: [], garage: false,
    })
  })

  it('lit tous les filtres, y compris pièces, superficie et tri', () => {
    const f = parse('q=Akpakpa&transaction=location&type=maison&prix_min=30000&prix_max=90000&sous_type=studio&pieces=3&superficie_min=100&superficie_max=400&tri=prix_asc')
    expect(f).toMatchObject({ q: 'Akpakpa', pieces: '3', superficieMin: '100', superficieMax: '400', sortBy: 'prix_asc' })
  })

  it('nombre de pièces : 0 ignoré, au-delà de 5 ramené à « 5+ »', () => {
    expect(parse('pieces=0').pieces).toBe('')
    expect(parse('pieces=12').pieces).toBe('5')
  })

  it('assainit les nombres (chiffres seulement) et ignore un tri inconnu', () => {
    const f = parse('prix_min=12a3&pieces=%3Cscript%3E&tri=hack')
    expect(f.prixMin).toBe('123')
    expect(f.pieces).toBe('')
    expect(f.sortBy).toBe('pertinence')
  })

  it('ignore un type ou une transaction qui n\'est pas un identifiant', () => {
    const f = parse('type=zzz%20OR%201=1&transaction=%3Cb%3E&sous_type=Chambre Salon')
    expect(f.type).toBe('')
    expect(f.transaction).toBe('')
    expect(f.sousType).toBe('')
  })

  it('borne la longueur du texte', () => {
    expect(parse(`q=${'a'.repeat(500)}`).q).toHaveLength(100)
  })
})

describe('writeSearchFilters', () => {
  it('omet les valeurs vides et le tri par défaut', () => {
    const f = { ...parse(''), q: 'Cotonou', sortBy: 'pertinence' as const }
    expect(writeSearchFilters(f)).toEqual({ q: 'Cotonou' })
  })

  it('aller-retour : relire ce qu\'on a écrit redonne les mêmes filtres', () => {
    const f = parse('q=Akpakpa&type=maison&pieces=2&superficie_max=400&tri=prix_desc')
    expect(readSearchFilters(new URLSearchParams(writeSearchFilters(f)))).toEqual(f)
  })
})

describe('piecesQuery', () => {
  it('1 à 4 : nombre exact ; 5 : « 5 et plus » ; vide : aucun critère', () => {
    expect(piecesQuery('3')).toEqual({ pieces: 3 })
    expect(piecesQuery('5')).toEqual({ pieces_min: 5 })
    expect(piecesQuery('')).toEqual({})
  })
})

describe('filtres guesthouse', () => {
  it('lit capacité, équipements (assainis, sans doublon) et garage', () => {
    const f = parse('type=guesthouse&capacite_min=4&equipements=wifi,piscine,wifi,%3Cx%3E&garage=1')
    expect(f).toMatchObject({ capaciteMin: '4', equipements: ['wifi', 'piscine'], garage: true })
  })
  it('écrit les filtres guesthouse et omet les valeurs vides', () => {
    const p = writeSearchFilters({ ...parse(''), type: 'guesthouse', capaciteMin: '3', equipements: ['wifi'], garage: true })
    expect(p).toMatchObject({ type: 'guesthouse', capacite_min: '3', equipements: 'wifi', garage: '1' })
    expect(writeSearchFilters(parse(''))).toEqual({})
  })
})
