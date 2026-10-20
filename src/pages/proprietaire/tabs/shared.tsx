
import { IcPayments, IcMessagesNav } from './icons'
import type { Bien, Piece } from '../../../types/api'
import type { Contrat } from '../../../types/proprietaire'
// ─── Icons ────────────────────────────────────────────────────────────────────
const IcDash    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
export const IcHome    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
export const IcCal     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
export const IcClock   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
export const IcWallet  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
export const IcPerson  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
export const IcPlus    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
export const IcStar    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
export const IcShield  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
export const IcPin     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
export const IcTrash   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
export const IcEdit    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
export const IcChat    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
export const IcLogout  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
export const IcBell    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
export const IcShare   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342a3 3 0 100 2.316m0-2.316a3 3 0 110 2.316m0-2.316L15.316 9.658M8.684 15.658L15.316 19.34M15.316 4.658a3 3 0 105.658 1.658 3 3 0 00-5.658-1.658zm0 0L8.684 8.342m6.632 11a3 3 0 105.658-1.658 3 3 0 00-5.658 1.658z"/></svg>
export const IcUpload  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>

// ─── Constants ────────────────────────────────────────────────────────────────
export const BLUE      = 'var(--c-brand)'   // bleu principal (propriétaire)
export const DARK_BLUE = '#0B1C30'   // navy

export const ROLE_LABELS: Record<string, string> = { prospect: 'Prospect', proprietaire: 'Propriétaire', demarcheur: 'Démarcheur', locataire: 'Locataire' }
export const ROLE_ROUTES: Record<string, string> = { proprietaire: '/proprietaire', demarcheur: '/demarcheur', locataire: '/locataire' }

export type Tab = 'tableau' | 'biens' | 'reservations' | 'messages' | 'notifications' | 'loyers' | 'portefeuille' | 'transactions' | 'roles' | 'profil'

// Bottom nav (mobile/tablette, < xl) — jeu réduit d'onglets les plus utilisés.
export const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'tableau',       label: 'Tableau',       icon: <IcDash /> },
  { key: 'biens',         label: 'Mes biens',     icon: <IcHome /> },
  { key: 'reservations',  label: 'Réservations',  icon: <IcCal /> },
  { key: 'loyers',        label: 'Loyers',        icon: <IcPayments /> },
  { key: 'portefeuille',  label: 'Portefeuille',  icon: <IcWallet /> },
  { key: 'profil',        label: 'Profil',        icon: <IcPerson /> },
]

// Sidebar desktop (xl+) — liste plate façon immo-web-admin (icône + libellé,
// sans sous-groupes). Tous les onglets internes (`tab`) restent dans le
// dashboard (sidebar/topbar visibles) ; seuls "Gérer mes rôles" et
// "Historique des transactions" pointent vers des pages à part (`to`),
// comme "Nouveau bien".

export const NAV_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'tableau',      label: 'Tableau',      icon: <IcDash /> },
  { key: 'biens',        label: 'Mes biens',    icon: <IcHome /> },
  { key: 'reservations', label: 'Réservations', icon: <IcCal /> },
  { key: 'loyers',       label: 'Loyers',       icon: <IcPayments /> },
  { key: 'messages',     label: 'Messages',      icon: <IcMessagesNav /> },
  { key: 'notifications', label: 'Notifications', icon: <IcBell /> },
  { key: 'portefeuille', label: 'Portefeuille',  icon: <IcWallet /> },
  { key: 'profil',       label: 'Profil',        icon: <IcPerson /> },
]

export function typeLabel(t: string) {
  const m: Record<string, string> = { maison: 'Maison', appart_vide: 'Appartement vide', appart_meuble: 'Appartement meublé', terrain: 'Terrain', guesthouse: 'Guesthouse' }
  return m[t] || t
}
const SOUS_TYPE_LABELS: Record<string, string> = {
  entree_coucher: 'Entrée-Coucher', chambre_salon: 'Chambre-Salon',
  appartement: 'Appartement', villa: 'Villa', maison_individuelle: 'Maison',
  villa_maison: 'Villa / Maison', boutique: 'Boutique / Local', terrain: 'Terrain',
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
export function statutBien(s: string) {
  if (s === 'approuve')    return { label: 'Publié ✓',    color: 'var(--c-green-material)' }
  if (s === 'rejete')      return { label: 'Rejeté ✗',    color: '#F44336' }
  if (s === 'conditionnel') return { label: 'Conditionnel', color: 'var(--tx-amber)' }
  return { label: 'En attente', color: 'var(--tx-amber)' }
}
export function statutVisite(s: string) {
  if (s === 'confirmee')       return { label: 'Confirmée',       color: 'var(--c-green-material)' }
  if (s === 'annulee')         return { label: 'Annulée',         color: '#F44336' }
  if (s === 'effectuee')       return { label: 'Effectuée',       color: BLUE }
  if (s === 'contre_proposee') return { label: 'Contre-proposée', color: 'var(--tx-amber)' }
  return { label: 'En attente', color: 'var(--tx-amber)' }
}

const MONTH_LABELS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc']

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
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amt)))
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amt)))
  const b = Math.max(0, Math.round((n & 255) * (1 - amt)))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}


/** Petit indicateur "temps réel" — pastille pulsante + horodatage de dernière synchro. */
export function LiveIndicator({ label, refreshing }: { label: string; refreshing: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex w-2 h-2">
        {!refreshing && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: 'var(--c-success)' }} />}
        <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: refreshing ? 'var(--c-amber-dark)' : 'var(--c-success)' }} />
      </span>
      <span className="text-[11px] text-[#8A9BB5]">{refreshing ? 'Synchronisation…' : `À jour · ${label}`}</span>
    </div>
  )
}

export const MSG_AVATAR_COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', 'var(--c-success-bright)', '#0891B2']
export function formatConvTime(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 86_400_000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 604_800_000) return d.toLocaleDateString('fr-FR', { weekday: 'short' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

