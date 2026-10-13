/**
 * FE-B-009 — Filtres de la recherche portés par l'URL : un lien partagé, un
 * rechargement ou le bouton Retour retrouvent exactement la même recherche.
 * Toute valeur lue dans l'URL est assainie (jamais de confiance dans le texte reçu).
 */
export const SORT_KEYS = ['pertinence', 'prix_asc', 'prix_desc'] as const
export type SortKey = (typeof SORT_KEYS)[number]

export interface SearchFilters {
  q: string
  transaction: string
  type: string
  prixMin: string
  prixMax: string
  sousType: string
  chambresMin: string
  salonsMin: string
  superficieMin: string
  superficieMax: string
  sortBy: SortKey
}

const MAX_TEXT = 100
const MAX_DIGITS = 12

const text = (value: string | null) => (value ?? '').trim().slice(0, MAX_TEXT)
/** Identifiant technique (`maison`, `chambre_salon`…) : minuscules, chiffres et tiret bas seulement. */
const identifier = (value: string | null) => {
  const v = (value ?? '').trim().slice(0, 50)
  return /^[a-z0-9_]+$/.test(v) ? v : ''
}
const digits = (value: string | null) => (value ?? '').replace(/\D/g, '').slice(0, MAX_DIGITS)
const isSortKey = (value: string | null): value is SortKey => SORT_KEYS.includes(value as SortKey)

export function readSearchFilters(params: URLSearchParams): SearchFilters {
  const sort = params.get('tri')
  return {
    q: text(params.get('q')),
    transaction: identifier(params.get('transaction')),
    type: identifier(params.get('type')),
    prixMin: digits(params.get('prix_min')),
    prixMax: digits(params.get('prix_max')),
    sousType: identifier(params.get('sous_type')),
    chambresMin: digits(params.get('chambres_min')),
    salonsMin: digits(params.get('salons_min')),
    superficieMin: digits(params.get('superficie_min')),
    superficieMax: digits(params.get('superficie_max')),
    sortBy: isSortKey(sort) ? sort : 'pertinence',
  }
}

/** Paramètres d'URL d'un état de filtres : les valeurs vides et le tri par défaut sont omis. */
export function writeSearchFilters(filters: SearchFilters): Record<string, string> {
  const entries: Array<[string, string]> = [
    ['q', filters.q],
    ['transaction', filters.transaction],
    ['type', filters.type],
    ['prix_min', filters.prixMin],
    ['prix_max', filters.prixMax],
    ['sous_type', filters.sousType],
    ['chambres_min', filters.chambresMin],
    ['salons_min', filters.salonsMin],
    ['superficie_min', filters.superficieMin],
    ['superficie_max', filters.superficieMax],
    ['tri', filters.sortBy === 'pertinence' ? '' : filters.sortBy],
  ]
  return Object.fromEntries(entries.filter(([, value]) => value !== ''))
}
