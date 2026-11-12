import type { Bien, Piece } from '../../../types/api'
import type { Contrat } from '../../../types/proprietaire'

const SOUS_TYPE_LABELS: Record<string, string> = {
  entree_coucher: 'Entrée-Coucher', chambre_salon: 'Chambre-Salon',
  appartement: 'Appartement', villa: 'Villa', maison_individuelle: 'Maison',
  villa_maison: 'Villa / Maison', boutique: 'Boutique / Local', terrain: 'Terrain',
}

const MONTH_LABELS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc']

// ─── Constants ────────────────────────────────────────────────────────────────
export const BLUE      = 'var(--c-brand)'   // bleu principal (propriétaire)
/** Bleu principal en couleur de texte : identique en clair, éclairci sur la palette marine (FE-B-024). Les fonds gardent BLUE. */
export const BLUE_TX   = 'var(--tx-brand)'
export const DARK_BLUE = '#0B1C30'   // navy

export const ROLE_LABELS: Record<string, string> = { prospect: 'Prospect', proprietaire: 'Propriétaire', demarcheur: 'Démarcheur', locataire: 'Locataire' }
export const ROLE_ROUTES: Record<string, string> = { proprietaire: '/proprietaire', demarcheur: '/demarcheur', locataire: '/locataire' }

export type Tab = 'tableau' | 'biens' | 'reservations' | 'messages' | 'notifications' | 'loyers' | 'portefeuille' | 'transactions' | 'roles' | 'profil'

export function typeLabel(t: string) {
  const m: Record<string, string> = { maison: 'Maison', appart_vide: 'Appartement vide', appart_meuble: 'Appartement meublé', terrain: 'Terrain', guesthouse: 'Guesthouse', salle_fete: 'Salle de fêtes' }
  return m[t] || t
}
export function bienLabel(b: Partial<Pick<Bien, 'type' | 'amenites'>> | null | undefined): string {
  const sous = b?.amenites?.sous_type
  if (typeof sous === 'string' && SOUS_TYPE_LABELS[sous]) {
    if (sous === 'appartement' && b?.type === 'appart_meuble') return 'Appartement meublé'
    return SOUS_TYPE_LABELS[sous]
  }
  return typeLabel(b?.type || '')
}
export function bienComposition(b: { pieces?: Piece[] } | null | undefined): string {
  const pieces: Piece[] = b?.pieces || []
  if (!pieces.length) return ''
  const counts: Record<string, number> = {}
  for (const p of pieces) counts[p.nom] = (counts[p.nom] || 0) + 1
  return Object.entries(counts).map(([nom, n]) => `${n} ${nom}${n > 1 ? 's' : ''}`).join(' · ')
}
export function fmtPrix(p: number | string | null | undefined) {
  const n = Number(p); return `${n.toLocaleString('fr-FR')} FCFA`
}
// Statuts : `color` pour un texte, `fill` pour un fond plein sous texte blanc (FE-B-024).
export function statutBien(s: string) {
  if (s === 'approuve')    return { label: 'Publié ✓',    color: 'var(--tx-green)', fill: 'var(--c-fill-success)' }
  if (s === 'rejete')      return { label: 'Rejeté ✗',    color: 'var(--tx-red)', fill: 'var(--c-fill-error)' }
  if (s === 'conditionnel') return { label: 'Conditionnel', color: 'var(--tx-amber)', fill: 'var(--c-amber-dark)' }
  return { label: 'En attente', color: 'var(--tx-amber)', fill: 'var(--c-amber-dark)' }
}
export function statutVisite(s: string) {
  if (s === 'confirmee')       return { label: 'Confirmée',       color: 'var(--tx-green)', fill: 'var(--c-fill-success)' }
  if (s === 'annulee')         return { label: 'Annulée',         color: 'var(--tx-red)', fill: 'var(--c-fill-error)' }
  if (s === 'effectuee')       return { label: 'Effectuée',       color: BLUE_TX, fill: BLUE }
  if (s === 'contre_proposee') return { label: 'Contre-proposée', color: 'var(--tx-amber)', fill: 'var(--c-amber-dark)' }
  return { label: 'En attente', color: 'var(--tx-amber)', fill: 'var(--c-amber-dark)' }
}

/** Revenus locatifs encaissés (loyers payés), regroupés par mois — `n` derniers mois. */
export function buildRevenueSeries(contrats: Contrat[], n = 6): { label: string; value: number }[] {
  const now = new Date()
  const months = Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_LABELS[d.getMonth()], value: 0 }
  })
  const byKey = new Map(months.map(m => [m.key, m]))
  for (const c of contrats) {
    for (const l of c.loyers || []) {
      if (l.statut !== 'paye' || !l.date_paiement) continue
      const d = new Date(l.date_paiement)
      const m = byKey.get(`${d.getFullYear()}-${d.getMonth()}`)
      if (m) m.value += Number(l.montant)
    }
  }
  return months
}

/** Compte des éléments par mois (`n` derniers mois) — ex. visites reçues. */
export function buildCountSeries<T>(items: T[], getDate: (item: T) => string | null | undefined, n = 6): { label: string; value: number }[] {
  const now = new Date()
  const months = Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_LABELS[d.getMonth()], value: 0 }
  })
  const byKey = new Map(months.map(m => [m.key, m]))
  for (const item of items) {
    const raw = getDate(item)
    if (!raw) continue
    const d = new Date(raw)
    if (isNaN(d.getTime())) continue
    const m = byKey.get(`${d.getFullYear()}-${d.getMonth()}`)
    if (m) m.value += 1
  }
  return months
}

// ─── Composants graphiques (SVG maison, sans librairie externe) ───────────────

/** Assombrit une couleur hex d'un facteur (0-1) — utilisé pour donner un
 *  léger dégradé de profondeur aux StatCards pleines couleurs. */
/**
 * Assombrit une couleur CSS quelconque (hex, `var(--jeton)`) de `amt` (0-1). Remplace l'ancien `shade`,
 * qui exigeait un hex : sur un `var()`, il produisait une couleur invalide et le dégradé disparaissait.
 */
export function assombrir(color: string, amt: number): string {
  return `color-mix(in srgb, ${color} ${Math.round((1 - amt) * 100)}%, black)`
}


export const MSG_AVATAR_COLORS = ['#2563EB', '#7C3AED', '#DB2777', 'var(--c-amber-600)', 'var(--c-success-bright)', '#0891B2']
export function formatConvTime(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 86_400_000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 604_800_000) return d.toLocaleDateString('fr-FR', { weekday: 'short' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
