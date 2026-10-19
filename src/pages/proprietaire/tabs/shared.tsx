import { chatApi } from '../../../api/chatApi'
import ChatThread from '../../conversations/ChatThread'
import { IcPayments, IcMessagesNav, IcTrendUp, IcTrendDown } from './icons'

// ─── Icons ────────────────────────────────────────────────────────────────────
const IcDash    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
export const IcHome    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
export const IcCal     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
export const IcClock   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
const IcMoney   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
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
const IcCopy    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
export const IcShare   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342a3 3 0 100 2.316m0-2.316a3 3 0 110 2.316m0-2.316L15.316 9.658M8.684 15.658L15.316 19.34M15.316 4.658a3 3 0 105.658 1.658 3 3 0 00-5.658-1.658zm0 0L8.684 8.342m6.632 11a3 3 0 105.658-1.658 3 3 0 00-5.658 1.658z"/></svg>
export const IcUpload  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>


// ─── Constants ────────────────────────────────────────────────────────────────
export const BLUE      = '#4B6BFF'   // bleu principal (propriétaire)
export const DARK_BLUE = '#0B1C30'   // navy

export const ROLE_LABELS: Record<string, string> = { prospect: 'Prospect', proprietaire: 'Propriétaire', demarcheur: 'Agent', locataire: 'Locataire' }
export const ROLE_ROUTES: Record<string, string> = { proprietaire: '/proprietaire', demarcheur: '/demarcheur', locataire: '/locataire' }

export type Tab = 'tableau' | 'biens' | 'reservations' | 'creneaux' | 'messages' | 'notifications' | 'loyers' | 'portefeuille' | 'transactions' | 'roles' | 'profil'

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
  { key: 'creneaux',     label: 'Créneaux',      icon: <IcClock /> },
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
export function bienLabel(b: any): string {
  const sous = b?.amenites?.sous_type
  if (sous && SOUS_TYPE_LABELS[sous]) {
    if (sous === 'appartement' && b.type === 'appart_meuble') return 'Appartement meublé'
    return SOUS_TYPE_LABELS[sous]
  }
  return typeLabel(b?.type || '')
}
export function bienComposition(b: any): string {
  const pieces: any[] = b?.pieces || []
  if (!pieces.length) return ''
  const counts: Record<string, number> = {}
  for (const p of pieces) counts[p.nom] = (counts[p.nom] || 0) + 1
  return Object.entries(counts).map(([nom, n]) => `${n} ${nom}${n > 1 ? 's' : ''}`).join(' · ')
}
export function fmtPrix(p: any) {
  const n = Number(p); return `${n.toLocaleString('fr-FR')} FCFA`
}
export function statutBien(s: string) {
  if (s === 'approuve')    return { label: 'Publié ✓',    color: '#4CAF50' }
  if (s === 'rejete')      return { label: 'Rejeté ✗',    color: '#F44336' }
  if (s === 'conditionnel') return { label: 'Conditionnel', color: '#B45309' }
  return { label: 'En attente', color: '#B45309' }
}
export function statutVisite(s: string) {
  if (s === 'confirmee')       return { label: 'Confirmée',       color: '#4CAF50' }
  if (s === 'annulee')         return { label: 'Annulée',         color: '#F44336' }
  if (s === 'effectuee')       return { label: 'Effectuée',       color: BLUE }
  if (s === 'contre_proposee') return { label: 'Contre-proposée', color: '#B45309' }
  return { label: 'En attente', color: '#B45309' }
}

const MONTH_LABELS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc']

