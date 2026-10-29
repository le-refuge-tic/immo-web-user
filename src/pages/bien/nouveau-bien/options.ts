import type { CSSProperties } from 'react'

export const normalizeStr = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const BLUE = '#4160F2'

export type TarifCustom = { label: string; prix: string }
export type DetailCustom = { label: string; valeur: string }

export const TYPES_BIEN = [
  { key: 'entree_coucher', label: 'Entrée-Coucher' },
  { key: 'chambre_salon', label: 'Chambre-Salon' },
  { key: 'appartement', label: 'Appartement' },
  { key: 'villa', label: 'Villa' },
  { key: 'maison', label: 'Maison' },
  { key: 'terrain', label: 'Terrain / Parcelle' },
  { key: 'boutique', label: 'Boutique' },
]

export const SANITAIRE_OPTS = [
  { value: 'interieur', label: 'Sanitaire',        sub: 'Douche intérieure au logement' },
  { value: 'cour',      label: 'Douche et WC extérieurs', sub: 'Douche extérieure / commune' },
  { value: 'autre',     label: 'Autre à préciser', sub: '' },
]

/** Standing : remplace les anciens champs Sanitaire et Finition (E7). Ordre d'affichage. */
export const STANDING_OPTS = [
  { value: 'ordinaire',             label: 'Ordinaire',             sub: '' },
  { value: 'sanitaire',             label: 'Sanitaire',             sub: '' },
  { value: 'semi_sanitaire',        label: 'Semi sanitaire',        sub: '' },
  { value: 'sanitaire_semi_staffe', label: 'Sanitaire semi-staffé', sub: '' },
  { value: 'sanitaire_staffe',      label: 'Sanitaire staffé',      sub: '' },
  { value: 'haut_standing_vip',     label: 'Haut standing / VIP',   sub: '' },
  { value: 'autre',                 label: 'Autre',                 sub: '' },
]

export const STANDING_AUTRE_MAX = 50

export const FINITION_OPTS = [
  { value: 'ordinaire',     label: 'Ordinaire',           sub: '' },
  { value: 'semi_staffe',   label: 'Semi-Staffé',         sub: 'Salon staffé et carrelé ; chambre au plafond propre, sans carrelage.' },
  { value: 'staffe_carele', label: 'Staffé',              sub: 'Staff complet moderne et carreaux récents partout.' },
  { value: 'haut_standing', label: 'Haut Standing / VIP', sub: 'Baies vitrées, douche moderne, climatisation.' },
]

export const CUISINE_OPTS = [
  { value: 'separee_douche', label: 'Cuisine séparée de la douche' },
  { value: 'americaine', label: 'Cuisine américaine' },
  { value: 'autre', label: 'Autres (à préciser)' },
]

export const COUR_OPTS = [
  { value: 'commune', label: 'Cour commune' },
  { value: 'entree_personnelle', label: 'Entrée personnelle' },
]

export const COUR_DESC: Record<string, string> = {
  commune: 'La cour est partagée entre plusieurs occupants du bâtiment.',
  entree_personnelle: "Une entrée qui vous est propre, séparée des autres occupants, pour plus d'intimité.",
}

export const DOCUMENT_TERRAIN_OPTS = [
  { value: 'permis_construire', label: 'Permis de construire' },
  { value: 'titre_foncier', label: 'Titre foncier' },
  { value: 'attestation_recasement', label: 'Attestation de recasement' },
  { value: 'convention_vente', label: 'Convention de vente' },
  { value: 'autre', label: 'Autre' },
]

export const EQUIPEMENTS_RESIDENTIEL = [
  { value: 'garage_auto', label: 'Garage auto' },
  { value: 'garage_moto', label: 'Garage moto fermé' },
  { value: 'gardien', label: 'Gardien / Sécurité' },
  { value: 'balcon', label: 'Balcon' },
  { value: 'climatisation', label: 'Climatisation' },
  { value: 'chauffe_eau', label: 'Chauffe-eau' },
  { value: 'baie_vitree', label: 'Baies vitrées' },
]

export const EQUIPEMENTS_BOUTIQUE = [
  { value: 'toilette_interne', label: 'Toilette interne' },
  { value: 'arriere_boutique', label: 'Arrière-boutique / Stock' },
  { value: 'sol_carele', label: 'Sol carrelé' },
  { value: 'plafond_staffe', label: 'Plafond staffé' },
  { value: 'climatisation', label: 'Climatisation' },
]

export const ALENTOURS_OPTS = [
  { value: 'marche', label: 'Marché' },
  { value: 'eglise', label: 'Église / Cathédrale' },
  { value: 'mosquee', label: 'Mosquée' },
  { value: 'ecole', label: 'École primaire' },
  { value: 'lycee', label: 'Collège / Lycée' },
  { value: 'universite', label: 'Université / Campus' },
  { value: 'hopital', label: 'Hôpital / Clinique' },
  { value: 'pharmacie', label: 'Pharmacie' },
  { value: 'banque', label: 'Banque / DAB' },
  { value: 'station', label: 'Station-service' },
  { value: 'bar_maquis', label: 'Bar / Maquis' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'taxi_zem', label: 'Gare taxi / Zem' },
  { value: 'supermarche', label: 'Supermarché / Épicerie' },
  { value: 'plage', label: 'Plage / Bord de mer' },
]

export const parsePrix = (t: string): number | undefined => {
  const c = t.trim().replace(/\s/g, '').replace(',', '')
  if (!c) return undefined
  const n = Number(c)
  return Number.isFinite(n) ? n : undefined
}

export const formatFcfa = (v: number) => v > 0 ? `${Math.round(v).toLocaleString('fr-FR')} FCFA` : '0 FCFA'

export const baseInputStyle: CSSProperties = {
  background: 'var(--p-deep)',
  borderColor: 'var(--p-border)',
  color: 'var(--p-text)',
}
