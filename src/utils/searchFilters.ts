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
  /** Nombre de pièces (chambres + salons) : '1' à '4' exact, '5' = « 5 et plus », '' = indifférent. */
  pieces: string
  superficieMin: string
  superficieMax: string
  sortBy: SortKey
  /** Guesthouse (voyageurs) ou salle de fêtes (personnes) : capacité d'accueil minimale ('' = indifférent). */
  capaciteMin: string
  /** Guesthouse ou salle de fêtes : codes d'équipements exigés (le bien doit tous les avoir). */
  equipements: string[]
  /** Guesthouse : avec garage uniquement. */
  garage: boolean
  /** Salle de fêtes : code d'un type d'événement accepté (« mariage »…), '' = indifférent. */
  evenement: string
  /** Salle de fêtes : avec parking uniquement. */
  parking: boolean
}

/** Nombre maximal d'équipements combinables dans un filtre (borne côté API : 20). */
const EQUIPEMENTS_MAX = 10

const MAX_TEXT = 100
const MAX_DIGITS = 12
/** Dernier cran du compteur de pièces, qui signifie « 5 et plus ». */
export const PIECES_MAX = 5

const text = (value: string | null) => (value ?? '').trim().slice(0, MAX_TEXT)
/** Identifiant technique (`maison`, `chambre_salon`…) : minuscules, chiffres et tiret bas seulement. */
const identifier = (value: string | null) => {
  const v = (value ?? '').trim().slice(0, 50)
  return /^[a-z0-9_]+$/.test(v) ? v : ''
}
const digits = (value: string | null) => (value ?? '').replace(/\D/g, '').slice(0, MAX_DIGITS)
/** Nombre de pièces lu dans l'URL : 0 ou illisible = indifférent, au-delà du dernier cran = « 5+ ». */
const pieces = (value: string | null) => {
  const n = Number(digits(value))
  return n >= 1 ? String(Math.min(n, PIECES_MAX)) : ''
}
const isSortKey = (value: string | null): value is SortKey => SORT_KEYS.includes(value as SortKey)
/** Codes d'équipements séparés par des virgules : assainis, dédoublonnés, bornés. */
const equipements = (value: string | null) =>
  [...new Set((value ?? '').split(',').map(identifier).filter(Boolean))].slice(0, EQUIPEMENTS_MAX)
/** Plafond de la capacité lue dans l'URL : celui de l'API (une salle accueille des centaines de personnes). */
export const CAPACITE_MAX_URL = 5000
const capacite = (value: string | null) => {
  const n = Number(digits(value))
  return n >= 1 ? String(Math.min(n, CAPACITE_MAX_URL)) : ''
}

export function readSearchFilters(params: URLSearchParams): SearchFilters {
  const sort = params.get('tri')
  return {
    q: text(params.get('q')),
    transaction: identifier(params.get('transaction')),
    type: identifier(params.get('type')),
    prixMin: digits(params.get('prix_min')),
    prixMax: digits(params.get('prix_max')),
    sousType: identifier(params.get('sous_type')),
    pieces: pieces(params.get('pieces')),
    superficieMin: digits(params.get('superficie_min')),
    superficieMax: digits(params.get('superficie_max')),
    sortBy: isSortKey(sort) ? sort : 'pertinence',
    capaciteMin: capacite(params.get('capacite_min')),
    equipements: equipements(params.get('equipements')),
    garage: ['1', 'true'].includes(params.get('garage') ?? ''),
    evenement: identifier(params.get('evenement')),
    parking: ['1', 'true'].includes(params.get('parking') ?? ''),
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
    ['pieces', filters.pieces],
    ['superficie_min', filters.superficieMin],
    ['superficie_max', filters.superficieMax],
    ['tri', filters.sortBy === 'pertinence' ? '' : filters.sortBy],
    ['capacite_min', filters.capaciteMin],
    ['equipements', filters.equipements.join(',')],
    ['garage', filters.garage ? '1' : ''],
    ['evenement', filters.evenement],
    ['parking', filters.parking ? '1' : ''],
  ]
  return Object.fromEntries(entries.filter(([, value]) => value !== ''))
}

/** Critère envoyé à l'API : nombre exact de pièces, ou minimum pour le dernier cran (« 5+ »). */
export function piecesQuery(value: string): { pieces?: number; pieces_min?: number } {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1) return {}
  return n >= PIECES_MAX ? { pieces_min: PIECES_MAX } : { pieces: n }
}

/** Libellé du filtre actif : « 3 pièces », « 5 pièces et + ». */
export function piecesLabel(value: string): string {
  const n = Number(value)
  if (n >= PIECES_MAX) return `${PIECES_MAX} pièces et +`
  return `${n} pièce${n > 1 ? 's' : ''}`
}