/** Revenus locatifs encaissés (loyers payés), regroupés par mois — `n` derniers mois. */
export function buildRevenueSeries(contrats: any[], n = 6): { label: string; value: number }[] {
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

// ─── QuickAction ──────────────────────────────────────────────────────────────
function QuickAction({ icon, color, label, onClick, badge }: { icon: React.ReactNode; color: string; label: string; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} className="flex-1 card-navy rounded-2xl py-4 flex flex-col items-center gap-2 active:scale-95 transition-transform">
      <div className="relative w-11 h-11 rounded-[13px] flex items-center justify-center" style={{ background: color + '20' }}>
        <span style={{ color }}>{icon}</span>
        {!!badge && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white" style={{ background: '#FF3B30' }}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className="text-[11px] font-semibold text-[#F0EDE8] text-center leading-tight">{label}</span>
    </button>
  )
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

/** Mini-graphique compact (sans axes) posé dans une StatCard, comme les
 *  petites courbes intégrées aux cartes KPI des dashboards admin. */
function MiniSparkline({ data, color }: { data: { value: number }[]; color: string }) {
  if (data.length < 2) return null
  const width = 100, height = 28
  const max = Math.max(...data.map(d => d.value), 1)
  const min = Math.min(...data.map(d => d.value), 0)
  const range = Math.max(max - min, 1)
  const stepX = width / (data.length - 1)
  const points = data.map((d, i) => [i * stepX, height - ((d.value - min) / range) * height])
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`
  const gradId = `sparkGrad-${color.replace('#', '')}`
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  )
}

function StatCard({ icon, color, label, value, trendPct, trendCaption, sparkline }: { icon: React.ReactNode; color: string; label: string; value: string; trendPct?: number; trendCaption?: string; sparkline?: { value: number }[] }) {
  const up = (trendPct ?? 0) >= 0
  return (
    <div className="rounded-2xl p-5 flex-1 min-w-0 relative overflow-hidden flex flex-col"
      style={{ background: 'var(--p-card)', borderLeft: `3px solid ${color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-[#8A9BB5] uppercase tracking-widest">{label}</p>
        {trendPct != null && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: up ? '#22C55E18' : '#EF444418', color: up ? '#15803D' : '#DC2626' }}>
            {up ? <IcTrendUp /> : <IcTrendDown />} {Math.abs(trendPct)}%
          </span>
        )}
      </div>
      <p className="text-[30px] font-black leading-none tracking-tight truncate" style={{ color }}>{value}</p>
      {trendCaption && <p className="text-[11px] text-[#8A9BB5] mt-2">{trendCaption}</p>}
      <div className="flex items-end justify-between mt-auto pt-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center opacity-60" style={{ background: color + '18' }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {sparkline && sparkline.some(s => s.value > 0) && (
          <div className="flex-1 ml-3 -mb-1">
            <MiniSparkline data={sparkline} color={color} />
          </div>
        )}
      </div>
    </div>
  )
}

/** Petite carte profil bien distincte (icône + valeur + libellé), teintée dans la
 *  couleur de sa métrique — remplace les pastilles translucides autrefois posées
 *  sur le bandeau du header. */
function MiniStatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="flex-1 min-w-0 rounded-xl px-3 py-2.5 flex items-center gap-2.5 relative overflow-hidden"
      style={{ background: 'var(--p-card)', border: `1px solid ${color}22` }}>
      <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 0% 50%, ${color}, transparent 70%)` }} />
      <span className="relative z-10 flex-shrink-0" style={{ color }}>{icon}</span>
      <div className="relative z-10 min-w-0">
        <p className="text-lg font-black leading-none" style={{ color }}>{value}</p>
        <p className="text-[10px] text-[#8A9BB5] mt-0.5 truncate">{label}</p>
      </div>
    </div>
  )
}

/** Jauge circulaire (score /100) — anneau de progression + valeur centrée. */
function RadialGauge({ value, size = 132, thickness = 12, color = BLUE }: { value: number; size?: number; thickness?: number; color?: string }) {
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(100, value))
  const dash = (pct / 100) * circumference
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1A3355" strokeWidth={thickness} />
      {pct > 0 && (
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={thickness}
          strokeDasharray={`${dash} ${circumference - dash}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      )}
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: size * 0.26, fontWeight: 800 }} className="fill-[#F0EDE8]">{Math.round(pct)}</text>
    </svg>
  )
}

function PercentCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="card-soft rounded-2xl p-4 flex-1 min-w-0">
      <p className="text-2xl font-extrabold leading-none" style={{ color }}>{value}%</p>
      <p className="text-xs text-[#8A9BB5] mt-2">{label}</p>
    </div>
  )
}

function HighlightRow({ icon, color, title, subtitle, last }: { icon: React.ReactNode; color: string; title: string; subtitle: string; last?: boolean }) {
  return (
    <div className={`flex items-center gap-3 py-2.5 ${last ? '' : 'border-b border-[#1A3355]'}`}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#F0EDE8] truncate">{title}</p>
        <p className="text-[11px] text-[#8A9BB5] truncate">{subtitle}</p>
      </div>
    </div>
  )
}

function ActivityStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1 min-w-0 text-center">
      <p className="text-xl font-bold text-[#F0EDE8]">{value}</p>
      <p className="text-[11px] text-[#8A9BB5] mt-0.5 truncate">{label}</p>
      <div className="h-1 rounded-full mt-2.5" style={{ background: color }} />
    </div>
  )
}

