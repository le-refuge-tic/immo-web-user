import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { biensApi } from '../../api/biensApi'
import { visitesApi } from '../../api/visitesApi'
import { userApi } from '../../api/userApi'
import { walletApi } from '../../api/walletApi'
import { delegationApi } from '../../api/delegationApi'
import { chatApi } from '../../api/chatApi'
import { loyersApi } from '../../api/loyersApi'
import { rolesApi } from '../../api/rolesApi'
import EditProfileModal from '../profile/EditProfileModal'
import ChangePasswordModal from '../profile/ChangePasswordModal'
import EditBienModal from '../bien/EditBienModal'
import ChatThread from '../conversations/ChatThread'
import logoUrl from '../../assets/REFUGE-LOGO.png'

// ─── Icons ────────────────────────────────────────────────────────────────────
const IcDash    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
const IcHome    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
const IcCal     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
const IcClock   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
const IcMoney   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
const IcWallet  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
const IcPerson  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
const IcPlus    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
const IcStar    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
const IcShield  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
const IcPin     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
const IcTrash   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
const IcEdit    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
const IcChat    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
const IcRefresh = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
const IcLogout  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
const IcMessage = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
const IcChevron = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
const IcChevronLeft = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6"/></svg>
const IcChevronRight = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/></svg>
const IcMessagesNav = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
const IcLink = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>

// ─── Constants ────────────────────────────────────────────────────────────────
const BLUE      = '#2E86C1'
const DARK_BLUE = '#0F3460'

const ROLE_LABELS: Record<string, string> = { prospect: 'Prospect', proprietaire: 'Propriétaire', demarcheur: 'Agent', locataire: 'Locataire' }
const ROLE_ROUTES: Record<string, string> = { proprietaire: '/proprietaire', demarcheur: '/demarcheur', locataire: '/locataire' }

type Tab = 'tableau' | 'biens' | 'reservations' | 'messages' | 'loyers' | 'portefeuille' | 'transactions' | 'roles' | 'profil' | 'delegations'

const DELEG_STATUT: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente',  color: '#F59E0B' },
  active:     { label: 'Active',      color: '#22C55E' },
  revoquee:   { label: 'Révoquée',    color: '#EF4444' },
  expiree:    { label: 'Expirée',     color: '#9CA3AF' },
  refusee:    { label: 'Refusée',     color: '#EF4444' },
}

// Bottom nav (mobile/tablette, < xl) — jeu réduit d'onglets les plus utilisés.
const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'tableau',       label: 'Tableau',       icon: <IcDash /> },
  { key: 'biens',         label: 'Mes biens',     icon: <IcHome /> },
  { key: 'reservations',  label: 'Réservations',  icon: <IcCal /> },
  { key: 'loyers',        label: 'Loyers',        icon: <IcMoney /> },
  { key: 'portefeuille',  label: 'Portefeuille',  icon: <IcWallet /> },
  { key: 'profil',        label: 'Profil',        icon: <IcPerson /> },
]

// Sidebar desktop (xl+) — liste plate façon immo-web-admin (icône + libellé,
// sans sous-groupes). Tous les onglets internes (`tab`) restent dans le
// dashboard (sidebar/topbar visibles) ; seuls "Gérer mes rôles" et
// "Historique des transactions" pointent vers des pages à part (`to`),
// comme "Nouveau bien".
const SIDEBAR_NAV: { key: string; label: string; icon: React.ReactNode; tab?: Tab; to?: string }[] = [
  { key: 'tableau',       label: 'Tableau de bord', icon: <IcDash />,        tab: 'tableau' },
  { key: 'biens',         label: 'Mes biens',       icon: <IcHome />,        tab: 'biens' },
  { key: 'reservations',  label: 'Réservations',    icon: <IcCal />,         tab: 'reservations' },
  { key: 'messages',      label: 'Messages',        icon: <IcMessagesNav />, tab: 'messages' },
  { key: 'loyers',        label: 'Loyers',          icon: <IcMoney />,       tab: 'loyers' },
  { key: 'delegations',   label: 'Liaisons gestion', icon: <IcLink />,       tab: 'delegations' },
  { key: 'portefeuille',  label: 'Portefeuille',    icon: <IcWallet />,      tab: 'portefeuille' },
  { key: 'mes-roles',     label: 'Gérer mes rôles', icon: <IcShield />,      tab: 'roles' },
  { key: 'transactions',  label: 'Historique des transactions', icon: <IcMoney />, tab: 'transactions' },
  { key: 'profil',        label: 'Mon profil',      icon: <IcPerson />,      tab: 'profil' },
]

function typeLabel(t: string) {
  const m: Record<string, string> = { maison: 'Maison', appart_vide: 'Appartement vide', appart_meuble: 'Appartement meublé', terrain: 'Terrain', guesthouse: 'Guesthouse' }
  return m[t] || t
}
function fmtPrix(p: any) {
  const n = Number(p); return `${n.toLocaleString('fr-FR')} FCFA`
}
function statutBien(s: string) {
  if (s === 'approuve')    return { label: 'Publié ✓',    color: '#4CAF50' }
  if (s === 'rejete')      return { label: 'Rejeté ✗',    color: '#F44336' }
  if (s === 'conditionnel') return { label: 'Conditionnel', color: '#FF9800' }
  return { label: 'En attente', color: '#FF9800' }
}
function statutVisite(s: string) {
  if (s === 'confirmee')       return { label: 'Confirmée',       color: '#4CAF50' }
  if (s === 'annulee')         return { label: 'Annulée',         color: '#F44336' }
  if (s === 'effectuee')       return { label: 'Effectuée',       color: BLUE }
  if (s === 'contre_proposee') return { label: 'Contre-proposée', color: '#E67E22' }
  return { label: 'En attente', color: '#FF9800' }
}

const MONTH_LABELS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc']

