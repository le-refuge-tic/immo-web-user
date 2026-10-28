/* Constantes de la page de recherche */
import type { SortKey } from '../../../utils/searchFilters'

export const BUDGET_TOLERANCE = 10_000
export const PROXIMITY_MAX_KM = 3

export const TRANSACTIONS = [
  { key: '',         label: 'Tous' },
  { key: 'location', label: 'À louer' },
  { key: 'vente',    label: 'À vendre' },
]

export const TYPES = [
  { key: '',              label: 'Tous' },
  { key: 'maison',        label: 'Maison' },
  { key: 'appart_vide',   label: 'Appart. vide' },
  { key: 'appart_meuble', label: 'Appart. meublé' },
  { key: 'terrain',       label: 'Terrain' },
  { key: 'guesthouse',    label: 'Guesthouse' },
]

export const SOUS_TYPES = [
  { key: 'chambre_salon',       label: 'Chambre-Salon' },
  { key: 'entree_coucher',      label: 'Entrée-Coucher' },
  { key: 'appartement',         label: 'Appartement' },
  { key: 'appart_meuble',       label: 'Appart. meublé' },
  { key: 'villa',               label: 'Villa' },
  { key: 'maison_individuelle', label: 'Maison individuelle' },
  { key: 'boutique',            label: 'Boutique' },
  { key: 'terrain',             label: 'Terrain' },
]

export const SORTS: { key: SortKey; label: string }[] = [
  { key: 'pertinence', label: 'Pertinence' },
  { key: 'prix_asc',   label: 'Prix croissant' },
  { key: 'prix_desc',  label: 'Prix décroissant' },
]

export const BUDGET_PRESETS = [
  { label: '< 50K',  max: 50_000 },
  { label: '< 150K', max: 150_000 },
  { label: '< 500K', max: 500_000 },
  { label: '< 1M',   max: 1_000_000 },
  { label: '< 5M',   max: 5_000_000 },
]

/** Taille d'une page de résultats (maximum accepté par l'API). */
export const PAGE_SIZE = 100

export const AUTRES_PAGE_SIZE = 12

/** Guesthouse : équipements clés proposés en filtre (codes du référentiel GET /equipements). */
export const EQUIPEMENTS_CLES = [
  { code: 'wifi',               label: 'Wi-Fi' },
  { code: 'climatisation',      label: 'Climatisation' },
  { code: 'piscine',            label: 'Piscine' },
  { code: 'groupe_electrogene', label: 'Groupe électrogène' },
]

/** Guesthouse : budgets rapides par nuit. */
export const BUDGET_PRESETS_NUIT = [
  { label: '< 15K',  max: 15_000 },
  { label: '< 25K',  max: 25_000 },
  { label: '< 50K',  max: 50_000 },
  { label: '< 100K', max: 100_000 },
]

/** Dernier cran du compteur de voyageurs (« 10+ »). */
export const CAPACITE_MAX_FILTRE = 10