function DonutChart({ segments, size = 108, thickness = 16 }: { segments: { label: string; value: number; color: string }[]; size?: number; thickness?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1A3355" strokeWidth={thickness} />
        {total > 0 && segments.filter(s => s.value > 0).map((s, i) => {
          const frac = s.value / total
          const dash = frac * circumference
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={s.color} strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`} />
          )
          offset += dash
          return el
        })}
        <text x="50%" y="47%" textAnchor="middle" className="fill-[#F0EDE8]" style={{ fontSize: 20, fontWeight: 800 }}>{total}</text>
        <text x="50%" y="63%" textAnchor="middle" className="fill-[#8A9BB5]" style={{ fontSize: 9 }}>biens</text>
      </svg>
      <div className="flex-1 min-w-0 space-y-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-[#8A9BB5] flex-1 truncate">{s.label}</span>
            <span className="text-xs font-bold text-[#F0EDE8]">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="mb-3.5 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-[#8A9BB5]">{label}</span>
        <span className="text-xs font-bold text-[#F0EDE8]">{value}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1A3355' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function AreaChart({ data, color = '#2E86C1', height = 130 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const width = 100
  const max = Math.max(...data.map(d => d.value), 1)
  const padTop = 10
  const stepX = width / Math.max(data.length - 1, 1)
  const points = data.map((d, i) => [i * stepX, height - padTop - (d.value / max) * (height - padTop * 2)])
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`
  const gradId = `areaGrad-${color.replace('#', '')}`
  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={1.6} />
        {points.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={1.8} fill={color} />)}
      </svg>
      <div className="flex justify-between mt-1.5">
        {data.map((d, i) => <span key={i} className="text-[10px] text-[#8A9BB5]">{d.label}</span>)}
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, icon, color, className = '', headerRight, children }: { title: string; subtitle?: string; icon?: React.ReactNode; color?: string; className?: string; headerRight?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={`card-soft rounded-2xl p-4 md:p-5 ${className}`}>
      <div className="flex items-center gap-2.5 mb-0.5">
        {icon && (
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: (color || BLUE) + '18' }}>
            <span style={{ color: color || BLUE }}>{icon}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[#F0EDE8] text-sm">{title}</p>
          {subtitle && <p className="text-[11px] text-[#8A9BB5]">{subtitle}</p>}
        </div>
        {headerRight}
      </div>
      <div className={icon ? 'mt-4' : subtitle ? 'mt-4' : 'mt-3'}>
        {children}
      </div>
    </div>
  )
}

/** Sélecteur de période façon "7D/30D/90D" du template — ici en mois,
 *  réellement branché sur les séries affichées (pas décoratif). */
function PeriodToggle({ value, onChange, color }: { value: 3 | 6 | 12; onChange: (v: 3 | 6 | 12) => void; color: string }) {
  return (
    <div className="flex-shrink-0 flex items-center gap-1 p-0.5 rounded-lg" style={{ background: '#1A3355', border: '1px solid #2A4570' }}>
      {([3, 6, 12] as const).map(n => (
        <button key={n} onClick={() => onChange(n)}
          className="px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors"
          style={value === n ? { background: color, color: '#060D1A', fontWeight: 700 } : { color: 'var(--p-muted)' }}>
          {n}M
        </button>
      ))}
    </div>
  )
}

function EmptyChartState({ label, height = 130 }: { label: string; height?: number }) {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ height }}>
      <svg className="w-7 h-7 text-[#8A9BB5]/40 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-xs text-[#8A9BB5]">{label}</p>
    </div>
  )
}

/** Petit indicateur "temps réel" — pastille pulsante + horodatage de dernière synchro. */
export function LiveIndicator({ label, refreshing }: { label: string; refreshing: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex w-2 h-2">
        {!refreshing && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#15803D' }} />}
        <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: refreshing ? '#B45309' : '#15803D' }} />
      </span>
      <span className="text-[11px] text-[#8A9BB5]">{refreshing ? 'Synchronisation…' : `À jour · ${label}`}</span>
    </div>
  )
}

export const MSG_AVATAR_COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', '#16A34A', '#0891B2']
export function formatConvTime(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 86_400_000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 604_800_000) return d.toLocaleDateString('fr-FR', { weekday: 'short' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