/** Revenus locatifs encaissés (loyers payés), regroupés par mois — `n` derniers mois. */
function buildRevenueSeries(contrats: any[], n = 6): { label: string; value: number }[] {
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
function buildCountSeries<T>(items: T[], getDate: (item: T) => string | null | undefined, n = 6): { label: string; value: number }[] {
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
function QuickAction({ icon, color, label, onClick }: { icon: React.ReactNode; color: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex-1 card-soft rounded-2xl py-4 flex flex-col items-center gap-2 active:scale-95 transition-transform">
      <div className="w-11 h-11 rounded-[13px] flex items-center justify-center" style={{ background: color + '20' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <span className="text-[11px] font-semibold text-text-dark text-center leading-tight">{label}</span>
    </button>
  )
}

// ─── Composants graphiques (SVG maison, sans librairie externe) ───────────────
const IcTrendUp = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l6-6 4 4L20 9.5M20 9.5h-4.5M20 9.5v4.5"/></svg>
const IcTrendDown = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l6 6 4-4L20 14.5M20 14.5h-4.5M20 14.5v-4.5"/></svg>

/** Assombrit une couleur hex d'un facteur (0-1) — utilisé pour donner un
 *  léger dégradé de profondeur aux StatCards pleines couleurs. */
function shade(hex: string, amt: number): string {
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

/** Carte KPI pleine couleur avec courbe intégrée — inspirée des cartes
 *  "Total Revenue / Active Users / Orders" du template Admindek. */
function StatCard({ icon, color, label, value, trendPct, trendCaption, sparkline }: { icon: React.ReactNode; color: string; label: string; value: string; trendPct?: number; trendCaption?: string; sparkline?: { value: number }[] }) {
  const up = (trendPct ?? 0) >= 0
  return (
    <div className="rounded-2xl p-5 flex-1 min-w-0 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${color}, ${shade(color, 0.28)})`, boxShadow: `0 8px 20px ${color}40` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
          <span className="text-white">{icon}</span>
        </div>
        {trendPct != null && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: 'rgba(255,255,255,0.18)' }}>
            {up ? <IcTrendUp /> : <IcTrendDown />} {Math.abs(trendPct)}%
          </span>
        )}
      </div>
      <p className="text-white/75 text-xs font-semibold mb-1 truncate">{label}</p>
      <p className="text-[26px] font-extrabold text-white leading-none mb-1.5 truncate">{value}</p>
      {trendCaption && <p className="text-white/60 text-[11px] truncate">{trendCaption}</p>}
      {sparkline && sparkline.some(s => s.value > 0) && (
        <div className="mt-3 -mx-1 opacity-90">
          <MiniSparkline data={sparkline} color="#ffffff" />
        </div>
      )}
    </div>
  )
}

/** Petite carte profil bien distincte (icône + valeur + libellé), teintée dans la
 *  couleur de sa métrique — remplace les pastilles translucides autrefois posées
 *  sur le bandeau du header. */
function MiniStatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="rounded-2xl px-3 py-3.5 md:px-4 flex flex-col items-center text-center gap-1.5 md:flex-row md:items-center md:text-left md:gap-3 flex-1 min-w-0 border transition-shadow hover:shadow-sm"
      style={{ background: `linear-gradient(155deg, ${color}12, ${color}05)`, borderColor: color + '22' }}>
      <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '20' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-base md:text-lg font-bold text-text-dark leading-none">{value}</p>
        <p className="text-[11px] text-text-grey mt-1 truncate">{label}</p>
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
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F1F3F6" strokeWidth={thickness} />
      {pct > 0 && (
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={thickness}
          strokeDasharray={`${dash} ${circumference - dash}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      )}
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: size * 0.26, fontWeight: 800 }} className="fill-text-dark">{Math.round(pct)}</text>
    </svg>
  )
}

function PercentCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="card-soft rounded-2xl p-4 flex-1 min-w-0">
      <p className="text-2xl font-extrabold leading-none" style={{ color }}>{value}%</p>
      <p className="text-xs text-text-grey mt-2">{label}</p>
    </div>
  )
}

function HighlightRow({ icon, color, title, subtitle, last }: { icon: React.ReactNode; color: string; title: string; subtitle: string; last?: boolean }) {
  return (
    <div className={`flex items-center gap-3 py-2.5 ${last ? '' : 'border-b border-divider'}`}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text-dark truncate">{title}</p>
        <p className="text-[11px] text-text-grey truncate">{subtitle}</p>
      </div>
    </div>
  )
}

function ActivityStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1 min-w-0 text-center">
      <p className="text-xl font-bold text-text-dark">{value}</p>
      <p className="text-[11px] text-text-grey mt-0.5 truncate">{label}</p>
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
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F1F3F6" strokeWidth={thickness} />
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
        <text x="50%" y="47%" textAnchor="middle" className="fill-text-dark" style={{ fontSize: 20, fontWeight: 800 }}>{total}</text>
        <text x="50%" y="63%" textAnchor="middle" className="fill-text-grey" style={{ fontSize: 9 }}>biens</text>
      </svg>
      <div className="flex-1 min-w-0 space-y-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-text-grey flex-1 truncate">{s.label}</span>
            <span className="text-xs font-bold text-text-dark">{s.value}</span>
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
        <span className="text-xs font-medium text-text-grey">{label}</span>
        <span className="text-xs font-bold text-text-dark">{value}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F1F3F6' }}>
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
        {data.map((d, i) => <span key={i} className="text-[10px] text-text-grey">{d.label}</span>)}
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
          <p className="font-bold text-text-dark text-sm">{title}</p>
          {subtitle && <p className="text-[11px] text-text-grey">{subtitle}</p>}
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
    <div className="flex-shrink-0 flex items-center gap-1 p-0.5 rounded-lg" style={{ background: '#F1F3F6' }}>
      {([3, 6, 12] as const).map(n => (
        <button key={n} onClick={() => onChange(n)}
          className="px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors"
          style={value === n ? { background: color, color: '#fff' } : { color: '#8A93A3' }}>
          {n}M
        </button>
      ))}
    </div>
  )
}

function EmptyChartState({ label, height = 130 }: { label: string; height?: number }) {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ height }}>
      <svg className="w-7 h-7 text-text-grey/40 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-xs text-text-grey">{label}</p>
    </div>
  )
}

/** Petit indicateur "temps réel" — pastille pulsante + horodatage de dernière synchro. */
function LiveIndicator({ label, refreshing }: { label: string; refreshing: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex w-2 h-2">
        {!refreshing && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#22C55E' }} />}
        <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: refreshing ? '#F59E0B' : '#22C55E' }} />
      </span>
      <span className="text-[11px] text-text-grey">{refreshing ? 'Synchronisation…' : `À jour · ${label}`}</span>
    </div>
  )
}

// ─── Tab: Mes Biens ───────────────────────────────────────────────────────────
function MesBiensTab() {
  const [biens, setBiens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Tous')
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try { const d = await biensApi.mesBiens(); setBiens(Array.isArray(d) ? d : d.data || []) } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = filter === 'Tous' ? biens
    : filter === 'Publié' ? biens.filter(b => b.statut_moderation === 'approuve')
    : filter === 'En attente' ? biens.filter(b => b.statut_moderation === 'en_attente')
    : filter === 'Occupé' ? biens.filter(b => b.statut === 'occupe')
    : biens.filter(b => b.statut_moderation === 'rejete')

  const del = async (id: number) => {
    if (!confirm('Supprimer ce bien ?')) return
    try { await biensApi.delete(id); load() } catch (_) {}
  }

  const [editingBien, setEditingBien] = useState<any>(null)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {editingBien && (
        <EditBienModal bien={editingBien} onClose={() => setEditingBien(null)}
          onSaved={updated => { setBiens(prev => prev.map(b => b.id === updated.id ? updated : b)); setEditingBien(null) }} />
      )}
      <div className="bg-white px-4 py-3 border-b border-divider flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-text-dark">{biens.length} bien{biens.length > 1 ? 's' : ''}</p>
          <div className="flex gap-2">
            <button onClick={() => navigate('/nouveau-bien')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-semibold" style={{ background: BLUE }}>
              <IcPlus /> Ajouter
            </button>
            <button onClick={load} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: BLUE + '15', color: BLUE }}>
              <IcRefresh /> Actualiser
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {['Tous', 'Publié', 'En attente', 'Rejeté', 'Occupé'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border"
              style={filter === f ? { background: BLUE, color: '#fff', borderColor: BLUE } : { color: '#9E9E9E', borderColor: '#E8EAED' }}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
        {loading ? (
          <div className="sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            {[1,2,3].map(n => <div key={n} className="h-48 skeleton rounded-2xl mb-3 sm:mb-0" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: BLUE + '15' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={1.5} className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            </div>
            <p className="font-bold text-text-dark mb-1">Aucun bien trouvé</p>
            <p className="text-sm text-text-grey mb-5">Publiez votre premier bien</p>
            <button onClick={() => navigate('/nouveau-bien')} className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm" style={{ background: BLUE }}>
              <IcPlus /> Ajouter un bien
            </button>
          </div>
        ) : (
          <>
            {/* Cartes — mobile/tablette/petit desktop */}
            <div className="sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 xl:hidden">
              {filtered.map(b => {
                const { label, color } = statutBien(b.statut_moderation || 'en_attente')
                const loc = b.localisation
                const adresse = loc ? `${loc.quartier ? loc.quartier + ', ' : ''}${loc.ville || ''}` : '—'
                const cover = b.photos?.find((p: any) => p.is_cover) || b.photos?.[0]
                return (
                  <div key={b.id} onClick={() => navigate(`/biens/${b.id}`)} role="button" tabIndex={0}
                    className="card-soft rounded-2xl overflow-hidden mb-3 sm:mb-0 cursor-pointer transition-transform hover:-translate-y-0.5">
                    <div className="relative h-32">
                      {cover?.url
                        ? <img src={cover.url} className="w-full h-full object-cover" alt="" />
                        : <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${DARK_BLUE}cc, ${BLUE}aa)` }}><svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} className="w-12 h-12"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg></div>
                      }
                      <div className="absolute inset-0 bg-black/20" />
                      <span className="absolute top-3 left-3 px-2 py-1 rounded-lg text-white text-[11px] font-bold" style={{ background: color }}>{label}</span>
                      <div className="absolute top-3 right-3 flex gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); setEditingBien(b) }} className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.2)' }}><IcEdit /></button>
                        <button onClick={(e) => { e.stopPropagation(); del(b.id) }} className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.2)' }}><IcTrash /></button>
                      </div>
                      <span className="absolute bottom-3 left-3 text-white text-sm font-bold">{fmtPrix(b.prix)}{b.transaction === 'location' ? '/mois' : ''}</span>
                    </div>
                    <div className="p-3.5">
                      <p className="font-bold text-text-dark text-sm">{typeLabel(b.type)}</p>
                      <div className="flex items-center gap-1 mt-0.5"><span className="text-text-grey"><IcPin /></span><span className="text-xs text-text-grey">{adresse}</span></div>
                      {b.statut_moderation === 'rejete' && b.motif_refus && (
                        <div className="mt-2 p-2 rounded-lg bg-danger/5 border border-danger/20"><p className="text-danger text-xs">{b.motif_refus}</p></div>
                      )}
                      {b.statut_moderation === 'en_attente' && (
                        <div className="mt-2 p-2 rounded-lg bg-warning/5 border border-warning/20"><p className="text-warning text-xs">En attente de validation par l'administrateur.</p></div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Table — grand desktop, style admin */}
            <div className="hidden xl:block card-soft rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #EEF1F5' }}>
                    <th className="text-left font-semibold text-text-grey text-xs uppercase tracking-wide px-4 py-3">Bien</th>
                    <th className="text-left font-semibold text-text-grey text-xs uppercase tracking-wide px-4 py-3">Emplacement</th>
                    <th className="text-left font-semibold text-text-grey text-xs uppercase tracking-wide px-4 py-3">Prix</th>
                    <th className="text-left font-semibold text-text-grey text-xs uppercase tracking-wide px-4 py-3">Statut</th>
                    <th className="text-right font-semibold text-text-grey text-xs uppercase tracking-wide px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b, i) => {
                    const { label, color } = statutBien(b.statut_moderation || 'en_attente')
                    const loc = b.localisation
                    const adresse = loc ? `${loc.quartier ? loc.quartier + ', ' : ''}${loc.ville || ''}` : '—'
                    const cover = b.photos?.find((p: any) => p.is_cover) || b.photos?.[0]
                    return (
                      <tr key={b.id} onClick={() => navigate(`/biens/${b.id}`)}
                        className="cursor-pointer hover:bg-surface-g transition-colors"
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F1F3F6' : undefined }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0" style={{ background: `linear-gradient(135deg, ${DARK_BLUE}cc, ${BLUE}aa)` }}>
                              {cover?.url
                                ? <img src={cover.url} className="w-full h-full object-cover" alt="" />
                                : <div className="w-full h-full flex items-center justify-center"><svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg></div>
                              }
                            </div>
                            <p className="font-semibold text-text-dark">{typeLabel(b.type)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-grey">
                          <div className="flex items-center gap-1.5"><span className="text-text-grey/60"><IcPin /></span>{adresse}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-text-dark">{fmtPrix(b.prix)}{b.transaction === 'location' ? '/mois' : ''}</td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: color + '18', color }}>{label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={(e) => { e.stopPropagation(); setEditingBien(b) }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ color: BLUE, background: BLUE + '10' }}><IcEdit /></button>
                            <button onClick={(e) => { e.stopPropagation(); del(b.id) }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ color: '#EF4444', background: '#EF444410' }}><IcTrash /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Messages ────────────────────────────────────────────────────────────
// Reprend chatApi + ChatThread directement (au lieu de naviguer vers la page
// /conversations globale) pour que la sidebar et le topbar du dashboard
// propriétaire restent affichés pendant la messagerie.
const MSG_AVATAR_COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', '#16A34A', '#0891B2']
function formatConvTime(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 86_400_000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 604_800_000) return d.toLocaleDateString('fr-FR', { weekday: 'short' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function MessagesTab() {
  const { user } = useAuth()
  const [convs, setConvs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeConvId, setActiveConvId] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    chatApi.conversations()
      .then(d => setConvs(Array.isArray(d) ? d : d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getOther = (conv: any) => {
    if (!user || !Array.isArray(conv.participants)) return null
    return conv.participants.find((p: any) => p.id !== user.id) || conv.participants[0] || null
  }

  const filtered = (() => {
    const q = search.trim().toLowerCase()
    if (!q) return convs
    return convs.filter(conv => {
      const other = getOther(conv)
      const name = `${other?.prenom || ''} ${other?.nom || ''} ${other?.pseudonyme || ''}`.toLowerCase()
      return name.includes(q)
    })
  })()

  return (
    <div className="flex flex-1 overflow-hidden bg-white">
      {/* Liste — masquée sur mobile/tablette quand une conversation est ouverte */}
      <div className={`w-full md:w-[320px] flex-shrink-0 md:border-r border-divider flex-col overflow-hidden ${activeConvId != null ? 'hidden md:flex' : 'flex'}`}>
        <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-shrink-0 border-b border-divider">
          <h2 className="text-[15px] font-extrabold text-text-dark">Messages</h2>
          {!loading && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white" style={{ background: BLUE }}>{convs.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-divider flex-shrink-0 text-text-grey">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une conversation…"
            className="flex-1 min-w-0 border-none outline-none bg-transparent text-[13px] text-text-dark placeholder:text-[#94A3B8]" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-2">{[1, 2, 3].map(n => <div key={n} className="skeleton h-[64px] rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: BLUE + '15' }}>
                <span style={{ color: BLUE }}><IcMessagesNav /></span>
              </div>
              <p className="text-sm font-bold text-text-dark mb-1">{search ? 'Aucun résultat' : 'Aucune conversation'}</p>
              <p className="text-xs text-text-grey">{search ? `Rien ne correspond à « ${search} ».` : 'Vos échanges avec vos clients apparaîtront ici.'}</p>
            </div>
          ) : filtered.map(conv => {
            const other = getOther(conv)
            const name = other?.prenom || other?.pseudonyme || other?.nom || 'Contact'
            const initiale = (name[0] || '?').toUpperCase()
            const lastMsg = conv.dernierMessage
            const lastContenu = lastMsg?.contenu || (conv.bien ? "À propos d'un bien" : 'Nouvelle conversation')
            const unread = conv.nonLus || 0
            const hasUnread = unread > 0
            const timeStr = formatConvTime(lastMsg?.created_at)
            const isActive = conv.id === activeConvId
            return (
              <button key={conv.id} onClick={() => setActiveConvId(conv.id)}
                className="w-full flex items-center gap-2.5 px-4 py-3 transition-colors text-left"
                style={{ background: isActive ? BLUE + '0C' : 'transparent', borderLeft: isActive ? `3px solid ${BLUE}` : '3px solid transparent' }}>
                <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: MSG_AVATAR_COLORS[Math.abs(other?.id ?? conv.id) % MSG_AVATAR_COLORS.length] }}>
                  <span className="text-white font-bold text-xs">{initiale}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={`text-[13px] truncate ${hasUnread ? 'font-bold text-text-dark' : 'font-semibold text-text-dark'}`}>{name}</p>
                    {timeStr && <p className="text-[11px] text-text-grey flex-shrink-0">{timeStr}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-xs truncate flex-1 ${hasUnread ? 'text-text-dark font-medium' : 'text-text-grey'}`}>{lastContenu}</p>
                    {hasUnread && (
                      <div className="min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BLUE }}>
                        <span className="text-white text-[10px] font-bold">{unread}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Fil de discussion */}
      <div className={`flex-1 flex-col overflow-hidden ${activeConvId != null ? 'flex' : 'hidden md:flex'}`}>
        {activeConvId != null ? (
          <ChatThread convId={activeConvId} onBack={() => setActiveConvId(null)} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8" style={{ background: '#F8FAFC' }}>
            <div className="text-5xl mb-3" style={{ opacity: 0.25 }}>💬</div>
            <p className="text-[15px] font-bold text-text-dark mb-1.5">Sélectionnez une conversation</p>
            <p className="text-text-grey text-[13px] max-w-xs">Choisissez un contact dans la liste pour afficher les messages.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Réservations ────────────────────────────────────────────────────────
function isEchouee(v: any): boolean {
  if (v.statut === 'effectuee' || v.statut === 'annulee') return false
  const raw = v.date_contre_proposee || v.date_souhaitee
  if (!raw) return false
  return new Date(raw).getTime() < Date.now()
}

/** Date de la visite déjà passée (sans le délai de grâce de isEchouee) — désactive Confirmer. */
function isDatePassee(v: any): boolean {
  const raw = v.date_contre_proposee || v.date_souhaitee
  if (!raw) return false
  return new Date(raw).getTime() < Date.now()
}

function VisiteCard({ v, chatLoadingId, onChat, onConfirm, onMarquerEffectuee, cpId, setCpId, cpDate, setCpDate, cpTime, setCpTime, submitting, onContrePropose }: {
  v: any
  chatLoadingId: number | null
  onChat: (v: any) => void
  onConfirm: (id: number) => void
  onMarquerEffectuee: (id: number) => void
  cpId: number | null
  setCpId: (id: number | null) => void
  cpDate: string
  setCpDate: (s: string) => void
  cpTime: string
  setCpTime: (s: string) => void
  submitting: boolean
  onContrePropose: () => void
}) {
  const echouee = isEchouee(v)
  const { label, color } = echouee ? { label: 'Échouée', color: '#EF4444' } : statutVisite(v.statut)
  // L'identité du client n'est jamais masquée côté API (nom/prénom toujours
  // renvoyés) — miroir exact de proprietaire_reservations.dart, qui affiche
  // le prénom réel sans condition de statut.
  const nom = v.client?.prenom || v.client?.nom || 'Client'
  const init = nom ? nom[0].toUpperCase() : 'C'
  const bType = typeLabel(v.bien?.type || '')
  const bLoc = v.bien?.localisation ? `${v.bien.localisation.quartier || ''} ${v.bien.localisation.ville || ''}`.trim() : '—'
  const dateStr = v.date_souhaitee
    ? new Date(v.date_souhaitee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
      + ' à ' + new Date(v.date_souhaitee).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—'
  const contactNumero = v.client?.numero_whatsapp || v.client?.telephone
  return (
    <div className="card-soft rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-[13px] flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${BLUE}, ${DARK_BLUE})` }}>{init}</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-dark text-sm">{nom}</p>
          {v.numeros_partages ? (
            <div className="flex items-center gap-1">
              <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs" style={{ color: '#25D366' }}>Infos de visite disponibles</p>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <svg className="w-2.5 h-2.5 flex-shrink-0 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><rect x="5" y="11" width="14" height="9" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4" /></svg>
              <p className="text-xs text-text-grey">Contact partagé à -30min</p>
            </div>
          )}
        </div>
        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex-shrink-0" style={{ background: color + '20', color }}>{label}</span>
      </div>
      <div className="bg-surface-g rounded-xl p-3 mb-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span style={{ color: BLUE }}><IcHome /></span>
          <p className="text-xs font-medium text-text-dark truncate">{bType} — {bLoc}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-grey"><IcCal /></span>
          <p className="text-xs text-text-grey">Demandé pour : {dateStr}</p>
        </div>
      </div>
      {v.statut === 'contre_proposee' && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-3 text-xs font-medium" style={{ background: '#E67E2210', borderColor: '#E67E2240', color: '#E67E22' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Contre-proposition envoyée. En attente du client.
        </div>
      )}
      {v.statut === 'effectuee' && v.feedback_donne && v.note_client != null && (
        <div className="rounded-xl p-3 mb-3" style={{ background: '#F59E0B10', border: '1px solid #F59E0B30' }}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold" style={{ color: '#F59E0B' }}>Avis du client</p>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(n => (
                <svg key={n} viewBox="0 0 24 24" className="w-3.5 h-3.5" fill={n <= v.note_client ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              ))}
            </div>
          </div>
          {v.feedback_tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {v.feedback_tags.map((t: string) => (
                <span key={t} className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: '#F59E0B18', color: '#F59E0B' }}>{t}</span>
              ))}
            </div>
          )}
          {v.feedback_libre && (
            <p className="text-xs text-text-grey italic">« {v.feedback_libre} »</p>
          )}
        </div>
      )}
      {v.paiement_effectue && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-3 text-xs font-semibold" style={{ background: '#4CAF5010', borderColor: '#4CAF5030', color: '#4CAF50' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Frais de visite payés
        </div>
      )}
      {!echouee && v.statut === 'confirmee' && v.numeros_partages && contactNumero && (
        <div className="flex items-center gap-3 p-3 rounded-xl mb-3" style={{ background: '#25D36614', border: '1px solid #25D36650' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#25D36626' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold" style={{ color: '#25D366' }}>Visite dans 30 min — Contact client</p>
            <p className="text-sm font-bold text-text-dark">{contactNumero}</p>
          </div>
          <a href={`https://wa.me/${contactNumero.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-white text-[11px] font-bold flex-shrink-0" style={{ background: '#25D366' }}>
            WhatsApp
          </a>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => onChat(v)} disabled={chatLoadingId === v.id}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold disabled:opacity-50" style={{ borderColor: BLUE + '50', color: BLUE, background: BLUE + '10' }}>
          <IcChat /> {chatLoadingId === v.id ? '…' : 'Chat'}
        </button>
        {v.statut === 'en_attente' && <>
          <button onClick={() => setCpId(v.id)} className="flex-1 py-2 rounded-xl border text-xs font-bold text-center" style={{ borderColor: BLUE + '80', color: BLUE }}>Autre créneau</button>
          <button onClick={() => onConfirm(v.id)} disabled={isDatePassee(v)}
            className="flex-1 py-2 rounded-xl text-white text-xs font-bold disabled:cursor-not-allowed"
            style={{ background: isDatePassee(v) ? 'rgba(158,158,158,0.5)' : '#4CAF50' }}>
            {isDatePassee(v) ? 'Date dépassée' : 'Confirmer'}
          </button>
        </>}
        {v.statut === 'confirmee' && (
          <button onClick={() => { if (confirm('Confirmez-vous que la visite a bien eu lieu ?')) onMarquerEffectuee(v.id) }}
            className="flex-1 py-2 rounded-xl text-white text-xs font-bold" style={{ background: BLUE }}>Marquer effectuée</button>
        )}
      </div>
      {cpId === v.id && (
        <div className="mt-3 pt-3 border-t border-divider">
          <p className="text-sm font-bold text-text-dark mb-3">Proposer un autre créneau</p>
          <div className="space-y-2 mb-3">
            <input type="date" value={cpDate} onChange={e => setCpDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              max={new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)}
              className="w-full bg-surface-g rounded-xl px-3 py-2.5 text-sm outline-none border border-divider focus:border-primary" />
            <input type="time" value={cpTime} onChange={e => setCpTime(e.target.value)}
              className="w-full bg-surface-g rounded-xl px-3 py-2.5 text-sm outline-none border border-divider focus:border-primary" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCpId(null)} className="flex-1 py-2.5 rounded-xl border border-divider text-sm font-semibold text-text-grey">Annuler</button>
            <button onClick={onContrePropose} disabled={!cpDate || !cpTime || submitting}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: BLUE }}>
              {submitting ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Carte compacte (grille) — aperçu d'une réservation, ouvre le détail complet au clic. */
function ReservationCard({ v, bien, onClick }: { v: any; bien?: any; onClick: () => void }) {
  const echouee = isEchouee(v)
  const { label, color } = echouee ? { label: 'Échouée', color: '#EF4444' } : statutVisite(v.statut)
  const bType = typeLabel(v.bien?.type || '')
  const loc = v.bien?.localisation
  const bLoc = loc ? `${loc.quartier ? loc.quartier + ', ' : ''}${loc.ville || ''}` : '—'
  const clientNom = v.client?.prenom || v.client?.nom || 'Client'
  const dateStr = v.date_souhaitee ? new Date(v.date_souhaitee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'
  const heureStr = v.date_souhaitee ? new Date(v.date_souhaitee).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''
  const cover = bien?.photos?.find((p: any) => p.is_cover) || bien?.photos?.[0]

  return (
    <div onClick={onClick} role="button" tabIndex={0}
      className="card-soft rounded-2xl overflow-hidden cursor-pointer transition-transform hover:-translate-y-0.5">
      <div className="relative h-32">
        {cover?.url
          ? <img src={cover.url} className="w-full h-full object-cover" alt="" />
          : <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl" style={{ background: `linear-gradient(135deg, ${DARK_BLUE}cc, ${BLUE}aa)` }}>
              {clientNom[0]?.toUpperCase() || '?'}
            </div>}
        <div className="absolute inset-0 bg-black/10" />
        <span className="absolute top-2.5 left-2.5 px-2 py-1 rounded-lg bg-white/95 text-text-dark text-[10px] font-bold uppercase tracking-wide">{bType}</span>
        <span className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-lg text-white text-[10px] font-bold" style={{ background: color }}>{label}</span>
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="font-bold text-text-dark text-sm truncate">{clientNom}</p>
          <div className="text-right flex-shrink-0">
            <p className="font-extrabold text-sm leading-none" style={{ color: BLUE }}>{dateStr}</p>
            {heureStr && <p className="text-[10px] text-text-grey mt-0.5">{heureStr}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-text-grey mb-2.5">
          <IcPin /><span className="text-xs truncate">{bLoc}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2.5" style={{ borderTop: '1px solid #F1F3F6' }}>
          <div>
            <p className="text-[9px] font-semibold text-text-grey uppercase tracking-wide">Frais visite</p>
            <p className="text-xs font-semibold text-text-dark mt-0.5">{Number(v.frais_visite) > 0 ? fmtPrix(v.frais_visite) : 'Gratuit'}</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold text-text-grey uppercase tracking-wide">Paiement</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: v.paiement_effectue ? '#22C55E' : '#9E9E9E' }}>{v.paiement_effectue ? 'Payé ✓' : '—'}</p>
          </div>
        </div>
        <p className="text-right text-[11px] font-bold mt-2.5" style={{ color: BLUE }}>Voir le détail →</p>
      </div>
    </div>
  )
}

/** Modal de détail — reprend VisiteCard (chat, confirmer, contre-proposer, marquer effectuée…) en plein. */
function ReservationDetailModal({ v, onClose, chatLoadingId, onChat, onConfirm, onMarquerEffectuee, cpId, setCpId, cpDate, setCpDate, cpTime, setCpTime, submitting, onContrePropose }: {
  v: any
  onClose: () => void
  chatLoadingId: number | null
  onChat: (v: any) => void
  onConfirm: (id: number) => void
  onMarquerEffectuee: (id: number) => void
  cpId: number | null
  setCpId: (id: number | null) => void
  cpDate: string
  setCpDate: (s: string) => void
  cpTime: string
  setCpTime: (s: string) => void
  submitting: boolean
  onContrePropose: () => void
}) {
  const clientNom = v.client?.prenom || v.client?.nom || 'Réservation'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider sticky top-0 bg-white z-10">
          <h2 className="font-bold text-text-dark">Réservation — {clientNom}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-g text-text-grey flex-shrink-0">✕</button>
        </div>
        <div className="p-5">
          <VisiteCard v={v} chatLoadingId={chatLoadingId} onChat={onChat} onConfirm={onConfirm} onMarquerEffectuee={onMarquerEffectuee}
            cpId={cpId} setCpId={setCpId} cpDate={cpDate} setCpDate={setCpDate} cpTime={cpTime} setCpTime={setCpTime}
            submitting={submitting} onContrePropose={onContrePropose} />
        </div>
      </div>
    </div>
  )
}

function ReservationsTab({ biens }: { biens: any[] }) {
  const navigate = useNavigate()
  const [visites, setVisites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Toutes')
  const [bienIdFilter, setBienIdFilter] = useState<number | null>(null)
  const [cpId, setCpId] = useState<number | null>(null)
  const [cpDate, setCpDate] = useState('')
  const [cpTime, setCpTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [chatLoadingId, setChatLoadingId] = useState<number | null>(null)
  const [modalVisiteId, setModalVisiteId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try { const d = await visitesApi.reservationsRecues(); setVisites(Array.isArray(d) ? d : d.data || []) } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const biensUniques = (() => {
    const seen = new Set<number>()
    const list: { id: number; label: string }[] = []
    for (const v of visites) {
      const id = v.bien?.id
      if (!id || seen.has(id)) continue
      seen.add(id)
      const loc = v.bien?.localisation
      list.push({ id, label: `${typeLabel(v.bien?.type || '')} — ${loc?.quartier || loc?.ville || ''}` })
    }
    return list
  })()

  const byBien = bienIdFilter ? visites.filter(v => v.bien?.id === bienIdFilter) : visites
  const filtered = filter === 'Toutes' ? byBien
    : filter === 'À traiter' ? byBien.filter(v => !isEchouee(v) && (v.statut === 'en_attente' || v.statut === 'contre_proposee'))
    : filter === 'Confirmées' ? byBien.filter(v => !isEchouee(v) && v.statut === 'confirmee')
    : filter === 'Effectuées' ? byBien.filter(v => v.statut === 'effectuee')
    : filter === 'Échouées' ? byBien.filter(v => isEchouee(v))
    : byBien.filter(v => v.statut === 'annulee')

  const confirmer = async (id: number) => {
    try { await visitesApi.confirmerVisite(id); load() } catch (_) {}
  }

  const marquerEffectuee = async (id: number) => {
    try { await visitesApi.marquerEffectuee(id); load() } catch (_) {}
  }

  const ouvrirChat = async (v: any) => {
    const clientId = v.client?.id
    const bienId = v.bien?.id
    if (!clientId || !bienId) return
    setChatLoadingId(v.id)
    try {
      const convs = await chatApi.conversations()
      const list = Array.isArray(convs) ? convs : convs.data || []
      const match = list.find((c: any) => c.bien?.id === bienId && c.participants?.some((p: any) => p.id === clientId))
      if (match) navigate(`/conversations/${match.id}`)
      else alert('Ce client n\'a pas encore démarré de conversation pour ce bien.')
    } catch (_) {}
    setChatLoadingId(null)
  }

  const contreProposer = async () => {
    if (!cpId || !cpDate || !cpTime) return
    setSubmitting(true)
    try {
      const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
      await fetch(`${BASE}/visites/${cpId}/contre-proposer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}` },
        body: JSON.stringify({ date_proposee: `${cpDate}T${cpTime}:00` }),
      })
      setCpId(null); setCpDate(''); setCpTime('')
      load()
    } catch (_) {}
    setSubmitting(false)
  }

  const modalVisite = modalVisiteId ? visites.find(v => v.id === modalVisiteId) || null : null

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="bg-white border-b border-divider px-4 pt-3.5 pb-2.5 flex gap-2.5 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
        {['Toutes', 'À traiter', 'Confirmées', 'Effectuées', 'Annulées', 'Échouées'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-colors"
            style={filter === f ? { background: BLUE, color: '#fff', borderColor: BLUE } : { color: '#5F6B7A', borderColor: '#E8EAED' }}>
            {f}
          </button>
        ))}
      </div>
      {biensUniques.length >= 2 && (
        <div className="bg-white border-b border-divider px-4 pt-2.5 pb-3.5 flex gap-2.5 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setBienIdFilter(null)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-colors"
            style={bienIdFilter === null ? { background: DARK_BLUE, color: '#fff', borderColor: DARK_BLUE } : { color: '#9E9E9E', borderColor: '#E8EAED' }}>
            Tous les biens
          </button>
          {biensUniques.map(b => (
            <button key={b.id} onClick={() => setBienIdFilter(b.id)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-colors"
              style={bienIdFilter === b.id ? { background: DARK_BLUE, color: '#fff', borderColor: DARK_BLUE } : { color: '#9E9E9E', borderColor: '#E8EAED' }}>
              {b.label}
            </button>
          ))}
        </div>
      )}
      {loading ? (
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {[1, 2, 3].map(n => <div key={n} className="h-64 skeleton rounded-2xl" />)}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: BLUE + '15' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <p className="font-bold text-text-dark mb-1">Aucune réservation</p>
            <p className="text-sm text-text-grey text-center">Les demandes de visite apparaîtront ici</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map((v, i) => (
              <ReservationCard key={v.id || i} v={v} bien={biens?.find(b => b.id === v.bien?.id)} onClick={() => setModalVisiteId(v.id)} />
            ))}
          </div>
        </div>
      )}
      {modalVisite && (
        <ReservationDetailModal v={modalVisite} onClose={() => setModalVisiteId(null)}
          chatLoadingId={chatLoadingId} onChat={ouvrirChat} onConfirm={confirmer} onMarquerEffectuee={marquerEffectuee}
          cpId={cpId} setCpId={setCpId} cpDate={cpDate} setCpDate={setCpDate} cpTime={cpTime} setCpTime={setCpTime}
          submitting={submitting} onContrePropose={contreProposer} />
      )}
    </div>
  )
}

// ─── Tab: Délégations ─────────────────────────────────────────────────────────
function DelegationsTab({ onBack }: { onBack: () => void }) {
  const [delegations, setDelegations] = useState<any[]>([])
  const [biens, setBiens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [demarcheur, setDemarcheur] = useState<any>(null)
  const [bienId, setBienId] = useState('')
  const [commission, setCommission] = useState('50')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [d, b] = await Promise.allSettled([delegationApi.emises(), biensApi.mesBiens()])
      if (d.status === 'fulfilled') setDelegations(Array.isArray(d.value) ? d.value : d.value.data || [])
      if (b.status === 'fulfilled') setBiens(Array.isArray(b.value) ? b.value : b.value.data || [])
    } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (search.trim().length < 2) { setResults([]); return }
    setSearching(true)
    const t = setTimeout(() => {
      delegationApi.rechercherDemarcheur(search.trim())
        .then(d => setResults(Array.isArray(d) ? d : d.data || []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const proposer = async () => {
    if (!demarcheur) return
    setSaving(true)
    setError('')
    try {
      await delegationApi.proposer({
        demarcheur_id: demarcheur.id,
        bien_id: bienId === 'tous' ? undefined : Number(bienId),
        taux_commission_demarcheur: Number(commission) || 0,
      })
      setShowForm(false); setDemarcheur(null); setSearch(''); setBienId(''); setCommission('50')
      load()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Impossible de créer la délégation')
    }
    setSaving(false)
  }

  const revoquer = async (id: number) => {
    try { await delegationApi.revoquer(id); load() } catch (_) {}
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="bg-white px-4 py-3 border-b border-divider flex items-center justify-between flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-text-grey text-sm font-semibold">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Délégations
        </button>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-semibold" style={{ background: BLUE }}>
          <IcPlus /> Déléguer
        </button>
      </div>

      {showForm && (
        <div className="bg-white border-b border-divider px-4 py-4 space-y-2 flex-shrink-0">
          {error && <p className="text-danger text-xs">{error}</p>}
          {demarcheur ? (
            <div className="flex items-center justify-between bg-surface-g rounded-xl px-3 py-2.5 border border-divider">
              <span className="text-sm font-semibold text-text-dark">{demarcheur.prenom} {demarcheur.nom}</span>
              <button onClick={() => { setDemarcheur(null); setSearch('') }} className="text-danger text-xs font-bold">Changer</button>
            </div>
          ) : (
            <div className="relative">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un démarcheur (nom, téléphone)…"
                className="w-full bg-surface-g rounded-xl px-3 py-2.5 text-sm outline-none border border-divider"
              />
              {search.trim().length >= 2 && (
                <div className="mt-1 card-soft rounded-xl border border-divider max-h-40 overflow-y-auto">
                  {searching ? (
                    <p className="px-3 py-2.5 text-xs text-text-grey">Recherche…</p>
                  ) : results.length === 0 ? (
                    <p className="px-3 py-2.5 text-xs text-text-grey">Aucun démarcheur trouvé.</p>
                  ) : results.map(r => (
                    <button key={r.id} onClick={() => { setDemarcheur(r); setResults([]) }}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-surface-g border-b border-divider last:border-b-0">
                      {r.prenom} {r.nom} <span className="text-text-grey text-xs">{r.telephone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <select value={bienId} onChange={e => setBienId(e.target.value)}
            className="w-full bg-surface-g rounded-xl px-3 py-2.5 text-sm outline-none border border-divider">
            <option value="" disabled>-- Choisir un bien --</option>
            <option value="tous">Tous mes biens</option>
            {biens.map(b => <option key={b.id} value={b.id}>{typeLabel(b.type)} — {b.localisation?.ville}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-grey flex-shrink-0">Commission démarcheur</span>
            <input type="number" min={0} max={100} value={commission} onChange={e => setCommission(e.target.value)}
              className="flex-1 bg-surface-g rounded-xl px-3 py-2 text-sm outline-none border border-divider" />
            <span className="text-xs text-text-grey">%</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-divider text-sm font-semibold text-text-grey">Annuler</button>
            <button onClick={proposer} disabled={!demarcheur || !bienId || saving} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: BLUE }}>
              {saving ? 'Envoi…' : 'Envoyer la proposition'}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? [1, 2].map(n => <div key={n} className="h-20 skeleton rounded-xl mb-3" />) : delegations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: BLUE + '15' }}>
              <IcPerson />
            </div>
            <p className="font-bold text-text-dark mb-1">Aucune délégation</p>
            <p className="text-sm text-text-grey text-center px-6">Confiez la gestion d'un bien à un démarcheur de confiance.</p>
          </div>
        ) : delegations.map(d => {
          const meta = DELEG_STATUT[d.statut] || { label: d.statut, color: '#9CA3AF' }
          return (
            <div key={d.id} className="card-soft rounded-xl p-4 mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-text-dark text-sm">{d.demarcheur?.prenom} {d.demarcheur?.nom}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: meta.color, background: meta.color + '18' }}>{meta.label}</span>
              </div>
              <p className="text-xs text-text-grey mb-2">
                {d.bien ? `${typeLabel(d.bien.type)} — ${d.bien.localisation?.ville || ''}` : 'Tous les biens'}
              </p>
              {d.statut === 'active' && (
                <button onClick={() => revoquer(d.id)} className="text-xs font-bold text-danger">Révoquer</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab: Loyers ──────────────────────────────────────────────────────────────
function LoyersTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { loyersApi.dashboard().then(setData).catch(() => {}).finally(() => setLoading(false)) }, [])
  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  const stats = data?.stats || {}
  const contrats: any[] = data?.contrats || []
  const loyers: any[] = contrats.flatMap((c: any) => (c.loyers || []).map((l: any) => ({ ...l, bien: c.bien, locataire: c.locataire })))
  const enAttenteMontant = loyers.filter(l => l.statut === 'en_attente' || l.statut === 'en_retard').reduce((s, l) => s + Number(l.montant || 0), 0)
  const enRetardCount = stats.loyers_en_retard ?? loyers.filter(l => l.statut === 'en_retard').length
  const sorted = [...loyers].sort((a, b) => new Date(b.date_echeance || 0).getTime() - new Date(a.date_echeance || 0).getTime())

  const loyerStatut = (s: string) =>
    s === 'paye'      ? { label: 'Payé',       color: '#4CAF50' } :
    s === 'en_retard' ? { label: 'En retard',  color: '#F44336' } :
                         { label: 'En attente', color: '#FF9800' }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 xl:px-10 py-5 md:py-8">
      <div className="xl:max-w-5xl xl:mx-auto">
        {/* Hero — revenu total */}
        <div className="rounded-2xl p-5 md:p-6 mb-5 text-white" style={{ background: `linear-gradient(135deg, ${DARK_BLUE}, ${BLUE})`, boxShadow: `0 8px 20px ${BLUE}4D` }}>
          <p className="text-white/70 text-sm mb-1">Revenus totaux perçus</p>
          <p className="text-2xl md:text-3xl font-extrabold">{Number(stats.revenus_total ?? 0).toLocaleString('fr-FR')} FCFA</p>
        </div>

        {/* Cartes KPI — détail du mois, en attente, en retard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
          <StatCard icon={<IcWallet />} color="#4CAF50" label="Encaissé ce mois-ci" value={`${Number(stats.revenus_mois ?? 0).toLocaleString('fr-FR')} FCFA`} />
          <StatCard icon={<IcClock />} color="#FF9800" label="En attente de paiement" value={`${Number(enAttenteMontant).toLocaleString('fr-FR')} FCFA`} />
          <StatCard icon={<IcMoney />} color="#F44336" label="Loyers en retard" value={`${enRetardCount}`} />
        </div>

        <p className="text-[17px] font-bold text-text-dark mb-3.5">Historique des loyers</p>
        {sorted.length === 0 ? (
          <div className="card-soft rounded-2xl flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: BLUE + '15' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p className="font-bold text-text-dark mb-1">Aucun loyer</p>
            <p className="text-sm text-text-grey">Les loyers apparaîtront ici</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sorted.map((l: any, i: number) => {
              const { label, color } = loyerStatut(l.statut)
              return (
                <div key={l.id || i} className="card-soft rounded-[14px] p-3.5 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '15' }}>
                    <span style={{ color }}><IcWallet /></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-text-dark text-sm truncate">{typeLabel(l.bien?.type || '')} — {l.bien?.localisation?.ville || '—'}</p>
                    <p className="text-xs text-text-grey mt-0.5 truncate">{l.locataire?.prenom} {l.locataire?.nom}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-text-dark text-xs">{Number(l.montant).toLocaleString('fr-FR')} FCFA</p>
                    <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: color + '20', color }}>{label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Portefeuille ────────────────────────────────────────────────────────
function WalletMaskIcon({ path, size = 20 }: { path: string; size?: number }) {
  const url = svgMaskUrl(path)
  return (
    <span aria-hidden="true" style={{
      display: 'inline-block', width: size, height: size, background: 'currentColor', flexShrink: 0,
      WebkitMaskImage: url, maskImage: url,
      WebkitMaskSize: 'contain', maskSize: 'contain',
      WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center', maskPosition: 'center',
    }} />
  )
}

// Moyens de retrait Mobile Money proposés côté mobile (retrait_screen.dart) —
// puces de couleur + initiales plutôt que les logos officiels MTN/Moov/Celtiis
// (marques déposées de tiers, on ne les reproduit pas ici).
const RETRAIT_METHODES: { key: string; label: string; short: string; sub: string; bg: string; fg: string }[] = [
  { key: 'MTN MoMo',     label: 'MTN MoMo',     short: 'MTN',  sub: 'Retrait via MTN Mobile Money',     bg: '#FFCC00', fg: '#3D2E00' },
  { key: 'Moov Flooz',   label: 'Moov Flooz',   short: 'MOOV', sub: 'Retrait via Moov Mobile Money',    bg: '#0066CC', fg: '#FFFFFF' },
  { key: 'Celtiis Cash', label: 'Celtiis Cash', short: 'CEL',  sub: 'Retrait via Celtiis Mobile Money', bg: '#E63946', fg: '#FFFFFF' },
]

function RetraitModal({ solde, onClose, onSuccess }: { solde: number; onClose: () => void; onSuccess: () => void }) {
  const [montant, setMontant] = useState('')
  const [methode, setMethode] = useState<string | null>(null)
  const [numero, setNumero] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const montantNum = Number(montant)
  const montantValide = montantNum >= 1000 && montantNum <= solde

  const confirmer = async () => {
    if (!methode) { setError('Choisissez un moyen de retrait.'); return }
    if (!montant || !montantValide) { setError(montantNum > solde ? 'Montant supérieur à votre solde disponible.' : 'Montant minimum : 1 000 FCFA.'); return }
    if (!numero.trim()) { setError('Entrez votre numéro Mobile Money.'); return }
    setError('')
    setSubmitting(true)
    try {
      const res = await walletApi.demandeRetrait(montantNum, methode, numero.trim())
      setSuccessMsg(res?.message || 'Demande de retrait enregistrée.')
      onSuccess()
    } catch (e: any) {
      setError(e?.response?.data?.message || "Impossible d'envoyer la demande. Réessayez.")
    }
    setSubmitting(false)
  }

  if (successMsg) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
        <div className="bg-white rounded-2xl w-full max-w-sm p-7 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)', boxShadow: '0 8px 20px rgba(76,175,80,0.35)' }}>
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <p className="font-bold text-text-dark text-lg mb-2">Retrait initié !</p>
          <p className="text-sm text-text-grey leading-relaxed mb-6">
            Retrait de {montantNum.toLocaleString('fr-FR')} FCFA via {methode}. {successMsg}
          </p>
          <button onClick={onClose} className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ background: BLUE }}>Fermer</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-text-dark">Demander un retrait</h2>
            <p className="text-xs text-text-grey mt-0.5">Solde disponible : {solde.toLocaleString('fr-FR')} FCFA</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-g text-text-grey flex-shrink-0">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="px-3.5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#EF444414', color: '#EF4444', border: '1px solid #EF444430' }}>
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-text-dark uppercase tracking-wide mb-2 block">Montant à retirer</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="5" width="20" height="14" rx="2" /><path strokeLinecap="round" d="M2 10h20" /></svg>
              <input type="number" value={montant} onChange={e => setMontant(e.target.value)} placeholder="Ex: 50000" min={1000} max={solde}
                className="w-full bg-surface-g border border-divider rounded-xl pl-10 pr-16 py-3 text-sm font-bold outline-none focus:border-primary" />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-grey">FCFA</span>
            </div>
            <p className="text-[11px] text-text-grey mt-1.5">Minimum 1 000 FCFA — traitement sous 48 heures ouvrées.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-text-dark uppercase tracking-wide mb-2 block">Choisir le mode de retrait</label>
            <div className="space-y-2">
              {RETRAIT_METHODES.map(m => {
                const selected = methode === m.key
                return (
                  <button key={m.key} onClick={() => setMethode(m.key)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors"
                    style={{ borderColor: selected ? BLUE : '#E8EAED', background: selected ? BLUE + '0A' : '#fff' }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-extrabold text-[11px]"
                      style={{ background: m.bg, color: m.fg }}>
                      {m.short}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm" style={{ color: selected ? BLUE : '#1D1D1F' }}>{m.label}</p>
                      <p className="text-xs text-text-grey">{m.sub}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2"
                      style={{ borderColor: selected ? BLUE : '#E8EAED', background: selected ? BLUE : 'transparent' }}>
                      {selected && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {methode && (
            <div>
              <label className="text-xs font-bold text-text-dark uppercase tracking-wide mb-2 block">Numéro {methode}</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <input type="tel" value={numero} onChange={e => setNumero(e.target.value)} placeholder="Ex: 97000000"
                  className="w-full bg-surface-g border border-divider rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary" />
              </div>
            </div>
          )}

          <button onClick={confirmer} disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
            style={{ background: BLUE }}>
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                Confirmer le retrait
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function PortefeuilleTab({ onOpenTransactions }: { onOpenTransactions: () => void }) {
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTrans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showRetrait, setShowRetrait] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [w, t] = await Promise.all([walletApi.me(), walletApi.transactions()])
      setWallet(w); setTrans(Array.isArray(t) ? t : t.data || [])
    } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const solde = Number(wallet?.solde || 0)

  const now = new Date()
  const recuCeMois = transactions
    .filter(t => {
      const d = new Date(t.created_at)
      return (t.type === 'credit' || Number(t.montant) > 0) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((s, t) => s + Number(t.montant), 0)
  const derniereTx = transactions[0]
  const derniereLabel = derniereTx
    ? new Date(derniereTx.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : '—'
  const updatedLabel = wallet?.updated_at
    ? new Date(wallet.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-8">
      <div>
        {/* Carte solde — style carte bancaire, motif décoratif discret */}
        <div className="relative overflow-hidden rounded-2xl p-6 mb-5 text-white"
          style={{ background: `linear-gradient(135deg, ${DARK_BLUE}, ${BLUE})`, boxShadow: `0 12px 30px ${BLUE}40` }}>
          <div className="absolute rounded-full pointer-events-none" style={{ width: 220, height: 220, top: -110, right: -60, background: 'rgba(255,255,255,0.06)' }} />
          <div className="absolute rounded-full pointer-events-none" style={{ width: 140, height: 140, bottom: -70, right: 40, background: 'rgba(255,255,255,0.05)' }} />
          <div className="relative flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-white/70">
              <WalletMaskIcon path='<rect x="2" y="6" width="20" height="14" rx="3"/><path d="M2 10h20"/><circle cx="17" cy="15" r="1.4" fill="white"/>' />
              <span className="text-sm">Solde disponible</span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(255,255,255,0.16)' }}>PROPRIÉTAIRE</span>
          </div>
          <p className="relative text-[32px] font-extrabold tracking-tight mb-1">{loading ? '…' : solde.toLocaleString('fr-FR')} <span className="text-lg font-bold">FCFA</span></p>
          <p className="relative text-white/50 text-xs mb-6">Mis à jour le {updatedLabel}</p>
          <div className="relative flex flex-wrap gap-2.5">
            <button onClick={() => setShowRetrait(o => !o)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.16)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8l-8 8-8-8" /></svg>
              Demander un retrait
            </button>
            <button onClick={onOpenTransactions}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-white transition-opacity hover:opacity-90" style={{ color: BLUE }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 7h6m-6 4h6" /></svg>
              Historique complet
            </button>
          </div>
        </div>

        {/* Mini-stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card-soft rounded-2xl p-3.5 min-w-0">
            <p className="text-[10px] font-semibold text-text-grey uppercase tracking-wide mb-1">Reçu ce mois</p>
            <p className="text-sm font-bold text-text-dark truncate">{recuCeMois.toLocaleString('fr-FR')} F</p>
          </div>
          <div className="card-soft rounded-2xl p-3.5">
            <p className="text-[10px] font-semibold text-text-grey uppercase tracking-wide mb-1">Transactions</p>
            <p className="text-sm font-bold text-text-dark">{transactions.length}</p>
          </div>
          <div className="card-soft rounded-2xl p-3.5">
            <p className="text-[10px] font-semibold text-text-grey uppercase tracking-wide mb-1">Dernière</p>
            <p className="text-sm font-bold text-text-dark">{derniereLabel}</p>
          </div>
        </div>

        {/* Transactions récentes */}
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-text-dark">Transactions récentes</p>
          {transactions.length > 0 && (
            <button onClick={onOpenTransactions} className="text-xs font-semibold" style={{ color: BLUE }}>Voir tout →</button>
          )}
        </div>
        {loading ? [1, 2, 3].map(n => <div key={n} className="h-16 skeleton rounded-xl mb-2" />) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center card-soft rounded-2xl">
            <p className="font-bold text-text-dark mb-1">Aucune transaction</p>
            <p className="text-sm text-text-grey">Vos loyers, frais de visite et intégrations apparaîtront ici.</p>
          </div>
        ) : transactions.slice(0, 5).map((t: any, i: number) => {
          const isCredit = t.type === 'credit' || Number(t.montant) > 0
          const cat = categorieTransaction(t.description)
          return (
            <div key={t.id || i} className="flex items-center gap-3 p-3.5 card-soft rounded-xl mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cat.color + '18' }}>
                <span style={{ color: cat.color }}>{isCredit ? <IcTrendUp /> : <IcTrendDown />}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-dark text-sm truncate">{t.description || (isCredit ? 'Crédit' : 'Débit')}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ background: cat.color + '15', color: cat.color }}>{cat.label}</span>
                  <span className="text-[10px] text-text-grey">{new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
              <p className="font-bold text-sm flex-shrink-0" style={{ color: isCredit ? '#22C55E' : '#EF4444' }}>
                {isCredit ? '+' : '-'}{Math.abs(Number(t.montant)).toLocaleString('fr-FR')} F
              </p>
            </div>
          )
        })}
      </div>
      {showRetrait && (
        <RetraitModal solde={solde} onClose={() => setShowRetrait(false)} onSuccess={load} />
      )}
    </div>
  )
}

// ─── Tab: Historique des transactions ──────────────────────────────────────────
// Seules 3 catégories existent réellement côté backend (wallets.service.ts /
// paiements.service.ts) : loyers encaissés, frais de visite, intégrations
// locataires — le "statut" n'existe pas comme champ (une ligne = un mouvement
// déjà survenu, donc toujours "Complété" ; les retraits ne créent pas encore
// de ligne débit côté serveur, "Total sorties" reflète honnêtement ce vide).
function categorieTransaction(description: string): { label: string; color: string } {
  const d = (description || '').toLowerCase()
  if (d.startsWith('loyer')) return { label: 'Loyer', color: BLUE }
  if (d.startsWith('frais de visite')) return { label: 'Visite', color: '#7B2FBE' }
  if (d.startsWith('intégration') || d.startsWith('integration')) return { label: 'Intégration', color: '#F59E0B' }
  return { label: 'Autre', color: '#6B7280' }
}

function TransactionsTab() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'tous' | 'credit' | 'debit'>('tous')
  const [catFilter, setCatFilter] = useState('Tous')

  useEffect(() => {
    setLoading(true)
    walletApi.transactions()
      .then(t => setTransactions(Array.isArray(t) ? t : t.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const categories = ['Tous', ...Array.from(new Set(transactions.map(t => categorieTransaction(t.description).label)))]

  const filtered = transactions.filter(t => {
    const isCredit = t.type === 'credit' || Number(t.montant) > 0
    if (typeFilter === 'credit' && !isCredit) return false
    if (typeFilter === 'debit' && isCredit) return false
    const cat = categorieTransaction(t.description).label
    if (catFilter !== 'Tous' && cat !== catFilter) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      if (!`${t.description || ''} ${t.reference || ''}`.toLowerCase().includes(q)) return false
    }
    return true
  })

  const totalIn = transactions.filter(t => t.type === 'credit' || Number(t.montant) > 0).reduce((s, t) => s + Number(t.montant), 0)
  const totalOut = transactions.filter(t => t.type === 'debit' && Number(t.montant) < 0).reduce((s, t) => s + Math.abs(Number(t.montant)), 0)
  const largest = transactions.reduce((m, t) => Math.max(m, Math.abs(Number(t.montant))), 0)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Topbar de section — titre + filtres (l'entête général de l'app reste au-dessus) */}
      <div className="bg-white border-b border-divider flex items-center gap-3 px-4 md:px-6 py-3 flex-shrink-0 flex-wrap">
        <h1 className="text-[17px] font-bold uppercase tracking-wide" style={{ color: BLUE }}>Historique des transactions</h1>
        <div className="flex-1" />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="bg-white border border-divider rounded-lg px-2.5 py-1.5 text-sm outline-none">
          {categories.map(c => <option key={c} value={c}>{c === 'Tous' ? 'Toutes les catégories' : c}</option>)}
        </select>
        <div className="flex items-center rounded-lg border border-divider p-0.5">
          {(['tous', 'credit', 'debit'] as const).map(f => (
            <button key={f} onClick={() => setTypeFilter(f)}
              className="rounded-md px-3 py-1 text-xs font-semibold transition-colors"
              style={typeFilter === f ? { background: BLUE, color: '#fff' } : { color: '#8A93A3' }}>
              {f === 'tous' ? 'Tous' : f === 'credit' ? 'Entrées' : 'Sorties'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
      {/* Cartes de synthèse */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="flex items-center gap-3 rounded-xl card-soft p-3.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#22C55E18' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17 7 7 17M17 17H7V7" /></svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-text-grey">Total entrées</p>
            <p className="text-base font-bold text-text-dark truncate">{fmtPrix(totalIn)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl card-soft p-3.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#EF444418' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10v10M7 17 17 7" /></svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-text-grey">Total sorties</p>
            <p className="text-base font-bold text-text-dark truncate">{fmtPrix(totalOut)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl card-soft p-3.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BLUE + '18' }}>
            <span style={{ color: BLUE }}><IcTrendUp /></span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-text-grey">Plus grosse</p>
            <p className="text-base font-bold text-text-dark truncate">{fmtPrix(largest)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl card-soft p-3.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#F1F3F6' }}>
            <span className="text-text-grey font-bold text-sm">#</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-text-grey">Nombre</p>
            <p className="text-base font-bold text-text-dark truncate">{transactions.length}</p>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative mb-4">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-grey">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une transaction…"
          className="w-full bg-white border border-divider rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:border-primary" />
      </div>

      {/* Tableau */}
      <div className="rounded-xl overflow-hidden card-soft">
        {loading ? (
          <div className="p-4 space-y-2">{[1, 2, 3, 4].map(n => <div key={n} className="h-14 skeleton rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <p className="font-bold text-text-dark mb-1">Aucune transaction</p>
            <p className="text-sm text-text-grey px-6">{search || catFilter !== 'Tous' || typeFilter !== 'tous' ? 'Rien ne correspond à ces filtres.' : 'Vos revenus (loyers, frais de visite, intégrations) apparaîtront ici.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #EEF1F5' }}>
                  <th className="text-left font-semibold text-text-grey text-[11px] uppercase tracking-wide px-4 py-2.5">Transaction</th>
                  <th className="text-left font-semibold text-text-grey text-[11px] uppercase tracking-wide px-4 py-2.5 hidden sm:table-cell">Référence</th>
                  <th className="text-right font-semibold text-text-grey text-[11px] uppercase tracking-wide px-4 py-2.5">Montant</th>
                  <th className="text-left font-semibold text-text-grey text-[11px] uppercase tracking-wide px-4 py-2.5 hidden md:table-cell">Date</th>
                  <th className="text-left font-semibold text-text-grey text-[11px] uppercase tracking-wide px-4 py-2.5 hidden lg:table-cell">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const isCredit = t.type === 'credit' || Number(t.montant) > 0
                  const cat = categorieTransaction(t.description)
                  return (
                    <tr key={t.id || i} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F1F3F6' : undefined }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cat.color + '18' }}>
                            <span style={{ color: cat.color }}>{isCredit ? <IcTrendUp /> : <IcTrendDown />}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-text-dark text-sm truncate">{t.description || (isCredit ? 'Crédit' : 'Débit')}</p>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: cat.color + '15', color: cat.color }}>{cat.label}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="font-mono text-xs text-text-grey">{t.reference || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-sm" style={{ color: isCredit ? '#22C55E' : '#EF4444' }}>
                          {isCredit ? '+' : '-'}{Math.abs(Number(t.montant)).toLocaleString('fr-FR')} F
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-text-grey">{new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#22C55E18', color: '#22C55E' }}>Complété</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

// ─── Tab: Profil ──────────────────────────────────────────────────────────────
// ─── Tab: Gérer mes rôles ───────────────────────────────────────────────────────
// Icônes rendues en CSS mask (data-URI SVG) plutôt qu'en <svg stroke> inline :
// la couleur vient alors de `background` sur le conteneur (currentColor via
// `color`), ce qui permet le dégradé plein-couleur des puces de rôle actif.
function svgMaskUrl(inner: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>${inner}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}
const ROLE_ICON_PATHS: Record<string, string> = {
  prospect:     '<path d="M21 21l-5.2-5.2m2.2-5.3a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"/>',
  proprietaire: '<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>',
  demarcheur:   '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18"/>',
  locataire:    '<path d="M15 7a4 4 0 11-8.6 2.4L2 14v3h3v-2h2v-2h2l1.6-1.6A4 4 0 0115 7z"/><circle cx="15.5" cy="6.5" r=".6" fill="white"/>',
}
function MaskIcon({ role, size = 22 }: { role: string; size?: number }) {
  const url = svgMaskUrl(ROLE_ICON_PATHS[role] || ROLE_ICON_PATHS.prospect)
  return (
    <span aria-hidden="true" style={{
      display: 'inline-block', width: size, height: size, background: 'currentColor', flexShrink: 0,
      WebkitMaskImage: url, maskImage: url,
      WebkitMaskSize: 'contain', maskSize: 'contain',
      WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center', maskPosition: 'center',
    }} />
  )
}

const ROLES_META: { key: string; label: string; desc: string; color: string }[] = [
  { key: 'prospect',     label: 'Prospect',     desc: 'Chercher à louer ou acheter un bien',            color: '#4B6BFF' },
  { key: 'proprietaire', label: 'Propriétaire', desc: 'Publier et gérer vos biens immobiliers',          color: BLUE },
  { key: 'demarcheur',   label: 'Agent',        desc: 'Mandataire immobilier — gérer des biens clients', color: '#9B59B6' },
  { key: 'locataire',    label: 'Locataire',    desc: 'Accéder à votre logement et payer vos loyers',    color: '#22C55E' },
]

function RolesTab() {
  const { user, rolesActifs, updateUser, activeRole, setActiveRole } = useAuth()
  const navigate = useNavigate()
  const [loadingRole, setLoadingRole] = useState<string | null>(null)
  const [justif, setJustif] = useState('')
  const [activating, setActivating] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const rolePrincipal = user?.role_principal || user?.role || ''
  const actifs = rolesActifs

  const goToRoleSpace = (role: string) => {
    setActiveRole(role)
    navigate(ROLE_ROUTES[role] || '/')
  }

  const activerRole = async (role: string) => {
    setLoadingRole(role); setError('')
    try {
      await rolesApi.activer(role)
      updateUser({ roles_actifs: [...actifs, role] })
      setActivating(null); setJustif('')
      setSuccess(`Rôle « ${ROLES_META.find(r => r.key === role)?.label} » activé avec succès.`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e?.response?.data?.message || "Impossible d'activer ce rôle.")
    }
    setLoadingRole(null)
  }

  const desactiverRole = async (role: string) => {
    if (!confirm(`Désactiver le rôle « ${ROLES_META.find(r => r.key === role)?.label} » ?`)) return
    setLoadingRole(role); setError('')
    try {
      await rolesApi.desactiver(role)
      updateUser({ roles_actifs: actifs.filter(r => r !== role) })
      // On ne peut pas rester dans un espace dont le rôle vient d'être désactivé.
      if (role === activeRole) {
        setActiveRole(rolePrincipal)
        if (ROLE_ROUTES[rolePrincipal] && ROLE_ROUTES[rolePrincipal] !== '/proprietaire') navigate(ROLE_ROUTES[rolePrincipal])
      }
      setSuccess('Rôle désactivé.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Impossible de désactiver ce rôle.')
    }
    setLoadingRole(null)
  }

  // Espace courant d'abord, puis rôle principal, puis rôles actifs secondaires,
  // puis rôles disponibles à activer.
  const ordered = [...ROLES_META].sort((a, b) => {
    const rank = (r: typeof ROLES_META[0]) => r.key === activeRole ? 0 : r.key === rolePrincipal ? 1 : actifs.includes(r.key) ? 2 : 3
    return rank(a) - rank(b)
  })

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-8" style={{ background: 'linear-gradient(180deg, #F8FAFC 0%, #F4F6FA 260px)' }}>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white"
            style={{ background: `linear-gradient(135deg, ${DARK_BLUE}, ${BLUE})`, boxShadow: `0 6px 16px ${BLUE}40` }}>
            <MaskIcon role="proprietaire" size={22} />
          </div>
          <div>
            <p className="text-xl font-extrabold text-text-dark tracking-tight">Mes espaces &amp; rôles</p>
            <p className="text-sm text-text-grey mt-0.5">Basculez entre vos espaces ou activez-en un nouveau.</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 card-soft rounded-2xl px-4 py-2.5 flex-shrink-0">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-6 h-1.5 rounded-full" style={{ background: i < actifs.length ? BLUE : '#E8EAED' }} />
            ))}
          </div>
          <span className="text-xs font-bold text-text-dark whitespace-nowrap">{actifs.length}/3 actifs</span>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl mb-4 flex items-center gap-2" style={{ background: '#EF444414', border: '1px solid #EF444430' }}>
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          <p className="text-danger text-sm font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-xl flex items-center gap-2 mb-4" style={{ background: '#22C55E14', border: '1px solid #22C55E30' }}>
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {ordered.map(r => {
          const isActiveNow = r.key === activeRole
          const isPrincipal = r.key === rolePrincipal
          const isActif = actifs.includes(r.key)
          const isDisponible = !isActif
          const busy = loadingRole === r.key
          const statusLabel = isActiveNow ? 'Espace actuel' : isPrincipal ? 'Rôle principal' : isActif ? 'Actif' : null

          return (
            <div key={r.key}
              className="relative rounded-[28px] overflow-hidden bg-white transition-all duration-200 hover:-translate-y-1 flex flex-col"
              style={{
                border: isActiveNow ? `1.5px solid ${r.color}55` : '1px solid rgba(15,23,42,0.06)',
                boxShadow: isActiveNow ? `0 16px 32px -8px ${r.color}45` : '0 2px 8px rgba(15,23,42,0.04)',
                background: isActiveNow ? `linear-gradient(165deg, ${r.color}0F, #fff 45%)` : '#fff',
              }}>
              {isActiveNow && (
                <div className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: r.color, boxShadow: `0 3px 8px ${r.color}60` }}>
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
              )}

              <div className="p-5 pb-4 flex-1">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: isDisponible ? '#F1F3F6' : `linear-gradient(135deg, ${r.color}, ${shade(r.color, 0.32)})`,
                    color: isDisponible ? '#B0B8C4' : '#fff',
                    boxShadow: isDisponible ? undefined : `0 8px 18px -4px ${r.color}70`,
                  }}>
                  <MaskIcon role={r.key} size={24} />
                </div>

                <p className="font-extrabold text-text-dark text-[15px] mb-1.5">{r.label}</p>
                {statusLabel && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2"
                    style={{ background: isActiveNow ? r.color : r.color + '15', color: isActiveNow ? '#fff' : r.color }}>
                    {statusLabel}
                  </span>
                )}
                <p className="text-xs text-text-grey leading-relaxed">{r.desc}</p>
              </div>

              <div className="px-5 pb-5 space-y-2">
                {isDisponible ? (
                  <button onClick={() => setActivating(activating === r.key ? null : r.key)} disabled={actifs.length >= 3}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-bold disabled:opacity-40 transition-transform active:scale-[0.98]"
                    style={{ background: `linear-gradient(135deg, ${r.color}, ${shade(r.color, 0.2)})`, boxShadow: `0 6px 14px -4px ${r.color}70` }}>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Activer ce rôle
                  </button>
                ) : (
                  <>
                    {!isActiveNow && (
                      <button onClick={() => goToRoleSpace(r.key)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-colors hover:opacity-80"
                        style={{ background: r.color + '15', color: r.color }}>
                        Accéder à cet espace
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    )}
                    {!isPrincipal && (
                      <button onClick={() => desactiverRole(r.key)} disabled={busy}
                        className="w-full py-2 rounded-xl text-[11px] font-bold border disabled:opacity-50 transition-colors hover:bg-red-50"
                        style={{ borderColor: 'rgba(239,68,68,0.25)', color: '#EF4444', background: 'transparent' }}>
                        {busy ? '…' : 'Désactiver'}
                      </button>
                    )}
                  </>
                )}
              </div>

              {activating === r.key && (
                <div className="mx-5 mb-5 px-4 pt-3 pb-4 rounded-2xl space-y-3" style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <p className="text-xs font-bold text-text-dark">Justification (optionnelle)</p>
                  <textarea value={justif} onChange={e => setJustif(e.target.value)} rows={2}
                    placeholder="Ex: Je souhaite aussi proposer des biens à la vente"
                    className="w-full border border-divider rounded-xl px-3 py-2.5 text-xs outline-none resize-none focus:border-primary bg-white" />
                  <div className="flex gap-2">
                    <button onClick={() => setActivating(null)} className="flex-1 py-2 rounded-xl border border-divider text-xs font-semibold text-text-grey bg-white">Annuler</button>
                    <button onClick={() => activerRole(r.key)} disabled={busy}
                      className="flex-1 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-60"
                      style={{ background: r.color }}>
                      {busy ? 'Activation…' : 'Confirmer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProfilTab({ user, biens, visites, onOpenDelegations, onOpenTransactions, onOpenRoles }: { user: any; biens: any[]; visites: any[]; onOpenDelegations: () => void; onOpenTransactions: () => void; onOpenRoles: () => void }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()
  const score = user?.score_credibilite ?? 100

  const approuves = biens.filter(b => b.statut_moderation === 'approuve').length
  const tauxPublication = biens.length > 0 ? Math.round((approuves / biens.length) * 100) : 0
  const biensOccupes = biens.filter(b => b.statut === 'occupe').length
  const tauxOccupation = biens.length > 0 ? Math.round((biensOccupes / biens.length) * 100) : 0
  const typesUniques = Array.from(new Set(biens.map(b => typeLabel(b.type))))

  const visitesConfirmees = visites.filter(v => v.statut === 'confirmee').length
  const visitesEnAttente = visites.filter(v => v.statut === 'en_attente').length
  const visitesEffectuees = visites.filter(v => v.statut === 'effectuee').length

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="flex-1 overflow-y-auto pb-10">
      <div className="px-4 md:px-8 xl:px-10 py-5 md:py-8 xl:max-w-5xl xl:mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5 items-start">

          {/* ── Colonne gauche : carte profil + menu ── */}
          <div className="space-y-5">
            <div className="card-soft rounded-2xl overflow-hidden">
              <div className="h-16" style={{ background: `linear-gradient(135deg, ${DARK_BLUE}, ${BLUE})` }} />
              <div className="px-5 pb-5">
                <div className="-mt-10 mb-3">
                  {user?.photo_profil
                    ? <img src={user.photo_profil} alt="" className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md" />
                    : <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md" style={{ background: `linear-gradient(135deg, ${DARK_BLUE}, ${BLUE})` }}>{initials}</div>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-text-dark text-lg truncate">{user?.prenom} {user?.nom}</p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0" style={{ background: BLUE + '15', color: BLUE }}>Propriétaire</span>
                </div>
                <p className="text-sm text-text-grey mt-0.5 truncate">{user?.email || user?.telephone}</p>
                {typesUniques.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3.5">
                    {typesUniques.map(t => (
                      <span key={t} className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: '#F1F3F6', color: '#5F6B7A' }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <button onClick={() => setEditOpen(true)} className="w-full card-soft rounded-xl px-4 py-3.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-text-dark">Modifier le profil</span>
                <IcChevron />
              </button>
              <button onClick={() => setPasswordOpen(true)} className="w-full card-soft rounded-xl px-4 py-3.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-text-dark">Changer le mot de passe</span>
                <IcChevron />
              </button>
              <button onClick={onOpenDelegations} className="w-full card-soft rounded-xl px-4 py-3.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-text-dark">Délégations de gestion</span>
                <IcChevron />
              </button>
              <button onClick={onOpenRoles} className="w-full card-soft rounded-xl px-4 py-3.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-text-dark">Gérer mes rôles</span>
                <IcChevron />
              </button>
              <button onClick={onOpenTransactions} className="w-full card-soft rounded-xl px-4 py-3.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-text-dark">Historique des transactions</span>
                <IcChevron />
              </button>
              <button onClick={() => { logout(); navigate('/login') }} className="w-full mt-2 py-3.5 rounded-xl text-danger font-bold text-sm border border-danger/20 bg-danger/5">
                Se déconnecter
              </button>
            </div>
          </div>

          {/* ── Colonne droite : indicateurs ── */}
          <div className="space-y-5">
            <div className="flex gap-3">
              <PercentCard value={score} label="Score de crédibilité" color={BLUE} />
              <PercentCard value={tauxOccupation} label="Taux d'occupation" color="#22C55E" />
              <PercentCard value={tauxPublication} label="Biens publiés" color="#F59E0B" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card-soft rounded-2xl p-5 flex flex-col items-center text-center">
                <p className="font-bold text-text-dark text-sm self-start">Score de crédibilité</p>
                <p className="text-xs text-text-grey self-start mb-4">Sur 100 points</p>
                <RadialGauge value={score} color={BLUE} />
              </div>
              <div className="card-soft rounded-2xl p-5">
                <p className="font-bold text-text-dark text-sm">Vue d'ensemble</p>
                <p className="text-xs text-text-grey mb-1">Points clés de votre profil</p>
                <HighlightRow icon={<IcHome />} color={BLUE}
                  title={`${approuves} bien${approuves > 1 ? 's' : ''} publié${approuves > 1 ? 's' : ''}`}
                  subtitle={`Sur ${biens.length} au total`} />
                <HighlightRow icon={<IcStar />} color="#F59E0B"
                  title={`${user?.nb_etoiles ?? 0} étoile${(user?.nb_etoiles ?? 0) > 1 ? 's' : ''}`}
                  subtitle="Note moyenne reçue des clients" />
                <HighlightRow icon={<IcCal />} color="#7B2FBE" title="Membre REFUGE"
                  subtitle={memberSince ? `Depuis ${memberSince}` : 'Bienvenue !'} last />
              </div>
            </div>

            <div className="card-soft rounded-2xl p-5">
              <p className="font-bold text-text-dark text-sm mb-4">Mes visites</p>
              <div className="flex">
                <ActivityStat label="Toutes" value={visites.length} color={BLUE} />
                <ActivityStat label="Confirmées" value={visitesConfirmees} color="#22C55E" />
                <ActivityStat label="En attente" value={visitesEnAttente} color="#F59E0B" />
                <ActivityStat label="Effectuées" value={visitesEffectuees} color="#7B2FBE" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ProprietaireDashboard() {
  const { user: authUser, logout, rolesActifs, activeRole, setActiveRole } = useAuth()
  const navigate = useNavigate()
  const [rolesMenuOpen, setRolesMenuOpen] = useState<'sidebar' | 'topbar' | null>(null)
  // Le trigger et le panneau du menu ne se touchent pas (marge de quelques px
  // entre les deux) : sans délai, quitter le trigger pour aller vers le
  // panneau traverse un instant une zone hors des deux éléments et ferme le
  // menu avant même de l'atteindre. On referme donc après un court délai,
  // annulé si le pointeur ré-entre sur le trigger OU le panneau entre-temps.
  const rolesMenuCloseTimer = useRef<number | null>(null)
  const openRolesMenu = (which: 'sidebar' | 'topbar') => {
    if (rolesMenuCloseTimer.current != null) { clearTimeout(rolesMenuCloseTimer.current); rolesMenuCloseTimer.current = null }
    setRolesMenuOpen(which)
  }
  const scheduleCloseRolesMenu = () => {
    if (rolesMenuCloseTimer.current != null) clearTimeout(rolesMenuCloseTimer.current)
    rolesMenuCloseTimer.current = window.setTimeout(() => setRolesMenuOpen(null), 250)
  }
  useEffect(() => () => { if (rolesMenuCloseTimer.current != null) clearTimeout(rolesMenuCloseTimer.current) }, [])
  // Le flyout sidebar utilise position:fixed avec des coordonnées calculées
  // au survol — la <nav> du menu est overflow-y-auto, ce qui rend son
  // overflow-x implicitement non "visible" (spec CSS) et couperait un
  // absolute positionné "left-full" en dehors de sa boîte.
  const [sidebarMenuPos, setSidebarMenuPos] = useState<{ top: number; left: number } | null>(null)
  const sidebarRolesRef = useRef<HTMLDivElement>(null)
  const openSidebarRolesMenu = () => {
    const rect = sidebarRolesRef.current?.getBoundingClientRect()
    if (rect) setSidebarMenuPos({ top: rect.top, left: rect.right + 8 })
    openRolesMenu('sidebar')
  }
  const goToRoleSpace = (role: string) => {
    setActiveRole(role)
    navigate(ROLE_ROUTES[role] || '/')
  }
  const [tab, setTab] = useState<Tab>('tableau')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [biens, setBiens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loyersDash, setLoyersDash] = useState<any>(null)
  const [visites, setVisites] = useState<any[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [chartPeriod, setChartPeriod] = useState<3 | 6 | 12>(6)

  const loadData = async (silent = false) => {
    if (silent) setRefreshing(true)
    try {
      const [u, b, l, v] = await Promise.allSettled([
        userApi.me(), biensApi.mesBiens(), loyersApi.dashboard(), visitesApi.reservationsRecues(),
      ])
      if (u.status === 'fulfilled') setUser(u.value?.user || u.value)
      if (b.status === 'fulfilled') setBiens(Array.isArray(b.value) ? b.value : b.value.data || [])
      if (l.status === 'fulfilled') setLoyersDash(l.value)
      if (v.status === 'fulfilled') setVisites(Array.isArray(v.value) ? v.value : v.value.data || [])
      setLastUpdated(new Date())
    } catch (_) {}
    setLoading(false)
    setRefreshing(false)
  }

  // Tableau de bord "temps réel" : première charge immédiate, puis on
  // rafraîchit silencieusement toutes les 30s (et quand l'onglet redevient
  // visible) tant qu'on reste sur l'onglet Tableau — pas de spinner plein
  // écran pour ces rafraîchissements, juste l'horodatage qui bouge.
  useEffect(() => { loadData() }, [])
  useEffect(() => {
    if (tab !== 'tableau') return
    const id = setInterval(() => loadData(true), 30000)
    const onVisible = () => { if (document.visibilityState === 'visible') loadData(true) }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible) }
  }, [tab])

  const me = user || authUser
  const initials = `${me?.prenom?.[0] || ''}${me?.nom?.[0] || ''}`.toUpperCase()
  const score = me?.score_credibilite ?? 100
  const approuves = biens.filter(b => b.statut_moderation === 'approuve').length
  const enAttente = biens.filter(b => b.statut_moderation === 'en_attente').length
  const rejetes   = biens.filter(b => b.statut_moderation === 'rejete').length
  const reservationsEnAttente = visites.filter(v => v.statut === 'en_attente').length

  const biensParType = (() => {
    const counts: Record<string, number> = {}
    for (const b of biens) counts[b.type] = (counts[b.type] || 0) + 1
    return Object.entries(counts)
      .map(([type, n]) => ({ label: typeLabel(type), value: n }))
      .sort((a, b) => b.value - a.value)
  })()

  // Séries "carte KPI" — toujours 6 mois, indépendantes du sélecteur de
  // période du graphique (qui ne doit affecter que le grand graphique).
  const revenusSeries6 = buildRevenueSeries(loyersDash?.contrats || [])
  const revenusMoisActuel = revenusSeries6[revenusSeries6.length - 1]?.value ?? 0
  const revenusMoisPrecedent = revenusSeries6[revenusSeries6.length - 2]?.value ?? 0
  const revenusTrendPct = revenusMoisPrecedent > 0
    ? Math.round(((revenusMoisActuel - revenusMoisPrecedent) / revenusMoisPrecedent) * 100)
    : (revenusMoisActuel > 0 ? 100 : 0)
  const hasRevenus = revenusSeries6.some(m => m.value > 0)

  const visitesSeries6 = buildCountSeries(visites, v => v.date_souhaitee)
  const visitesMoisActuel = visitesSeries6[visitesSeries6.length - 1]?.value ?? 0
  const visitesMoisPrecedent = visitesSeries6[visitesSeries6.length - 2]?.value ?? 0
  const visitesTrendPct = visitesMoisPrecedent > 0
    ? Math.round(((visitesMoisActuel - visitesMoisPrecedent) / visitesMoisPrecedent) * 100)
    : (visitesMoisActuel > 0 ? 100 : 0)

  // Séries des grands graphiques — respectent le sélecteur 3M/6M/12M
  // (comme le 7D/30D/90D du template).
  const revenusSeries = buildRevenueSeries(loyersDash?.contrats || [], chartPeriod)
  const visitesSeries = buildCountSeries(visites, v => v.date_souhaitee, chartPeriod)
  const hasVisites = visitesSeries6.some(m => m.value > 0)

  const biensOccupes = biens.filter(b => b.statut === 'occupe').length
  const tauxOccupation = biens.length > 0 ? Math.round((biensOccupes / biens.length) * 100) : 0

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div className="flex flex-col h-full bg-[#F4F6FA] relative">

      {/* Header — topbar façon admin, pleine largeur (au-dessus de la sidebar) */}
      <div className="flex-shrink-0 px-4 md:px-8 xl:px-10 h-16 bg-white border-b border-divider">
        <div className="h-full flex items-center gap-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={logoUrl} alt="REFUGE" className="w-9 h-9 rounded-[10px] object-contain flex-shrink-0" />
            <span className="hidden sm:block font-extrabold text-base tracking-tight flex-shrink-0" style={{ color: '#00AEEF' }}>REFUGE</span>
            <button onClick={() => setSidebarCollapsed(c => !c)}
              title={sidebarCollapsed ? 'Agrandir le menu' : 'Réduire le menu'}
              className="hidden xl:flex w-8 h-8 rounded-lg border items-center justify-center flex-shrink-0 transition-colors hover:bg-surface-g"
              style={{ borderColor: '#E8EAED', background: '#F8FAFC', color: '#5F6B7A' }}>
              {sidebarCollapsed ? <IcChevronRight /> : <IcChevronLeft />}
            </button>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center gap-2.5"
              onMouseEnter={() => openRolesMenu('topbar')}
              onMouseLeave={scheduleCloseRolesMenu}>
              <button onClick={() => setTab('profil')} title="Mon profil"
                className="flex items-center gap-2.5 rounded-[10px] transition-colors hover:bg-surface-g px-1.5 py-1 -mx-1.5 -my-1">
                <div className="text-right hidden sm:block">
                  <p className="font-bold text-text-dark text-[13px] leading-tight truncate max-w-[160px]">
                    {loading ? '…' : `${me?.prenom || ''} ${me?.nom || ''}`.trim()}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#8A93A3' }}>Propriétaire</p>
                </div>
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 text-white font-bold text-xs" style={{ background: BLUE }}>
                  {loading ? <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : initials}
                </div>
              </button>
              {rolesMenuOpen === 'topbar' && rolesActifs.length > 1 && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white shadow-lg border border-divider py-1.5 z-30"
                  onMouseEnter={() => openRolesMenu('topbar')}
                  onMouseLeave={scheduleCloseRolesMenu}>
                  <p className="px-3.5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wide text-text-grey">Mes espaces actifs</p>
                  {rolesActifs.map(r => (
                    <button key={r} onClick={() => goToRoleSpace(r)}
                      className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm text-left hover:bg-surface-g transition-colors">
                      <span style={{ color: r === activeRole ? BLUE : '#374151', fontWeight: r === activeRole ? 700 : 500 }}>{ROLE_LABELS[r] || r}</span>
                      {r === activeRole && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: BLUE + '15', color: BLUE }}>Actuel</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setTab('messages')} title="Messagerie"
              className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 border transition-colors hover:bg-surface-g"
              style={{ borderColor: '#E8EAED', background: '#F8FAFC', color: BLUE }}>
              <IcMessage />
            </button>
            <button onClick={() => { logout(); navigate('/login') }} title="Déconnexion"
              className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 border transition-colors hover:bg-surface-g"
              style={{ borderColor: '#E8EAED', background: '#F8FAFC', color: '#EF4444' }}>
              <IcLogout />
            </button>
          </div>
        </div>
      </div>

      {/* Shell — sidebar + contenu, sous le topbar pleine largeur */}
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">

      {/* Sidebar (desktop only) — liste plate façon immo-web-admin : fond blanc,
          items icône+libellé, item actif en fond teinté + barre d'accent à gauche. */}
      <aside className={`hidden xl:flex xl:flex-col flex-shrink-0 bg-white border-r border-divider transition-[width] duration-200 ${sidebarCollapsed ? 'xl:w-[4.5rem]' : 'xl:w-64 2xl:w-72'}`}>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {SIDEBAR_NAV.map(item => {
            const active = item.tab != null && tab === item.tab
            const badge = item.key === 'reservations' ? reservationsEnAttente : 0
            const button = (
              <button onClick={() => item.tab ? setTab(item.tab) : navigate(item.to!)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 py-2.5 rounded-lg text-sm transition-colors relative ${sidebarCollapsed ? 'justify-center px-0' : 'px-3.5'}`}
                style={active ? { background: BLUE + '15', color: BLUE, fontWeight: 600 } : { color: '#5F6B7A', fontWeight: 500 }}>
                {active && !sidebarCollapsed && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full" style={{ background: BLUE }} />}
                <span className="relative flex-shrink-0" style={{ color: active ? BLUE : '#8A93A3' }}>
                  {item.icon}
                  {sidebarCollapsed && badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: BLUE }} />
                  )}
                </span>
                {!sidebarCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                {!sidebarCollapsed && badge > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: BLUE, color: '#fff' }}>
                    {badge}
                  </span>
                )}
              </button>
            )

            // "Gérer mes rôles" : survol → menu déroulant des espaces déjà
            // actifs, clic sur un espace = bascule directe (comme dans
            // ManageRolesPage.goToDashboard).
            if (item.key === 'mes-roles' && rolesActifs.length > 1) {
              return (
                <div key={item.key} ref={sidebarRolesRef} className="relative"
                  onMouseEnter={openSidebarRolesMenu}
                  onMouseLeave={scheduleCloseRolesMenu}>
                  {button}
                </div>
              )
            }
            return <div key={item.key}>{button}</div>
          })}
          {rolesMenuOpen === 'sidebar' && sidebarMenuPos && (
            <div className="fixed w-56 rounded-xl bg-white shadow-lg border border-divider py-1.5 z-30"
              style={{ top: sidebarMenuPos.top, left: sidebarMenuPos.left }}
              onMouseEnter={() => openRolesMenu('sidebar')}
              onMouseLeave={scheduleCloseRolesMenu}>
              <p className="px-3.5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wide text-text-grey">Mes espaces actifs</p>
              {rolesActifs.map(r => (
                <button key={r} onClick={() => goToRoleSpace(r)}
                  className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm text-left hover:bg-surface-g transition-colors">
                  <span style={{ color: r === activeRole ? BLUE : '#374151', fontWeight: r === activeRole ? 700 : 500 }}>{ROLE_LABELS[r] || r}</span>
                  {r === activeRole && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: BLUE + '15', color: BLUE }}>Actuel</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </nav>
        {!sidebarCollapsed && (
          <div className="px-3 pb-4 pt-3 border-t border-divider">
            <button onClick={() => navigate('/nouveau-bien')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-transform active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${BLUE}, ${shade(BLUE, 0.25)})`, boxShadow: `0 6px 16px -3px ${BLUE}70` }}>
              <IcPlus /> Nouveau bien
            </button>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col md:max-w-5xl md:mx-auto md:w-full xl:max-w-none xl:mx-0">
        {tab === 'tableau' && (
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 md:px-8 xl:px-10 py-5 md:py-8">
              {/* Profil — petites cartes distinctes (remplace les pastilles du bandeau) */}
              <div className="flex gap-3 mb-6">
                <MiniStatCard icon={<IcHome />} value={`${biens.length}`} label="Biens" color={BLUE} />
                <MiniStatCard icon={<IcStar />} value={`${me?.nb_etoiles ?? 0}`} label="Étoiles" color="#F59E0B" />
                <MiniStatCard icon={<IcShield />} value={`${score}`} label="Score" color="#22C55E" />
              </div>

              <div className="flex items-center justify-between mb-3.5">
                <p className="text-[17px] md:text-lg font-bold text-text-dark">Actions rapides</p>
                <LiveIndicator label={lastUpdatedLabel} refreshing={refreshing} />
              </div>
              <div className="flex gap-3 mb-7 md:max-w-md">
                <QuickAction icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>} color={BLUE} label="Nouveau bien" onClick={() => navigate('/nouveau-bien')} />
                <QuickAction icon={<IcCal />} color="#4B6BFF" label="Réservations" onClick={() => setTab('reservations')} />
                <QuickAction icon={<IcMessagesNav />} color="#FF6B35" label="Messages" onClick={() => setTab('messages')} />
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <StatCard icon={<IcWallet />} color={BLUE} label="Revenus ce mois" value={fmtPrix(revenusMoisActuel)} trendPct={hasRevenus ? revenusTrendPct : undefined} trendCaption={hasRevenus ? 'vs mois dernier' : undefined} sparkline={hasRevenus ? revenusSeries6 : undefined} />
                <StatCard icon={<IcCal />} color="#7B2FBE" label="Visites ce mois" value={`${visitesMoisActuel}`} trendPct={hasVisites ? visitesTrendPct : undefined} trendCaption={hasVisites ? 'vs mois dernier' : undefined} sparkline={hasVisites ? visitesSeries6 : undefined} />
                <StatCard icon={<IcHome />} color="#22C55E" label="Taux d'occupation" value={`${tauxOccupation}%`} trendCaption={`${biensOccupes}/${biens.length} biens occupés`} />
              </div>

              {/* Charts — mise en page bento : le graphique principal prend le double de place */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
                <ChartCard title="Revenus locatifs" subtitle={`${chartPeriod} derniers mois`} icon={<IcWallet />} color={BLUE} className="xl:col-span-2"
                  headerRight={<PeriodToggle value={chartPeriod} onChange={setChartPeriod} color={BLUE} />}>
                  <div className="flex items-center gap-6 mb-5 pb-5" style={{ borderBottom: '1px solid #F1F3F6' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: BLUE + '15' }}>
                        <span style={{ color: BLUE }}><IcWallet /></span>
                      </div>
                      <div>
                        <p className="text-[11px] text-text-grey">Revenus ce mois</p>
                        <p className="font-bold text-text-dark text-sm">{fmtPrix(revenusMoisActuel)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#7B2FBE15' }}>
                        <span style={{ color: '#7B2FBE' }}><IcCal /></span>
                      </div>
                      <div>
                        <p className="text-[11px] text-text-grey">Visites ce mois</p>
                        <p className="font-bold text-text-dark text-sm">{visitesMoisActuel}</p>
                      </div>
                    </div>
                  </div>
                  {hasRevenus ? <AreaChart data={revenusSeries} color={BLUE} /> : <EmptyChartState label="Aucun loyer encaissé pour l'instant" />}
                </ChartCard>
                <ChartCard title="Répartition de mes biens" subtitle="Par statut de modération" icon={<IcDash />} color="#7B2FBE">
                  {biens.length > 0
                    ? <DonutChart segments={[
                        { label: 'Publiés',    value: approuves, color: '#22C55E' },
                        { label: 'En attente', value: enAttente, color: '#F59E0B' },
                        { label: 'Rejetés',    value: rejetes,   color: '#EF4444' },
                      ]} />
                    : <EmptyChartState label="Publiez votre premier bien pour voir vos statistiques" />}
                </ChartCard>
                <ChartCard title="Visites reçues" subtitle={`${chartPeriod} derniers mois`} icon={<IcCal />} color="#4B6BFF" className={biensParType.length > 0 ? 'xl:col-span-2' : 'xl:col-span-3'}>
                  {hasVisites
                    ? visitesSeries.map((v, i) => <BarRow key={i} label={v.label} value={v.value} max={Math.max(...visitesSeries.map(x => x.value), 1)} color="#4B6BFF" />)
                    : <EmptyChartState label="Aucune visite reçue pour l'instant" />}
                </ChartCard>
                {biensParType.length > 0 && (
                  <ChartCard title="Biens par type" subtitle="Répartition par catégorie" icon={<IcHome />} color="#FF6B35">
                    {biensParType.map((b, i) => (
                      <BarRow key={b.label} label={b.label} value={b.value} max={biensParType[0].value}
                        color={[BLUE, '#7B2FBE', '#FF6B35', '#22C55E', '#E67E22'][i % 5]} />
                    ))}
                  </ChartCard>
                )}
                <ChartCard title="Mes biens récents" subtitle="Dernières publications" icon={<IcHome />} color={BLUE} className={biensParType.length > 0 ? 'xl:col-span-3' : 'xl:col-span-1'}
                  headerRight={<button onClick={() => setTab('biens')} className="text-xs font-semibold flex-shrink-0" style={{ color: BLUE }}>Voir tout</button>}>
                  {biens.length === 0 ? <EmptyChartState label="Aucun bien publié pour l'instant" /> : (
                    <div>
                      {biens.slice(0, 3).map((b, i) => {
                        const { label, color } = statutBien(b.statut_moderation || 'en_attente')
                        const loc = b.localisation
                        const adresse = loc ? `${loc.quartier ? loc.quartier + ', ' : ''}${loc.ville || ''}` : '—'
                        return (
                          <HighlightRow key={b.id} icon={<IcHome />} color={color} title={`${typeLabel(b.type)} — ${fmtPrix(b.prix)}`}
                            subtitle={`${adresse} · ${label}`}
                            last={i === Math.min(biens.length, 3) - 1} />
                        )
                      })}
                    </div>
                  )}
                </ChartCard>
              </div>

              <div className="h-24" />
            </div>
          </div>
        )}
        {tab === 'biens'        && <MesBiensTab />}
        {tab === 'reservations' && <ReservationsTab biens={biens} />}
        {tab === 'messages'     && <MessagesTab />}
        {tab === 'loyers'       && <LoyersTab />}
        {tab === 'portefeuille' && <PortefeuilleTab onOpenTransactions={() => setTab('transactions')} />}
        {tab === 'transactions' && <TransactionsTab />}
        {tab === 'roles'        && <RolesTab />}
        {tab === 'delegations'  && <DelegationsTab onBack={() => setTab('profil')} />}
        {tab === 'profil'       && <ProfilTab user={me} biens={biens} visites={visites} onOpenDelegations={() => setTab('delegations')} onOpenTransactions={() => setTab('transactions')} onOpenRoles={() => setTab('roles')} />}
      </div>

      {/* Footer — desktop uniquement (façon immo-web-admin), sous le contenu,
          largeur de la colonne (pas sous la sidebar) */}
      <div className="hidden xl:flex items-center flex-shrink-0 px-6 border-t border-divider bg-white text-xs"
        style={{ height: '2.75rem', color: '#64748B' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: '#22C55E' }} />
          <span>Plateforme <strong style={{ color: '#00AEEF' }}>REFUGE</strong> — opérationnelle</span>
        </div>
        <div className="ml-auto flex items-center gap-5">
          <span>{new Date().toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          {me && <span className="text-text-dark font-semibold">{me.prenom} {me.nom}</span>}
          <span className="font-bold uppercase tracking-wide px-2 py-0.5 rounded" style={{ background: BLUE + '18', color: BLUE, fontSize: '10px' }}>
            Propriétaire
          </span>
        </div>
      </div>

      {/* FAB */}
      {(tab === 'tableau' || tab === 'biens') && (
        <div className="xl:hidden absolute bottom-20 right-4 md:bottom-24 md:right-8 z-20">
          <button onClick={() => navigate('/nouveau-bien')}
            className="flex items-center gap-2 px-5 py-3.5 rounded-full text-white font-bold shadow-lg active:scale-95 md:hover:-translate-y-0.5 transition-transform"
            style={{ background: BLUE, boxShadow: `0 4px 15px ${BLUE}60` }}>
            <IcPlus /> Nouveau bien
          </button>
        </div>
      )}

      {/* Bottom Nav (mobile & tablet only — desktop uses the sidebar) */}
      <div className="xl:hidden flex-shrink-0 md:px-6 md:pb-4">
        <div className="bg-white border-t border-divider md:border md:rounded-2xl" style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-around px-2 py-2 md:max-w-lg md:mx-auto">
            {TABS.map(t => {
              const active = tab === t.key
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className="flex items-center gap-1.5 px-2 py-2 rounded-[14px] transition-all"
                  style={active ? { background: BLUE + '18' } : {}}>
                  <span style={{ color: active ? BLUE : '#9E9E9E' }}>{t.icon}</span>
                  {active && <span className="text-xs font-bold" style={{ color: BLUE }}>{t.label}</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
  )
}
