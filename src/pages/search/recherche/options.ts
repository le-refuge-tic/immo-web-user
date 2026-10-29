/* Constantes de la page de recherche */
import type { SortKey } from '../../../utils/searchFilters'

export const BUDGET_TOLERANCE = 10_000
/** Écart toléré pour un budget à l'heure (salles de fêtes), où les prix sont bien plus bas. */
export const BUDGET_TOLERANCE_HEURE = 2_000
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
  { key: 'salle_fete',    label: 'Salle de fêtes' },
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

/** Salle de fêtes : types d'événements proposés en filtre (codes du référentiel GET /evenements-types). */
export const EVENEMENTS_CLES = [
  { code: 'mariage',      label: 'Mariage' },
  { code: 'anniversaire', label: 'Anniversaire' },
  { code: 'bapteme',      label: 'Baptême' },
  { code: 'conference',   label: 'Conférence' },
  { code: 'seminaire',    label: 'Séminaire' },
  { code: 'soiree',       label: 'Soirée' },
]

/** Salle de fêtes : équipements clés proposés en filtre (le parking est un champ, traité à part). */
export const EQUIPEMENTS_CLES_SALLE = [
  { code: 'sonorisation',       label: 'Sono' },
  { code: 'climatisation',      label: 'Climatisation' },
  { code: 'groupe_electrogene', label: 'Groupe électrogène' },
]

/** Salle de fêtes : capacités minimales rapides (personnes). */
export const CAPACITES_SALLE = [50, 100, 200, 300, 500]

/** Salle de fêtes : budgets rapides par heure. */
export const BUDGET_PRESETS_HEURE = [
  { label: '< 3K',  max: 3_000 },
  { label: '< 5K',  max: 5_000 },
  { label: '< 10K', max: 10_000 },
  { label: '< 20K', max: 20_000 },
]
