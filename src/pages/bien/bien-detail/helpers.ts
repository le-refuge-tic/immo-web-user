import { API_ORIGIN } from '../../../api/apiBase'
import type { IconType } from './Icon'
import type { Amenites } from '../../../types/amenites'
import type { Bien, Piece, Visite } from '../../../types/api'

const BACKEND = API_ORIGIN + '/'

export function resolveUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return BACKEND + url
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc']

export function fmtSlot(iso: string) {
  try {
    const dt = new Date(iso)
    return `${WEEKDAYS[(dt.getDay() + 6) % 7]} ${dt.getDate()} ${MONTHS[dt.getMonth()]} à ${String(dt.getHours()).padStart(2, '0')}h${String(dt.getMinutes()).padStart(2, '0')}`
  } catch { return iso }
}

export function fmtVisiteDate(iso: string | null | undefined) {
  if (!iso) return '--'
  try {
    const dt = new Date(iso)
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} à ${String(dt.getHours()).padStart(2, '0')}h${String(dt.getMinutes()).padStart(2, '0')}`
  } catch { return iso }
}

const MONTHS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

/** « 15 mars 2030 » depuis une date YYYY-MM-DD (lue telle quelle, sans décalage de fuseau) ; null si absente ou illisible. */
export function fmtDateLongue(iso: string | null | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '')
  if (!m) return null
  const mois = MONTHS_LONG[Number(m[2]) - 1]
  return mois ? `${Number(m[3])} ${mois} ${m[1]}` : null
}

export function fcfa(v: number) {
  return `${Math.round(v).toLocaleString('fr-FR').replace(/,/g, ' ')} FCFA`
}

export function isEchoueeVisite(v: Pick<Visite, 'statut' | 'date_contre_proposee' | 'date_souhaitee'>): boolean {
  if (v.statut === 'effectuee' || v.statut === 'annulee') return false
  const raw = v.date_contre_proposee || v.date_souhaitee
  if (!raw) return false
  return new Date(raw).getTime() < Date.now()
}

// ─── Composition (chips groupées par type de pièce) ────────────────────────
const PIECE_ICON: Record<string, IconType> = {
  Chambre: 'bed', Salon: 'sofa', Cuisine: 'kitchen', 'Salle de bain': 'bathtub',
  Toilette: 'toilet', Garage: 'garage', Terrasse: 'deck', Bureau: 'briefcase', Entrée: 'door',
}
function pieceIconType(nom: string): IconType {
  return PIECE_ICON[nom] || 'room'
}
function pluralPiece(nom: string, n: number) {
  if (n <= 1) return nom
  if (nom === 'Salle de bain') return `${n} Salles de bain`
  return `${n} ${nom}s`
}

export function buildComposition(bien: Bien): { icon: IconType; label: string }[] | null {
  const sousType = (bien.amenites as Amenites | null | undefined)?.sous_type
  const pieces: Piece[] = bien.pieces || []
  if (sousType === 'boutique' || sousType === 'terrain' || pieces.length === 0) return null

  const counts: Record<string, number> = {}
  for (const p of pieces) counts[p.nom] = (counts[p.nom] || 0) + 1

  if (sousType === 'chambre_salon' || sousType === 'entree_coucher') {
    const chips: { icon: IconType; label: string }[] = []
    const chambres = counts['Chambre'] || 0
    const salons = counts['Salon'] || 0
    const entrees = counts['Entrée'] || 0
    if (chambres > 0) chips.push({ icon: pieceIconType('Chambre'), label: `${chambres} Chambre${chambres > 1 ? 's' : ''}` })
    if (salons > 0) chips.push({ icon: pieceIconType('Salon'), label: `${salons} Salon${salons > 1 ? 's' : ''}` })
    if (entrees > 0) chips.push({ icon: pieceIconType('Entrée'), label: `${entrees} Entrée${entrees > 1 ? 's' : ''}` })
    return chips.length > 0 ? chips : null
  }

  const chips = Object.entries(counts).map(([nom, n]) => ({ icon: pieceIconType(nom), label: pluralPiece(nom, n) }))
  return chips.length > 0 ? chips : null
}

// Icône + couleur par ligne — miroir exact de _buildInfosLogement / _buildTerrainSection
// (électricité et eau/SONEB utilisent le vrai logo du fournisseur, pas une icône).
export const INFO_ROW_META: Record<string, { icon: IconType; color: string }> = {
  'Eau': { icon: 'waterdrop', color: '#2E86C1' },
  'Cuisine': { icon: 'countertop', color: '#FF6B35' },
  'Cour / Accès': { icon: 'plant', color: '#4CAF50' },
  'Accès véhicule': { icon: 'car', color: '#5E6AD2' },
  'Maison à couloir': { icon: 'slidingdoor', color: '#8E6ABE' },
  'Sanitaires': { icon: 'shower', color: '#26A69A' },
  'Finition': { icon: 'paintroller', color: 'var(--tx-amber)' },
  'Loyer': { icon: 'clockrepeat', color: '#7B2FBE' },
  'Document disponible': { icon: 'document', color: '#2980B9' },
  'Terrain loti': { icon: 'gridon', color: '#27AE60' },
  'Titre foncier': { icon: 'verified', color: '#16A085' },
  'Permission de construire': { icon: 'construction', color: 'var(--tx-amber)' },
  'Angle de rue': { icon: 'turnright', color: '#8E6ABE' },
  'Position': { icon: 'map', color: '#2980B9' },
  'Construction existante': { icon: 'homework', color: '#5D6D7E' },
}
