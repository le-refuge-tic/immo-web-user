import { describe, it, expect } from 'vitest'
import { readSearchFilters, writeSearchFilters } from '../searchFilters'

const parse = (query: string) => readSearchFilters(new URLSearchParams(query))

describe('readSearchFilters', () => {
  it('URL vide : tout est vide et le tri est « pertinence »', () => {
    expect(parse('')).toEqual({
      q: '', transaction: '', type: '', prixMin: '', prixMax: '', sousType: '',
      chambresMin: '', salonsMin: '', superficieMin: '', superficieMax: '', sortBy: 'pertinence',
    })
  })

  it('lit tous les filtres, y compris chambres, salons, superficie et tri', () => {
    const f = parse('q=Akpakpa&transaction=location&type=maison&prix_min=30000&prix_max=90000&sous_type=studio&chambres_min=2&salons_min=1&superficie_min=100&superficie_max=400&tri=prix_asc')
    expect(f).toMatchObject({ q: 'Akpakpa', chambresMin: '2', salonsMin: '1', superficieMin: '100', superficieMax: '400', sortBy: 'prix_asc' })
  })

  it('assainit les nombres (chiffres seulement) et ignore un tri inconnu', () => {
    const f = parse('prix_min=12a3&chambres_min=%3Cscript%3E&tri=hack')
    expect(f.prixMin).toBe('123')
    expect(f.chambresMin).toBe('')
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
    const f = parse('q=Akpakpa&type=maison&chambres_min=2&superficie_max=400&tri=prix_desc')
    expect(readSearchFilters(new URLSearchParams(writeSearchFilters(f)))).toEqual(f)
  })
})
