import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationsContext'
import { biensApi } from '../../api/biensApi'
import { visitesApi } from '../../api/visitesApi'
import { userApi } from '../../api/userApi'
import { walletApi } from '../../api/walletApi'
import { chatApi } from '../../api/chatApi'
import { loyersApi } from '../../api/loyersApi'
import { rolesApi } from '../../api/rolesApi'
import EditProfileModal from '../profile/EditProfileModal'
import ChangePasswordModal from '../profile/ChangePasswordModal'
import EditBienModal from '../bien/EditBienModal'
import ChatThread from '../conversations/ChatThread'
import logoUrl from '../../assets/REFUGE-LOGO.png'
import villaImg from '../../assets/login/villa.jpg'
import PropertyStatsCard from '../../components/PropertyStatsCard'
import { AnimatedGroup } from '../../components/ui/animated-group'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Icons ────────────────────────────────────────────────────────────────────
const IcDash    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
const IcHome    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
const IcCal     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
const IcClock   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
const IcMoney   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
const IcPayments = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinejoin="round" strokeLinecap="round" d="M21 7H7a2 2 0 00-2 2v9"/><rect x="2" y="7" width="17" height="11" rx="2"/><circle cx="10.5" cy="12.5" r="2.5"/></svg>
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

const IcMessagesNav = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>

// ─── Constants ────────────────────────────────────────────────────────────────
const BLUE      = '#4B6BFF'   // bleu principal (propriétaire)
const DARK_BLUE = '#0B1C30'   // navy

const ROLE_LABELS: Record<string, string> = { prospect: 'Prospect', proprietaire: 'Propriétaire', demarcheur: 'Agent', locataire: 'Locataire' }
const ROLE_ROUTES: Record<string, string> = { proprietaire: '/proprietaire', demarcheur: '/demarcheur', locataire: '/locataire' }

type Tab = 'tableau' | 'biens' | 'reservations' | 'messages' | 'loyers' | 'portefeuille' | 'transactions' | 'roles' | 'profil'

// Bottom nav (mobile/tablette, < xl) — jeu réduit d'onglets les plus utilisés.
const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
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

const NAV_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'tableau',      label: 'Tableau',      icon: <IcDash /> },
  { key: 'biens',        label: 'Mes biens',    icon: <IcHome /> },
  { key: 'reservations', label: 'Réservations', icon: <IcCal /> },
  { key: 'loyers',       label: 'Loyers',       icon: <IcPayments /> },
  { key: 'messages',     label: 'Messages',     icon: <IcMessagesNav /> },
  { key: 'portefeuille', label: 'Portefeuille', icon: <IcWallet /> },
  { key: 'profil',       label: 'Profil',       icon: <IcPerson /> },
]

function typeLabel(t: string) {
  const m: Record<string, string> = { maison: 'Maison', appart_vide: 'Appartement vide', appart_meuble: 'Appartement meublé', terrain: 'Terrain', guesthouse: 'Guesthouse' }
  return m[t] || t
}
const SOUS_TYPE_LABELS: Record<string, string> = {
  entree_coucher: 'Entrée-Coucher', chambre_salon: 'Chambre-Salon',
  appartement: 'Appartement', villa: 'Villa', maison_individuelle: 'Maison',
  villa_maison: 'Villa / Maison', boutique: 'Boutique / Local', terrain: 'Terrain',
}
function bienLabel(b: any): string {
  const sous = b?.amenites?.sous_type
  if (sous && SOUS_TYPE_LABELS[sous]) {
    if (sous === 'appartement' && b.type === 'appart_meuble') return 'Appartement meublé'
    return SOUS_TYPE_LABELS[sous]
  }
  return typeLabel(b?.type || '')
}
function bienComposition(b: any): string {
  const pieces: any[] = b?.pieces || []
  if (!pieces.length) return ''
  const counts: Record<string, number> = {}
  for (const p of pieces) counts[p.nom] = (counts[p.nom] || 0) + 1
  return Object.entries(counts).map(([nom, n]) => `${n} ${nom}${n > 1 ? 's' : ''}`).join(' · ')
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

function StatCard({ icon, color, label, value, trendPct, trendCaption, sparkline }: { icon: React.ReactNode; color: string; label: string; value: string; trendPct?: number; trendCaption?: string; sparkline?: { value: number }[] }) {
  const up = (trendPct ?? 0) >= 0
  return (
    <div className="rounded-2xl p-5 flex-1 min-w-0 relative overflow-hidden flex flex-col"
      style={{ background: 'var(--p-card)', borderLeft: `3px solid ${color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-[#8A9BB5] uppercase tracking-widest">{label}</p>
        {trendPct != null && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: up ? '#22C55E18' : '#EF444418', color: up ? '#22C55E' : '#EF4444' }}>
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
function LiveIndicator({ label, refreshing }: { label: string; refreshing: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex w-2 h-2">
        {!refreshing && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#22C55E' }} />}
        <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: refreshing ? '#F59E0B' : '#22C55E' }} />
      </span>
      <span className="text-[11px] text-[#8A9BB5]">{refreshing ? 'Synchronisation…' : `À jour · ${label}`}</span>
    </div>
  )
}

// ─── Tab: Mes Biens ───────────────────────────────────────────────────────────
function MesBiensTab({ onScrolled }: { onScrolled?: (v: boolean) => void }) {
  const [biens, setBiens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Tous')
  const [search, setSearch] = useState('')
  const [sortByVues, setSortByVues] = useState(false)
  const [editingBien, setEditingBien] = useState<any>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [carouselPaused, setCarouselPaused] = useState(false)
  const [carouselIdx, setCarouselIdx] = useState(0)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try { const d = await biensApi.mesBiens(); setBiens(Array.isArray(d) ? d : d.data || []) } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (carouselPaused || biens.length === 0) return
    const id = setInterval(() => {
      const el = carouselRef.current
      if (!el || carouselPaused) return
      const count = Math.min(5, biens.length)
      const cardW = el.scrollWidth / count
      const maxScroll = el.scrollWidth - el.clientWidth
      const isAtEnd = el.scrollLeft + cardW >= maxScroll - 1
      const next = isAtEnd ? 0 : el.scrollLeft + cardW
      el.scrollTo({ left: next, behavior: 'smooth' })
      setCarouselIdx(isAtEnd ? 0 : Math.round(next / cardW))
    }, 3500)
    return () => clearInterval(id)
  }, [carouselPaused, biens.length])

  const FILTERS = ['Tous', 'Location', 'Vente', 'Publié', 'En attente', 'Rejeté', 'Occupé']
  const byFilter = filter === 'Tous' ? biens
    : filter === 'Location' ? biens.filter(b => b.transaction === 'location')
    : filter === 'Vente' ? biens.filter(b => b.transaction === 'vente')
    : filter === 'Publié' ? biens.filter(b => b.statut_moderation === 'approuve')
    : filter === 'En attente' ? biens.filter(b => b.statut_moderation === 'en_attente')
    : filter === 'Occupé' ? biens.filter(b => b.statut === 'occupe')
    : biens.filter(b => b.statut_moderation === 'rejete')

  const filtered = (() => {
    const q = search.trim().toLowerCase()
    const searched = !q ? byFilter : byFilter.filter(b => {
      const loc = b.localisation
      return `${bienLabel(b)} ${loc?.quartier || ''} ${loc?.ville || ''}`.toLowerCase().includes(q)
    })
    return sortByVues ? [...searched].sort((a, b) => (b.nb_consultations || 0) - (a.nb_consultations || 0)) : searched
  })()

  const del = async (id: number) => {
    if (!confirm('Supprimer ce bien ?')) return
    try { await biensApi.delete(id); load() } catch (_) {}
  }

  const IcSearch = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  const IcEye = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><circle cx="12" cy="12" r="3"/></svg>

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: 'var(--p-deep)' }}>
      {editingBien && (
        <EditBienModal bien={editingBien} onClose={() => setEditingBien(null)}
          onSaved={updated => { setBiens(prev => prev.map(b => b.id === updated.id ? updated : b)); setEditingBien(null) }} />
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden"
        onScroll={e => onScrolled?.(e.currentTarget.scrollTop > 50)}>
        {/* ── Carousel biens récents ── */}
        {biens.length > 0 && (() => {
          const recentBiens = [...biens]
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            .slice(0, 5)
          return (
            <div className="px-5 md:px-8 xl:px-10 pt-6 pb-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--p-muted)' }}>Biens récents</p>
              <div
                ref={carouselRef}
                className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
                onMouseEnter={() => setCarouselPaused(true)}
                onMouseLeave={() => setCarouselPaused(false)}
              >
                {recentBiens.map(b => {
                  const { label: sLabel, color: sColor } = statutBien(b.statut_moderation || 'en_attente')
                  const loc = b.localisation
                  const adresse = loc ? `${loc.quartier ? loc.quartier + ', ' : ''}${loc.ville || ''}` : '—'
                  const cover = b.photos?.find((p: any) => p.is_cover) || b.photos?.[0]
                  const compo = bienComposition(b)
                  return (
                    <div
                      key={b.id}
                      className="flex-shrink-0 snap-start group rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1"
                      style={{ width: 'calc(33.333% - 14px)', background: 'var(--p-card)', border: '1px solid var(--p-border)' }}
                      onClick={() => navigate(`/proprietaire/biens/${b.id}`, { state: { fromDashboard: true } })}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(75,107,255,0.14)'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = ''}
                    >
                      <div className="relative overflow-hidden" style={{ height: 160 }}>
                        {cover?.url
                          ? <img src={cover.url} alt={bienLabel(b)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          : <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, #1a2a4a, ${BLUE}30)` }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={1.2} className="w-10 h-10 opacity-40"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                            </div>
                        }
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)' }} />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: sColor }}>{sLabel}</span>
                        <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(0,0,0,0.50)', color: '#fff' }}>
                          {b.transaction === 'location' ? 'À louer' : 'À vendre'}
                        </span>
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-white font-black text-[15px] leading-none drop-shadow">
                            {fmtPrix(b.prix)}{b.transaction === 'location' && <span className="text-[11px] font-normal text-white/70"> /mois</span>}
                          </p>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-bold text-[14px] leading-tight mb-1.5 truncate" style={{ color: 'var(--p-text)' }}>{bienLabel(b)}</p>
                        <div className="flex items-center gap-1 mb-2">
                          <span style={{ color: 'var(--p-muted)' }}><IcPin /></span>
                          <span className="text-xs truncate" style={{ color: 'var(--p-muted)' }}>{adresse}</span>
                        </div>
                        {compo && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--p-border)', color: 'var(--p-muted)' }}>{compo}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              {recentBiens.length > 3 && (
                <div className="flex justify-center gap-2 mt-4">
                  {recentBiens.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const el = carouselRef.current
                        if (!el) return
                        const cardW = el.scrollWidth / recentBiens.length
                        el.scrollTo({ left: cardW * i, behavior: 'smooth' })
                        setCarouselIdx(i)
                      }}
                      style={{ width: carouselIdx === i ? 20 : 8, height: 8, borderRadius: 4, background: carouselIdx === i ? '#4B6BFF' : 'rgba(75,107,255,0.25)', transition: 'all 0.3s ease', border: 'none', cursor: 'pointer', padding: 0 }}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        <div className="px-5 md:px-8 xl:px-10 pt-8 pb-4">

          {/* ── En-tête ── */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-1" style={{ color: 'var(--p-muted)' }}>Portefeuille</p>
              <h2 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--p-text)' }}>
                Mes biens
                <span className="ml-2 text-[15px] font-bold" style={{ color: BLUE }}>{biens.length}</span>
              </h2>
            </div>
            <div className="flex gap-2">
              <button onClick={load}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all"
                style={{ color: 'var(--p-muted)', borderColor: 'var(--p-border)', background: 'var(--p-card)' }}>
                <IcRefresh /> Actualiser
              </button>
              <button onClick={() => navigate('/nouveau-bien')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ background: `linear-gradient(135deg, ${BLUE}, #3A5AEE)`, color: '#fff', boxShadow: `0 4px 14px ${BLUE}40` }}>
                <IcPlus /> Nouveau bien
              </button>
            </div>
          </div>

          {/* ── Recherche + tri ── */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--p-muted)' }}><IcSearch /></span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un bien…"
                className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none border transition-colors"
                style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)', color: 'var(--p-text)' }}
                onFocus={e => (e.target.style.borderColor = BLUE)}
                onBlur={e => (e.target.style.borderColor = 'var(--p-border)')} />
            </div>
            <button onClick={() => setSortByVues(s => !s)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all"
              style={sortByVues
                ? { background: BLUE, color: '#fff', borderColor: BLUE, boxShadow: `0 4px 12px ${BLUE}35` }
                : { background: 'var(--p-card)', color: 'var(--p-muted)', borderColor: 'var(--p-border)' }}>
              <IcEye /> Vues
            </button>
          </div>

          {/* ── Filtres ── */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-6" style={{ scrollbarWidth: 'none' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all"
                style={filter === f
                  ? { background: BLUE, color: '#fff', borderColor: BLUE, boxShadow: `0 4px 12px ${BLUE}35` }
                  : { background: 'var(--p-card)', color: 'var(--p-muted)', borderColor: 'var(--p-border)' }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Contenu ── */}
        <div className="px-5 md:px-8 xl:px-10 pb-24">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(n => (
                <div key={n} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
                  <div className="h-48 w-full" style={{ background: 'var(--p-border)' }} />
                  <div className="p-4 space-y-3">
                    <div className="h-4 rounded-full w-2/3" style={{ background: 'var(--p-border)' }} />
                    <div className="h-3 rounded-full w-1/2" style={{ background: 'var(--p-border)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ background: BLUE + '12', border: `1.5px solid ${BLUE}25` }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={1.4} className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
              </div>
              <p className="font-bold text-lg mb-1" style={{ color: 'var(--p-text)' }}>Aucun bien trouvé</p>
              <p className="text-sm mb-6" style={{ color: 'var(--p-muted)' }}>
                {search ? 'Essayez un autre terme de recherche' : 'Publiez votre premier bien dès maintenant'}
              </p>
              <button onClick={() => navigate('/nouveau-bien')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
                style={{ background: `linear-gradient(135deg, ${BLUE}, #3A5AEE)`, color: '#fff', boxShadow: `0 4px 16px ${BLUE}40` }}>
                <IcPlus /> Ajouter un bien
              </button>
            </div>
          ) : (
            <AnimatedGroup preset="blur-slide" stagger={0.06}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(b => {
                  const { label, color } = statutBien(b.statut_moderation || 'en_attente')
                  const loc = b.localisation
                  const adresse = loc ? `${loc.quartier ? loc.quartier + ', ' : ''}${loc.ville || ''}` : '—'
                  const cover = b.photos?.find((p: any) => p.is_cover) || b.photos?.[0]
                  const nbPieces = Array.isArray(b.pieces) ? b.pieces.length : 0
                  const superficie = b.details_maison?.superficie ?? b.details_terrain?.superficie ?? null
                  const compo = bienComposition(b)
                  return (
                    <div key={b.id}
                      onClick={() => navigate(`/proprietaire/biens/${b.id}`, { state: { fromDashboard: true } })}
                      role="button" tabIndex={0}
                      className="group rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1"
                      style={{
                        background: 'var(--p-card)',
                        border: '1px solid var(--p-border)',
                        boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 8px 32px rgba(75,107,255,0.12), 0 2px 8px rgba(15,23,42,0.08)`)}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)')}>

                      {/* Photo */}
                      <div className="relative overflow-hidden" style={{ height: 192 }}>
                        {cover?.url
                          ? <img src={cover.url} alt={bienLabel(b)}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          : <div className="w-full h-full flex items-center justify-center"
                              style={{ background: `linear-gradient(135deg, #EEF1FB, ${BLUE}18)` }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={1.2} className="w-12 h-12 opacity-30"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                            </div>
                        }
                        {/* Gradient overlay */}
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }} />
                        {/* Badge statut */}
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                          style={{ background: color, boxShadow: `0 2px 8px ${color}55` }}>
                          {label}
                        </span>
                        {/* Badge transaction */}
                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold"
                          style={{ background: 'rgba(0,0,0,0.45)', color: '#fff', backdropFilter: 'blur(6px)' }}>
                          {b.transaction === 'location' ? 'À louer' : 'À vendre'}
                        </span>
                        {/* Prix en bas de la photo */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                          <p className="text-white font-black text-[17px] leading-none drop-shadow">
                            {fmtPrix(b.prix)}
                            {b.transaction === 'location' && <span className="text-[11px] font-normal text-white/70">/mois</span>}
                          </p>
                          {b.nb_consultations > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-white/80">
                              <IcEye /> {b.nb_consultations}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Corps */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="font-bold text-[15px] leading-tight" style={{ color: 'var(--p-text)' }}>{bienLabel(b)}</p>
                          {b.statut === 'occupe' && (
                            <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#22C55E15', color: '#22C55E' }}>● Occupé</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 mb-3">
                          <span style={{ color: 'var(--p-muted)' }}><IcPin /></span>
                          <span className="text-xs truncate" style={{ color: 'var(--p-muted)' }}>{adresse}</span>
                        </div>

                        {/* Chips pièces / surface / composition */}
                        {(nbPieces > 0 || superficie || compo) && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {nbPieces > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: BLUE + '10', color: BLUE }}>
                                {nbPieces} pièce{nbPieces > 1 ? 's' : ''}
                              </span>
                            )}
                            {superficie && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--p-border)', color: 'var(--p-muted)' }}>
                                {superficie} m²
                              </span>
                            )}
                            {compo && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--p-border)', color: 'var(--p-muted)' }}>
                                {compo}
                              </span>
                            )}
                          </div>
                        )}

                        {b.statut_moderation === 'rejete' && b.motif_refus && (
                          <p className="text-[10px] mb-3 truncate" style={{ color: '#EF4444' }}>⚠ {b.motif_refus}</p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--p-border)' }}
                          onClick={e => e.stopPropagation()}>
                          <button onClick={() => setEditingBien(b)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                            style={{ background: BLUE + '10', color: BLUE, border: `1px solid ${BLUE}20` }}
                            onMouseEnter={e => { e.currentTarget.style.background = BLUE + '20' }}
                            onMouseLeave={e => { e.currentTarget.style.background = BLUE + '10' }}>
                            <IcEdit /> Modifier
                          </button>
                          <button onClick={() => del(b.id)}
                            className="flex items-center justify-center w-9 h-9 rounded-xl text-xs transition-all flex-shrink-0"
                            style={{ background: '#EF444410', color: '#EF4444', border: '1px solid #EF444420' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#EF444420' }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#EF444410' }}>
                            <IcTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </AnimatedGroup>
          )}
        </div>
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
  // Résultats de recherche dans le CONTENU des messages (endpoint /chat/search,
  // équivalent de ConversationsScreen._doSearch côté mobile — jusqu'ici jamais
  // appelé côté web, qui ne filtrait que le nom du contact localement).
  const [messageHits, setMessageHits] = useState<any[]>([])
  const [searchingMsgs, setSearchingMsgs] = useState(false)

  useEffect(() => {
    setLoading(true)
    chatApi.conversations()
      .then(d => setConvs(Array.isArray(d) ? d : d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const q = search.trim()
    if (q.length < 2) { setMessageHits([]); return }
    setSearchingMsgs(true)
    const t = setTimeout(() => {
      chatApi.search(q)
        .then(d => setMessageHits(Array.isArray(d?.messages) ? d.messages : []))
        .catch(() => setMessageHits([]))
        .finally(() => setSearchingMsgs(false))
    }, 350)
    return () => clearTimeout(t)
  }, [search])

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
    <div className="flex flex-1 overflow-hidden" style={{ background: 'var(--p-deep)' }}>
      {/* Liste — masquée sur mobile/tablette quand une conversation est ouverte */}
      <div className={`w-full md:w-[300px] flex-shrink-0 flex-col overflow-hidden ${activeConvId != null ? 'hidden md:flex' : 'flex'}`}
        style={{ background: 'var(--p-card)', borderRight: '1px solid var(--p-border)' }}>
        <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid var(--p-border)' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-0.5" style={{ color: 'var(--p-muted)' }}>CHAT</p>
            <h2 className="text-[20px] font-black tracking-tight" style={{ color: 'var(--p-text)' }}>
              Messages
              {!loading && <span className="ml-2 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold text-white align-middle" style={{ background: BLUE }}>{convs.length}</span>}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--p-border)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--p-muted)', flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une conversation…"
            className="flex-1 min-w-0 border-none outline-none bg-transparent text-[13px]"
            style={{ color: 'var(--p-text)' }} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-2">{[1, 2, 3].map(n => <div key={n} className="h-[64px] rounded-xl animate-pulse" style={{ background: 'var(--p-border)' }} />)}</div>
          ) : filtered.length === 0 && messageHits.length === 0 && !searchingMsgs ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: BLUE + '14' }}>
                <span style={{ color: BLUE }}><IcMessagesNav /></span>
              </div>
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--p-text)' }}>{search ? 'Aucun résultat' : 'Aucune conversation'}</p>
              <p className="text-xs" style={{ color: 'var(--p-muted)' }}>{search ? `Rien ne correspond à « ${search} ».` : 'Vos échanges avec vos clients apparaîtront ici.'}</p>
            </div>
          ) : <>
          {search.trim().length >= 2 && filtered.length > 0 && (
            <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-muted)' }}>Conversations</p>
          )}
          {filtered.map(conv => {
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
                    <p className={`text-[13px] truncate ${hasUnread ? 'font-bold' : 'font-semibold'}`} style={{ color: 'var(--p-text)' }}>{name}</p>
                    {timeStr && <p className="text-[11px] flex-shrink-0" style={{ color: 'var(--p-muted)' }}>{timeStr}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-xs truncate flex-1 ${hasUnread ? 'font-medium' : ''}`} style={{ color: hasUnread ? 'var(--p-text)' : 'var(--p-muted)' }}>{lastContenu}</p>
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
          {search.trim().length >= 2 && (searchingMsgs || messageHits.length > 0) && (
            <>
              <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-muted)' }}>Messages</p>
              {searchingMsgs ? (
                <p className="px-4 py-2 text-xs" style={{ color: 'var(--p-muted)' }}>Recherche…</p>
              ) : messageHits.map(hit => {
                const other = hit.conversation?.participants?.find((p: any) => p.id !== user?.id) || hit.conversation?.participants?.[0]
                const name = other?.prenom || other?.pseudonyme || other?.nom || 'Contact'
                const initiale = (name[0] || '?').toUpperCase()
                return (
                  <button key={hit.id} onClick={() => setActiveConvId(hit.conversationId)}
                    className="w-full flex items-center gap-2.5 px-4 py-3 transition-colors text-left"
                    style={{ background: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--p-border)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: MSG_AVATAR_COLORS[Math.abs(other?.id ?? hit.conversationId) % MSG_AVATAR_COLORS.length] }}>
                      <span className="text-white font-bold text-xs">{initiale}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-[13px] truncate font-semibold" style={{ color: 'var(--p-text)' }}>{name}</p>
                        <p className="text-[11px] flex-shrink-0" style={{ color: 'var(--p-muted)' }}>{formatConvTime(hit.created_at)}</p>
                      </div>
                      <p className="text-xs truncate" style={{ color: 'var(--p-muted)' }}>{hit.contenu}</p>
                    </div>
                  </button>
                )
              })}
            </>
          )}
          </>}
        </div>
      </div>

      {/* Fil de discussion */}
      <div className={`flex-1 flex-col overflow-hidden ${activeConvId != null ? 'flex' : 'hidden md:flex'}`}>
        {activeConvId != null ? (
          <ChatThread convId={activeConvId} onBack={() => setActiveConvId(null)} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8" style={{ background: 'var(--p-deep)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: BLUE + '12' }}>
              <span style={{ color: BLUE }}><IcMessagesNav /></span>
            </div>
            <p className="text-[15px] font-bold mb-1.5" style={{ color: 'var(--p-text)' }}>Sélectionnez une conversation</p>
            <p className="text-[13px] max-w-xs" style={{ color: 'var(--p-muted)' }}>Choisissez un contact dans la liste pour afficher les messages.</p>
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

/** Minutes avant la visite (peut être négatif si déjà passée) — équivalent de
 *  minutesAvantVisite côté mobile, utilisé pour le compte à rebours WhatsApp
 *  et le bandeau d'urgence. */
function minutesAvant(v: any, now: number): number | null {
  const raw = v.date_confirmee || v.date_contre_proposee || v.date_souhaitee
  if (!raw) return null
  return Math.round((new Date(raw).getTime() - now) / 60000)
}
/** Visite imminente à traiter d'urgence (< 125 min, comme _buildAlerteUrgente mobile). */
function isUrgente(v: any, now: number): boolean {
  if (v.statut !== 'en_attente' && v.statut !== 'confirmee') return false
  const m = minutesAvant(v, now)
  return m != null && m >= 0 && m <= 125
}

function VisiteCard({ v, chatLoadingId, onChat, onConfirm, onMarquerEffectuee, cpId, setCpId, cpDate, setCpDate, cpTime, setCpTime, submitting, onContrePropose, now }: {
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
  now: number
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
          <p className="font-bold text-[#F0EDE8] text-sm">{nom}</p>
          {v.numeros_partages ? (
            <div className="flex items-center gap-1">
              <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs" style={{ color: '#25D366' }}>Infos de visite disponibles</p>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <svg className="w-2.5 h-2.5 flex-shrink-0 text-[#8A9BB5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><rect x="5" y="11" width="14" height="9" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4" /></svg>
              <p className="text-xs text-[#8A9BB5]">Contact partagé à -30min</p>
            </div>
          )}
        </div>
        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex-shrink-0" style={{ background: color + '20', color }}>{label}</span>
      </div>
      {echouee && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border mb-3 text-xs font-semibold" style={{ background: '#EF444410', borderColor: '#EF444430', color: '#EF4444' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
          Cette visite ne s'est pas tenue.
        </div>
      )}
      {!echouee && isUrgente(v, now) && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border mb-3 text-xs font-semibold" style={{ background: '#F4433610', borderColor: '#F4433630', color: '#F44336' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Créneau dans {minutesAvant(v, now)} min — à traiter d'urgence
        </div>
      )}
      <div className="bg-[#0B1C30] rounded-xl p-3 mb-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span style={{ color: BLUE }}><IcHome /></span>
          <p className="text-xs font-medium text-[#F0EDE8] truncate">{bType} — {bLoc}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#8A9BB5]"><IcCal /></span>
          <p className="text-xs text-[#8A9BB5]">Demandé pour : {dateStr}</p>
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
            <p className="text-xs text-[#8A9BB5] italic">« {v.feedback_libre} »</p>
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
            <p className="text-[10px] font-semibold" style={{ color: '#25D366' }}>
              {(() => { const m = minutesAvant(v, now); return m != null && m >= 0 ? `Visite dans ${m} min — Contact client` : 'Contact client' })()}
            </p>
            <p className="text-sm font-bold text-[#F0EDE8]">{contactNumero}</p>
          </div>
          <a href={`https://wa.me/${contactNumero.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-white text-[11px] font-bold flex-shrink-0" style={{ background: '#25D366' }}>
            WhatsApp
          </a>
        </div>
      )}
      <div className="flex gap-2">
        {echouee ? (
          <button onClick={() => onChat(v)} disabled={chatLoadingId === v.id}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-bold disabled:opacity-50" style={{ background: '#EF4444' }}>
            <IcChat /> {chatLoadingId === v.id ? '…' : 'Contacter le client'}
          </button>
        ) : <>
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
        </>}
      </div>
      {cpId === v.id && (
        <div className="mt-3 pt-3 border-t border-[#1A3355]">
          <p className="text-sm font-bold text-[#F0EDE8] mb-3">Proposer un autre créneau</p>
          <div className="space-y-2 mb-3">
            <input type="date" value={cpDate} onChange={e => setCpDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              max={new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)}
              className="w-full bg-[#112440] rounded-xl px-3 py-2.5 text-sm outline-none border border-[#1A3355] text-[#F0EDE8] focus:border-[#4B6BFF]" />
            <input type="time" value={cpTime} onChange={e => setCpTime(e.target.value)}
              className="w-full bg-[#112440] rounded-xl px-3 py-2.5 text-sm outline-none border border-[#1A3355] text-[#F0EDE8] focus:border-[#4B6BFF]" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCpId(null)} className="flex-1 py-2.5 rounded-xl border border-[#1A3355] text-sm font-semibold text-[#8A9BB5] bg-[#0B1C30]">Annuler</button>
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
/** Génère un placeholder SVG coloré pour une réservation sans photo. */
function reservationPlaceholderSrc(letter: string, colorHex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="${colorHex}"/><text x="200" y="230" text-anchor="middle" font-size="160" font-weight="800" fill="rgba(255,255,255,0.18)" font-family="sans-serif">${letter.toUpperCase()}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** Modal de détail — thème clair, sections bien délimitées. */
function ReservationDetailModal({ v, onClose, chatLoadingId, onChat, onConfirm, onMarquerEffectuee, cpId, setCpId, cpDate, setCpDate, cpTime, setCpTime, submitting, onContrePropose, now }: {
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
  now: number
}) {
  const echouee = isEchouee(v)
  const urgente = !echouee && isUrgente(v, now)
  const { label: sLabel, color: sColor } = echouee ? { label: 'Échouée', color: '#EF4444' } : statutVisite(v.statut)
  const clientNom = `${v.client?.prenom || ''} ${v.client?.nom || ''}`.trim() || 'Client'
  const initiale = clientNom[0]?.toUpperCase() || '?'
  const bType = typeLabel(v.bien?.type || '')
  const loc = v.bien?.localisation
  const bLoc = loc ? `${loc.quartier ? loc.quartier + ', ' : ''}${loc.ville || ''}` : '—'
  const dateRef = v.date_contre_proposee || v.date_souhaitee
  const dateStr = dateRef
    ? new Date(dateRef).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—'
  const heureStr = dateRef
    ? new Date(dateRef).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : ''
  const contactNumero = v.client?.numero_whatsapp || v.client?.telephone
  const peutConfirmer = (v.statut === 'en_attente' || v.statut === 'contre_proposee') && !echouee && !isDatePassee(v)
  const mins = urgente ? minutesAvant(v, now) : null

  const [shown, setShown] = useState(false)
  const [closing, setClosing] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
    return () => cancelAnimationFrame(id)
  }, [])
  const handleClose = () => {
    setShown(false)
    setClosing(true)
    setTimeout(onClose, 220)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: shown ? 'rgba(10,16,30,0.45)' : 'rgba(10,16,30,0)',
        backdropFilter: shown ? 'blur(6px)' : 'blur(0px)',
        transition: 'background 0.25s ease, backdrop-filter 0.25s ease',
        pointerEvents: closing ? 'none' : 'auto',
      }}
      onClick={handleClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background: '#F8FAFF',
          boxShadow: '0 32px 96px rgba(10,16,30,0.32), 0 8px 24px rgba(10,16,30,0.12)',
          transform: shown ? 'scale(1)' : 'scale(0.82)',
          opacity: shown ? 1 : 0,
          transition: shown
            ? 'transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.22s ease'
            : 'transform 0.2s cubic-bezier(0.4, 0, 1, 1), opacity 0.18s ease',
          transformOrigin: 'center center',
        }}
        onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b"
          style={{ background: '#F8FAFF', borderColor: '#E8EDFB' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${BLUE}, #3A5AEE)` }}>{initiale}</div>
            <div>
              <p className="font-bold text-[14px] text-gray-900 leading-tight">{clientNom}</p>
              <p className="text-[11px] text-gray-400">{bType} · {bLoc}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: (urgente ? '#EF4444' : sColor) + '18', color: urgente ? '#EF4444' : sColor }}>
              {urgente ? '⚡ Urgent' : sLabel}
            </span>
            <button onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 transition-colors"
              style={{ background: '#EEF1FA' }}>✕</button>
          </div>
        </div>

        <div className="p-5 space-y-3">

          {/* ── Bannière urgence / échouée ── */}
          {urgente && mins !== null && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold"
              style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Créneau dans {mins < 60 ? `${mins} min` : `${Math.round(mins / 60)}h`} — à traiter d'urgence
            </div>
          )}
          {echouee && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold"
              style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
              </svg>
              Cette visite ne s'est pas tenue.
            </div>
          )}
          {v.statut === 'contre_proposee' && !echouee && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold"
              style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#B45309' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Contre-proposition envoyée — en attente du client
            </div>
          )}

          {/* ── Date ── */}
          <div className="rounded-xl p-4 border" style={{ background: '#fff', borderColor: '#E8EDFB' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Créneau demandé</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: BLUE + '12' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900 capitalize text-[15px]">{dateStr}</p>
                {heureStr && <p className="text-sm text-gray-500">{heureStr}</p>}
              </div>
            </div>
          </div>

          {/* ── Frais + paiement ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4 border" style={{ background: '#fff', borderColor: '#E8EDFB' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Frais de visite</p>
              <p className="font-black text-[18px]" style={{ color: BLUE }}>
                {Number(v.frais_visite) > 0 ? fmtPrix(v.frais_visite) : 'Gratuit'}
              </p>
            </div>
            <div className="rounded-xl p-4 border" style={{ background: '#fff', borderColor: '#E8EDFB' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Paiement</p>
              <p className="font-black text-[18px]" style={{ color: v.paiement_effectue ? '#16A34A' : '#9CA3AF' }}>
                {v.paiement_effectue ? '✓ Payé' : 'En attente'}
              </p>
            </div>
          </div>

          {/* ── Contact (si numeros_partages) ── */}
          {!echouee && v.statut === 'confirmee' && v.numeros_partages && contactNumero && (
            <div className="flex items-center gap-3 p-4 rounded-xl border"
              style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#25D36620' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-green-600">
                  {mins != null && mins >= 0 ? `Visite dans ${mins} min — ` : ''}Contact client
                </p>
                <p className="font-bold text-gray-900">{contactNumero}</p>
              </div>
              <a href={`https://wa.me/${contactNumero.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl text-white text-xs font-bold flex-shrink-0"
                style={{ background: '#25D366' }}>
                WhatsApp
              </a>
            </div>
          )}
          {v.numeros_partages === false && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm"
              style={{ background: '#F8FAFF', borderColor: '#E8EDFB', color: '#6B7280' }}>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="5" y="11" width="14" height="9" rx="2"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4"/>
              </svg>
              Contact partagé 30 min avant la visite
            </div>
          )}

          {/* ── Avis client (si effectuée) ── */}
          {v.statut === 'effectuee' && v.feedback_donne && v.note_client != null && (
            <div className="rounded-xl p-4 border" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-amber-600">Avis du client</p>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(n => (
                    <svg key={n} viewBox="0 0 24 24" className="w-3.5 h-3.5"
                      fill={n <= v.note_client ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                  ))}
                </div>
              </div>
              {v.feedback_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {v.feedback_tags.map((t: string) => (
                    <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: '#F59E0B18', color: '#B45309' }}>{t}</span>
                  ))}
                </div>
              )}
              {v.feedback_libre && (
                <p className="text-xs text-gray-500 italic">« {v.feedback_libre} »</p>
              )}
            </div>
          )}

          {/* ── Contre-proposition ── */}
          {cpId === v.id && (
            <div className="rounded-xl p-4 border" style={{ background: '#fff', borderColor: '#E8EDFB' }}>
              <p className="font-bold text-gray-800 mb-3 text-sm">Proposer un autre créneau</p>
              <div className="space-y-2 mb-3">
                <input type="date" value={cpDate} onChange={e => setCpDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  max={new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border text-gray-800"
                  style={{ borderColor: '#CBD5E1', background: '#F8FAFF' }}
                  onFocus={e => (e.target.style.borderColor = BLUE)}
                  onBlur={e => (e.target.style.borderColor = '#CBD5E1')} />
                <input type="time" value={cpTime} onChange={e => setCpTime(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border text-gray-800"
                  style={{ borderColor: '#CBD5E1', background: '#F8FAFF' }}
                  onFocus={e => (e.target.style.borderColor = BLUE)}
                  onBlur={e => (e.target.style.borderColor = '#CBD5E1')} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCpId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border text-gray-600"
                  style={{ borderColor: '#E2E8F0', background: '#F8FAFF' }}>Annuler</button>
                <button onClick={onContrePropose} disabled={!cpDate || !cpTime || submitting}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${BLUE}, #3A5AEE)` }}>
                  {submitting ? 'Envoi…' : 'Envoyer'}
                </button>
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-2 pt-1 pb-1 flex-wrap">
            <button onClick={() => onChat(v)} disabled={chatLoadingId === v.id}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold disabled:opacity-50 transition-all"
              style={{ borderColor: BLUE + '40', color: BLUE, background: BLUE + '08' }}>
              {chatLoadingId === v.id
                ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <IcChat />}
              Chat
            </button>
            {peutConfirmer && (
              <button onClick={() => onConfirm(v.id)}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all"
                style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)', boxShadow: '0 4px 14px rgba(22,163,74,0.25)' }}>
                Confirmer ✓
              </button>
            )}
            {v.statut === 'en_attente' && !echouee && !isDatePassee(v) && cpId !== v.id && (
              <button onClick={() => setCpId(v.id)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all text-gray-700"
                style={{ borderColor: '#CBD5E1', background: '#F8FAFF' }}>
                Autre créneau
              </button>
            )}
            {v.statut === 'confirmee' && !echouee && (
              <button onClick={() => { if (confirm('Confirmez-vous que la visite a bien eu lieu ?')) onMarquerEffectuee(v.id) }}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold"
                style={{ background: `linear-gradient(135deg, ${BLUE}, #3A5AEE)` }}>
                Marquer effectuée
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ReservationsTab({ biens, onScrolled }: { biens: any[]; onScrolled?: (v: boolean) => void }) {
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
  const [now, setNow] = useState(() => Date.now())

  const load = async () => {
    setLoading(true)
    try { const d = await visitesApi.reservationsRecues(); setVisites(Array.isArray(d) ? d : d.data || []) } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(id) }, [])

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
      if (match) {
        const draftMessage = isEchouee(v)
          ? `Bonjour, concernant votre visite du ${new Date(v.date_souhaitee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} qui ne s'est pas tenue, peut-on reprogrammer ?`
          : undefined
        navigate(`/conversations/${match.id}`, draftMessage ? { state: { draftMessage } } : undefined)
      }
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

  const STATUS_FILTERS = ['Toutes', 'À traiter', 'Confirmées', 'Effectuées', 'Annulées', 'Échouées']

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: 'var(--p-deep)' }}>

      {/* ── En-tête + filtres ── */}
      <div className="flex-shrink-0 px-5 md:px-8 xl:px-10 pt-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-1" style={{ color: 'var(--p-muted)' }}>Agenda</p>
            <h2 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--p-text)' }}>
              Réservations
              {!loading && <span className="ml-2 text-[15px] font-bold" style={{ color: BLUE }}>{filtered.length}</span>}
            </h2>
          </div>
          <button onClick={load}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all"
            style={{ color: 'var(--p-muted)', borderColor: 'var(--p-border)', background: 'var(--p-card)' }}>
            <IcRefresh /> Actualiser
          </button>
        </div>

        {/* Filtre statut */}
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={filter === f
                ? { background: BLUE, color: '#fff', borderColor: BLUE, boxShadow: `0 4px 12px ${BLUE}35` }
                : { background: 'var(--p-card)', color: 'var(--p-muted)', borderColor: 'var(--p-border)' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Filtre par bien (si plusieurs) */}
        {biensUniques.length >= 2 && (
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            <button onClick={() => setBienIdFilter(null)}
              className="flex-shrink-0 px-3.5 py-1 rounded-full text-[11px] font-semibold border transition-all"
              style={bienIdFilter === null
                ? { background: BLUE + '14', color: BLUE, borderColor: BLUE + '30' }
                : { background: 'var(--p-card)', color: 'var(--p-muted)', borderColor: 'var(--p-border)' }}>
              Tous les biens
            </button>
            {biensUniques.map(b => (
              <button key={b.id} onClick={() => setBienIdFilter(b.id)}
                className="flex-shrink-0 px-3.5 py-1 rounded-full text-[11px] font-semibold border transition-all whitespace-nowrap"
                style={bienIdFilter === b.id
                  ? { background: BLUE + '14', color: BLUE, borderColor: BLUE + '30' }
                  : { background: 'var(--p-card)', color: 'var(--p-muted)', borderColor: 'var(--p-border)' }}>
                {b.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Contenu ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 md:px-8 xl:px-10 pb-24"
        onScroll={e => onScrolled?.(e.currentTarget.scrollTop > 50)}>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {[1,2,3,4,5,6].map(n => (
              <div key={n} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
                <div className="h-40 w-full" style={{ background: 'var(--p-border)' }} />
                <div className="p-4 space-y-3">
                  <div className="h-4 rounded-full w-2/3" style={{ background: 'var(--p-border)' }} />
                  <div className="h-3 rounded-full w-1/2" style={{ background: 'var(--p-border)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: BLUE + '12', border: `1.5px solid ${BLUE}25` }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={1.4} className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <p className="font-bold text-lg mb-1" style={{ color: 'var(--p-text)' }}>Aucune réservation</p>
            <p className="text-sm text-center max-w-xs" style={{ color: 'var(--p-muted)' }}>
              {filter === 'Toutes' ? 'Les demandes de visite de vos clients apparaîtront ici' : `Aucune visite « ${filter} »`}
            </p>
          </div>
        ) : (
          <AnimatedGroup preset="blur-slide" stagger={0.055}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {filtered.map(v => {
                const echouee = isEchouee(v)
                const urgente = !echouee && isUrgente(v, now)
                const mins = urgente ? minutesAvant(v, now) : null
                const { label: sLabel, color: sColor } = echouee
                  ? { label: 'Échouée', color: '#EF4444' }
                  : statutVisite(v.statut)
                const clientNom = `${v.client?.prenom || ''} ${v.client?.nom || ''}`.trim() || 'Client'
                const initiale = clientNom[0]?.toUpperCase() || '?'
                const bType = typeLabel(v.bien?.type || '')
                const loc = v.bien?.localisation
                const bLoc = loc ? `${loc.quartier ? loc.quartier + ', ' : ''}${loc.ville || ''}` : '—'
                const dateRef = v.date_contre_proposee || v.date_souhaitee
                const dateStr = dateRef
                  ? new Date(dateRef).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                  : '—'
                const heureStr = dateRef
                  ? new Date(dateRef).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                  : ''
                const peutConfirmer = (v.statut === 'en_attente' || v.statut === 'contre_proposee') && !echouee && !isDatePassee(v)
                const bien = biens?.find((b: any) => b.id === v.bien?.id)
                const cover = bien?.photos?.find((p: any) => p.is_cover) || bien?.photos?.[0]
                const accentColor = urgente ? '#EF4444' : sColor

                return (
                  <div key={v.id}
                    className="group rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1"
                    style={{
                      background: 'var(--p-card)',
                      border: '1px solid var(--p-border)',
                      boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)',
                    }}
                    onClick={() => setModalVisiteId(v.id)}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 8px 32px rgba(75,107,255,0.12), 0 2px 8px rgba(15,23,42,0.08)`)}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)')}>

                    {/* ── Photo / Avatar ── */}
                    <div className="relative overflow-hidden" style={{ height: 156 }}>
                      {cover?.url
                        ? <img src={cover.url} alt={bType}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        : <div className="w-full h-full flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${accentColor}18, ${BLUE}14)` }}>
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-4xl"
                              style={{ background: accentColor + '20', color: accentColor }}>{initiale}</div>
                          </div>
                      }
                      {/* Gradient bas */}
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.60) 0%, transparent 50%)' }} />

                      {/* Badge statut haut-gauche */}
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                        style={{ background: accentColor, boxShadow: `0 2px 8px ${accentColor}55` }}>
                        {urgente ? '⚡ Urgent' : sLabel}
                      </span>

                      {/* Badge heure haut-droite */}
                      {heureStr && (
                        <span className="absolute top-3 right-3 px-2 py-1 rounded-lg text-[10px] font-bold text-white"
                          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
                          {heureStr}
                        </span>
                      )}

                      {/* Date + frais bas */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <p className="text-white font-bold text-[13px] leading-none drop-shadow capitalize">{dateStr}</p>
                        {Number(v.frais_visite) > 0 && (
                          <p className="text-white font-black text-[14px] leading-none drop-shadow">{fmtPrix(v.frais_visite)}</p>
                        )}
                      </div>
                    </div>

                    {/* ── Corps ── */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="font-bold text-[15px] leading-tight" style={{ color: 'var(--p-text)' }}>{clientNom}</p>
                        {v.paiement_effectue && (
                          <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: '#22C55E15', color: '#22C55E' }}>✓ Payé</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mb-4">
                        <span style={{ color: 'var(--p-muted)' }}><IcPin /></span>
                        <p className="text-[12px] truncate" style={{ color: 'var(--p-muted)' }}>{bType} · {bLoc}</p>
                      </div>

                      {/* Urgence compte à rebours */}
                      {urgente && mins !== null && (
                        <div className="flex items-center gap-1.5 mb-3 px-3 py-2 rounded-lg text-xs font-bold animate-pulse"
                          style={{ background: '#EF444412', color: '#EF4444' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          Dans {mins < 60 ? `${mins} min` : `${Math.round(mins / 60)}h`}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); setModalVisiteId(v.id) }}
                          className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                          style={{ background: BLUE + '12', color: BLUE, border: `1px solid ${BLUE}20` }}
                          onMouseEnter={e => { e.currentTarget.style.background = BLUE + '22' }}
                          onMouseLeave={e => { e.currentTarget.style.background = BLUE + '12' }}>
                          Voir le détail
                        </button>
                        {peutConfirmer && (
                          <button
                            onClick={e => { e.stopPropagation(); confirmer(v.id) }}
                            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                            style={{ background: '#22C55E12', color: '#22C55E', border: '1px solid #22C55E20' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#22C55E22' }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#22C55E12' }}>
                            Confirmer ✓
                          </button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); ouvrirChat(v) }}
                          disabled={chatLoadingId === v.id}
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                          style={{ background: 'var(--p-border)', color: 'var(--p-muted)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = BLUE + '18'; (e.currentTarget as HTMLElement).style.color = BLUE }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--p-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--p-muted)' }}>
                          {chatLoadingId === v.id
                            ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            : <IcChat />}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </AnimatedGroup>
        )}
      </div>

      {modalVisite && (
        <ReservationDetailModal v={modalVisite} onClose={() => setModalVisiteId(null)}
          chatLoadingId={chatLoadingId} onChat={ouvrirChat} onConfirm={confirmer} onMarquerEffectuee={marquerEffectuee}
          cpId={cpId} setCpId={setCpId} cpDate={cpDate} setCpDate={setCpDate} cpTime={cpTime} setCpTime={setCpTime}
          submitting={submitting} onContrePropose={contreProposer} now={now} />
      )}
    </div>
  )
}

// ─── Tab: Loyers ──────────────────────────────────────────────────────────────
// Statut d'un loyer — couvre les 4 valeurs réelles du backend (`en_attente`,
// `en_retard`, `paye`, `impaye`). `impaye` correspond à un loyer escaladé à
// l'administration (`escalade_admin`) : distingué du simple retard.
function loyerStatut(s: string): { label: string; color: string } {
  if (s === 'paye')      return { label: 'Payé',       color: '#4CAF50' }
  if (s === 'en_retard') return { label: 'En retard',  color: '#F44336' }
  if (s === 'impaye')    return { label: 'Impayé',     color: '#C62828' }
  return { label: 'En attente', color: '#FF9800' }
}
const CONTRAT_STATUT: Record<string, { label: string; color: string }> = {
  actif:   { label: 'Actif',   color: '#4CAF50' },
  resilie: { label: 'Résilié', color: 'var(--p-muted)' },
  expire:  { label: 'Expiré',  color: '#F44336' },
}
function moisLabel(d: any) {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  const s = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
function dateLabel(d: any) {
  if (!d) return '—'
  const date = new Date(d)
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function LoyersTab({ onScrolled }: { onScrolled?: (v: boolean) => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'tous' | 'actif' | 'resilie' | 'expire'>('tous')
  const [detailContrat, setDetailContrat] = useState<any>(null)
  useEffect(() => { loyersApi.dashboard().then(setData).catch(() => {}).finally(() => setLoading(false)) }, [])

  const stats = data?.stats || {}
  const contrats: any[] = data?.contrats || []
  const allLoyers: any[] = contrats.flatMap((c: any) => c.loyers || [])
  const enAttenteMontant = allLoyers.filter(l => l.statut === 'en_attente' || l.statut === 'en_retard').reduce((s, l) => s + Number(l.montant || 0), 0)
  const enRetardCount = stats.loyers_en_retard ?? allLoyers.filter(l => l.statut === 'en_retard').length
  const impayesCount = allLoyers.filter(l => l.statut === 'impaye').length

  const contratsResume = contrats.map((c: any) => {
    const loyersTries = [...(c.loyers || [])].sort((a: any, b: any) => new Date(a.date_echeance || a.mois || 0).getTime() - new Date(b.date_echeance || b.mois || 0).getTime())
    const impayesOuAttente = loyersTries.filter((l: any) => l.statut !== 'paye')
    const prochain = impayesOuAttente[0] || null
    const payesCount = loyersTries.filter((l: any) => l.statut === 'paye').length
    const totalCount = loyersTries.length
    const enProblemeCount = loyersTries.filter((l: any) => l.statut === 'en_retard' || l.statut === 'impaye').length
    return { ...c, loyersTries, prochain, payesCount, totalCount, enProblemeCount }
  })

  const filtered = filter === 'tous' ? contratsResume : contratsResume.filter((c: any) => c.statut === filter)
  const sorted = [...filtered].sort((a: any, b: any) => {
    const urg = (c: any) => c.prochain?.statut === 'impaye' ? 0 : c.prochain?.statut === 'en_retard' ? 1 : c.prochain ? 2 : 3
    return urg(a) - urg(b)
  })

  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: 'tous',    label: 'Tous' },
    { key: 'actif',   label: 'Actifs' },
    { key: 'resilie', label: 'Résiliés' },
    { key: 'expire',  label: 'Expirés' },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: 'var(--p-deep)' }}>

      {/* ── En-tête ── */}
      <div className="flex-shrink-0 px-5 md:px-8 xl:px-10 pt-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-1" style={{ color: 'var(--p-muted)' }}>Gestion</p>
            <h2 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--p-text)' }}>
              Loyers
              {!loading && <span className="ml-2 text-[15px] font-bold" style={{ color: BLUE }}>{sorted.length}</span>}
            </h2>
          </div>
        </div>

        {/* ── KPI cards ── */}
        {!loading && data && (() => {
          const kpis = [
            { label: 'TOTAL PERÇU', value: `${Number(stats.revenus_total ?? 0).toLocaleString('fr-FR')} F`, color: BLUE,      icon: <IcWallet /> },
            { label: 'CE MOIS',     value: `${Number(stats.revenus_mois ?? 0).toLocaleString('fr-FR')} F`,  color: '#16A34A', icon: <IcPayments /> },
            { label: 'EN ATTENTE',  value: `${Number(enAttenteMontant).toLocaleString('fr-FR')} F`,          color: '#F59E0B', icon: <IcClock /> },
            { label: 'EN RETARD',   value: `${enRetardCount + impayesCount}`,                                color: enRetardCount + impayesCount > 0 ? '#EF4444' : '#16A34A', icon: <IcShield /> },
          ] as { label: string; value: string; color: string; icon: React.ReactNode }[]
          return (
            <div className="rounded-2xl overflow-hidden mb-3"
              style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
              {/* Mobile : grille 2×2 */}
              <div className="grid grid-cols-2 sm:hidden">
                {kpis.map((k, i) => (
                  <div key={k.label} className="flex flex-col gap-2 p-3"
                    style={{
                      borderLeft: i % 2 === 1 ? '1px solid var(--p-border)' : undefined,
                      borderTop: i >= 2 ? '1px solid var(--p-border)' : undefined,
                    }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: k.color + '14', color: k.color }}>{k.icon}</div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-widest leading-none mb-1" style={{ color: 'var(--p-muted)' }}>{k.label}</p>
                      <p className="text-[16px] font-black leading-none truncate" style={{ color: k.color }}>{k.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Tablette / desktop : ligne unique */}
              <div className="hidden sm:flex">
                {kpis.map((k, i) => (
                  <div key={k.label} className="flex-1 flex items-center gap-2.5 px-2 py-6"
                    style={{ borderLeft: i > 0 ? '1px solid var(--p-border)' : 'none' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: k.color + '14', color: k.color }}>{k.icon}</div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1.5" style={{ color: 'var(--p-muted)' }}>{k.label}</p>
                      <p className="text-[23px] font-black leading-none truncate" style={{ color: k.color }}>{k.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* ── Filtres ── */}
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={filter === f.key
                ? { background: BLUE, color: '#fff', borderColor: BLUE, boxShadow: `0 4px 12px ${BLUE}35` }
                : { background: 'var(--p-card)', color: 'var(--p-muted)', borderColor: 'var(--p-border)' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 md:px-8 xl:px-10 pb-24"
        onScroll={e => onScrolled?.(e.currentTarget.scrollTop > 50)}>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {[1,2,3,4,5,6].map(n => (
              <div key={n} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
                <div className="h-40 w-full" style={{ background: 'var(--p-border)' }} />
                <div className="p-4 space-y-3">
                  <div className="h-4 rounded-full w-2/3" style={{ background: 'var(--p-border)' }} />
                  <div className="h-3 rounded-full w-1/2" style={{ background: 'var(--p-border)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: BLUE + '12', border: `1.5px solid ${BLUE}25` }}>
              <IcPayments />
            </div>
            <p className="font-bold text-lg mb-1" style={{ color: 'var(--p-text)' }}>Aucun contrat</p>
            <p className="text-sm text-center max-w-xs" style={{ color: 'var(--p-muted)' }}>
              {filter === 'tous' ? 'Vos contrats de location apparaîtront ici' : `Aucun contrat « ${filter} »`}
            </p>
          </div>
        ) : (
          <AnimatedGroup preset="blur-slide" stagger={0.055}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {sorted.map((c: any) => {
                const cStatut = CONTRAT_STATUT[c.statut] || { label: c.statut, color: 'var(--p-muted)' }
                const initiale = (c.locataire?.prenom || c.locataire?.nom || '?').charAt(0).toUpperCase()
                const aJour = !c.prochain
                const prochainStatut = c.prochain ? loyerStatut(c.prochain.statut) : null
                const cover = c.bien?.photos?.find((p: any) => p.is_cover) || c.bien?.photos?.[0]
                const progressPct = c.totalCount > 0 ? Math.round((c.payesCount / c.totalCount) * 100) : 0
                const alertColor = aJour ? '#16A34A' : prochainStatut!.color

                return (
                  <div key={c.id}
                    className="group rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1"
                    style={{
                      background: 'var(--p-card)',
                      border: '1px solid var(--p-border)',
                      boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)',
                    }}
                    onClick={() => setDetailContrat(c)}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 8px 32px rgba(75,107,255,0.12), 0 2px 8px rgba(15,23,42,0.08)`)}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)')}>

                    {/* ── Visuel haut ── */}
                    <div className="relative overflow-hidden" style={{ height: 148 }}>
                      {cover?.url
                        ? <img src={cover.url} alt=""
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        : <div className="w-full h-full flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${alertColor}14, ${BLUE}10)` }}>
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-4xl"
                              style={{ background: alertColor + '20', color: alertColor }}>{initiale}</div>
                          </div>
                      }
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.62) 0%, transparent 52%)' }} />

                      {/* Statut contrat haut-gauche */}
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                        style={{ background: cStatut.color, boxShadow: `0 2px 8px ${cStatut.color}55` }}>
                        {cStatut.label}
                      </span>

                      {/* Loyer mensuel haut-droite */}
                      <span className="absolute top-3 right-3 px-2 py-1 rounded-lg text-[10px] font-bold text-white"
                        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
                        {fmtPrix(c.loyer_mensuel)}<span className="font-normal opacity-70">/mois</span>
                      </span>

                      {/* Locataire bas-gauche */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white font-bold text-[14px] leading-tight drop-shadow truncate">
                          {c.locataire?.prenom} {c.locataire?.nom}
                        </p>
                        <p className="text-white/70 text-[11px] truncate">
                          {typeLabel(c.bien?.type || '')} · {c.bien?.localisation?.ville || '—'}
                        </p>
                      </div>
                    </div>

                    {/* ── Corps ── */}
                    <div className="p-4">
                      {/* Statut du prochain loyer */}
                      {aJour ? (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3"
                          style={{ background: '#16A34A12' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2.5} className="w-4 h-4 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                          <span className="text-xs font-bold" style={{ color: '#16A34A' }}>À jour</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-3"
                          style={{ background: prochainStatut!.color + '12' }}>
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium" style={{ color: 'var(--p-muted)' }}>Prochain dû</p>
                            <p className="text-xs font-bold truncate" style={{ color: 'var(--p-text)' }}>
                              {moisLabel(c.prochain.mois)}
                              {c.prochain.jours_retard > 0 && <span className="font-bold ml-1.5" style={{ color: prochainStatut!.color }}>· {c.prochain.jours_retard} j</span>}
                            </p>
                          </div>
                          <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: prochainStatut!.color + '22', color: prochainStatut!.color }}>
                            {prochainStatut!.label}
                          </span>
                        </div>
                      )}

                      {/* Barre de progression loyers */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--p-border)' }}>
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%`, background: progressPct === 100 ? '#16A34A' : BLUE }} />
                        </div>
                        <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: 'var(--p-muted)' }}>
                          {c.payesCount}/{c.totalCount}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </AnimatedGroup>
        )}
      </div>

      {detailContrat && (
        <ContratDetailModal contrat={detailContrat} onClose={() => setDetailContrat(null)} />
      )}
    </div>
  )
}

function ContratDetailModal({ contrat, onClose }: { contrat: any; onClose: () => void }) {
  const c = contrat
  const cStatut = CONTRAT_STATUT[c.statut] || { label: c.statut, color: 'var(--p-muted)' }
  const initiale = (c.locataire?.prenom || c.locataire?.nom || '?').charAt(0).toUpperCase()
  const cover = c.bien?.photos?.find((p: any) => p.is_cover) || c.bien?.photos?.[0]
  const payesCount: number = c.payesCount ?? 0
  const totalCount: number = c.totalCount ?? 0
  const progressPct = totalCount > 0 ? Math.round((payesCount / totalCount) * 100) : 0

  const [shown, setShown] = useState(false)
  const [closing, setClosing] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
    return () => cancelAnimationFrame(id)
  }, [])
  const handleClose = () => {
    setShown(false)
    setClosing(true)
    setTimeout(onClose, 220)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: shown ? 'rgba(10,16,30,0.45)' : 'rgba(10,16,30,0)',
        backdropFilter: shown ? 'blur(6px)' : 'blur(0px)',
        transition: 'background 0.25s ease, backdrop-filter 0.25s ease',
        pointerEvents: closing ? 'none' : 'auto',
      }}
      onClick={handleClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background: '#F8FAFF',
          boxShadow: '0 32px 96px rgba(10,16,30,0.32), 0 8px 24px rgba(10,16,30,0.12)',
          transform: shown ? 'scale(1)' : 'scale(0.82)',
          opacity: shown ? 1 : 0,
          transition: shown
            ? 'transform 0.42s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease'
            : 'transform 0.2s cubic-bezier(0.4,0,1,1), opacity 0.18s ease',
          transformOrigin: 'center center',
        }}
        onClick={e => e.stopPropagation()}>

        {/* ── Photo banner ── */}
        <div className="relative overflow-hidden rounded-t-2xl" style={{ height: 140 }}>
          {cover?.url
            ? <img src={cover.url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${BLUE}18, ${BLUE}08)` }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-4xl"
                  style={{ background: BLUE + '20', color: BLUE }}>{initiale}</div>
              </div>
          }
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />
          <button onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-xl text-white/80 hover:text-white transition-colors"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}>✕</button>
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
            style={{ background: cStatut.color }}>
            {cStatut.label}
          </span>
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-white font-bold text-[16px] leading-tight drop-shadow">
              {c.locataire?.prenom} {c.locataire?.nom}
            </p>
            <p className="text-white/70 text-[12px]">
              {typeLabel(c.bien?.type || '')} · {c.bien?.localisation?.quartier ? `${c.bien.localisation.quartier}, ` : ''}{c.bien?.localisation?.ville || '—'}
            </p>
          </div>
        </div>

        <div className="p-5 space-y-3">

          {/* ── Loyer + progression ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4 border" style={{ background: '#fff', borderColor: '#E8EDFB' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Loyer mensuel</p>
              <p className="font-black text-[20px]" style={{ color: BLUE }}>{fmtPrix(c.loyer_mensuel)}</p>
            </div>
            <div className="rounded-xl p-4 border" style={{ background: '#fff', borderColor: '#E8EDFB' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Progression</p>
              <p className="font-black text-[20px]" style={{ color: progressPct === 100 ? '#16A34A' : BLUE }}>
                {payesCount}<span className="text-sm font-medium text-gray-400">/{totalCount}</span>
              </p>
              <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: '#E8EDFB' }}>
                <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: progressPct === 100 ? '#16A34A' : BLUE }} />
              </div>
            </div>
          </div>

          {/* ── Infos contrat ── */}
          <div className="rounded-xl border overflow-hidden" style={{ background: '#fff', borderColor: '#E8EDFB' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: '#E8EDFB' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Détails du contrat</p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y" style={{ borderColor: '#E8EDFB' }}>
              {[
                { label: 'Début', value: dateLabel(c.date_debut) },
                { label: 'Fin', value: c.date_fin ? dateLabel(c.date_fin) : 'En cours' },
                { label: 'Échéance', value: `Le ${c.jour_echeance ?? 10} du mois` },
                { label: 'Prépayé', value: c.loyer_prepaye_mois > 0 ? `${c.loyer_prepaye_mois} mois` : 'Aucun' },
              ].map(row => (
                <div key={row.label} className="px-4 py-3" style={{ borderColor: '#E8EDFB' }}>
                  <p className="text-[10px] text-gray-400 mb-0.5">{row.label}</p>
                  <p className="text-sm font-semibold text-gray-800">{row.value}</p>
                </div>
              ))}
            </div>
            {c.gestion_via_app === false && (
              <div className="px-4 py-2.5 border-t text-xs text-gray-400 italic" style={{ borderColor: '#E8EDFB' }}>
                Gestion déléguée (hors application)
              </div>
            )}
          </div>

          {/* ── Historique des échéances ── */}
          <div className="rounded-xl border overflow-hidden" style={{ background: '#fff', borderColor: '#E8EDFB' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: '#E8EDFB' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Historique des échéances</p>
            </div>
            {(!c.loyersTries || c.loyersTries.length === 0) ? (
              <p className="text-xs text-gray-400 py-8 text-center">Aucune échéance générée</p>
            ) : (
              <div className="divide-y" style={{ borderColor: '#E8EDFB' }}>
                {[...c.loyersTries].reverse().map((l: any) => {
                  const { label, color } = loyerStatut(l.statut)
                  return (
                    <div key={l.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: color + '14', color }}>
                        <IcPayments />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{moisLabel(l.mois)}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Échéance {dateLabel(l.date_echeance)}
                          {l.statut === 'paye' && l.date_paiement && ` · payé le ${dateLabel(l.date_paiement)}`}
                          {l.jours_retard > 0 && l.statut !== 'paye' && ` · ${l.jours_retard} j de retard`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-800">{fmtPrix(l.montant)}</p>
                        <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: color + '18', color }}>{label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
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

// Moyens de retrait proposés — logos fournis dans /public pour Moov, Celtiis
// et FedaPay ; MTN reste en puce de couleur (pas de logo fourni pour celui-ci).
const RETRAIT_METHODES: { key: string; label: string; short: string; sub: string; bg: string; fg: string; logo?: string }[] = [
  { key: 'MTN MoMo',     label: 'MTN MoMo',     short: 'MTN',  sub: 'Retrait via MTN Mobile Money',      bg: '#FFCC00', fg: '#3D2E00' },
  { key: 'Moov Flooz',   label: 'Moov Flooz',   short: 'MOOV', sub: 'Retrait via Moov Mobile Money',     bg: '#0066CC', fg: '#FFFFFF', logo: '/logo-moov.png' },
  { key: 'Celtiis Cash', label: 'Celtiis Cash', short: 'CEL',  sub: 'Retrait via Celtiis Mobile Money',  bg: '#E63946', fg: '#FFFFFF', logo: '/logo-celtis.webp' },
  { key: 'FedaPay',      label: 'FedaPay',      short: 'FP',   sub: 'Retrait via FedaPay (Mobile Money / Carte)', bg: '#0B4F6C', fg: '#FFFFFF', logo: '/logo-fedapay.jpg' },
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
        <div className="bg-[#0B1C30] rounded-2xl w-full max-w-sm p-7 text-center border border-[#1A3355]">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)', boxShadow: '0 8px 20px rgba(76,175,80,0.35)' }}>
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <p className="font-bold text-[#F0EDE8] text-lg mb-2">Retrait initié !</p>
          <p className="text-sm text-[#8A9BB5] leading-relaxed mb-6">
            Retrait de {montantNum.toLocaleString('fr-FR')} FCFA via {methode}. {successMsg}
          </p>
          <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: BLUE, color: '#060D1A' }}>Fermer</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div className="bg-[#0B1C30] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-[#1A3355]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A3355] sticky top-0 bg-[#0B1C30] z-10">
          <div>
            <h2 className="font-bold text-[#F0EDE8]">Demander un retrait</h2>
            <p className="text-xs text-[#8A9BB5] mt-0.5">Solde disponible : {solde.toLocaleString('fr-FR')} FCFA</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0B1C30] text-[#8A9BB5] flex-shrink-0">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="px-3.5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#EF444414', color: '#EF4444', border: '1px solid #EF444430' }}>
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-[#F0EDE8] uppercase tracking-wide mb-2 block">Montant à retirer</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A9BB5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="5" width="20" height="14" rx="2" /><path strokeLinecap="round" d="M2 10h20" /></svg>
              <input type="number" value={montant} onChange={e => setMontant(e.target.value)} placeholder="Ex: 50000" min={1000} max={solde}
                className="w-full bg-[#112440] border border-[#1A3355] rounded-xl pl-10 pr-16 py-3 text-sm font-bold outline-none text-[#F0EDE8] focus:border-[#4B6BFF]" />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8A9BB5]">FCFA</span>
            </div>
            <p className="text-[11px] text-[#8A9BB5] mt-1.5">Minimum 1 000 FCFA — traitement sous 48 heures ouvrées.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-[#F0EDE8] uppercase tracking-wide mb-2 block">Choisir le mode de retrait</label>
            <div className="space-y-2">
              {RETRAIT_METHODES.map(m => {
                const selected = methode === m.key
                return (
                  <button key={m.key} onClick={() => setMethode(m.key)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors"
                    style={{ borderColor: selected ? BLUE : '#1A3355', background: selected ? 'rgba(212,168,71,0.10)' : '#0B1C30' }}>
                    {m.logo ? (
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#112440] border border-[#1A3355] p-1.5">
                        <img src={m.logo} alt={m.label} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-extrabold text-[11px]"
                        style={{ background: m.bg, color: m.fg }}>
                        {m.short}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm" style={{ color: selected ? BLUE : '#F0EDE8' }}>{m.label}</p>
                      <p className="text-xs text-[#8A9BB5]">{m.sub}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2"
                      style={{ borderColor: selected ? BLUE : '#1A3355', background: selected ? BLUE : 'transparent' }}>
                      {selected && <svg className="w-3 h-3" style={{ color: '#060D1A' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {methode && (
            <div>
              <label className="text-xs font-bold text-[#F0EDE8] uppercase tracking-wide mb-2 block">Numéro {methode}</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A9BB5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <input type="tel" value={numero} onChange={e => setNumero(e.target.value)} placeholder="Ex: 97000000"
                  className="w-full bg-[#112440] border border-[#1A3355] rounded-xl pl-10 pr-4 py-3 text-sm outline-none text-[#F0EDE8] focus:border-[#4B6BFF]" />
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
  const [detailTx, setDetailTx] = useState<any>(null)

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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-[#112440] transition-opacity hover:opacity-90" style={{ color: BLUE }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 7h6m-6 4h6" /></svg>
              Historique complet
            </button>
          </div>
        </div>

        {/* Mini-stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card-soft rounded-2xl p-3.5 min-w-0">
            <p className="text-[10px] font-semibold text-[#8A9BB5] uppercase tracking-wide mb-1">Reçu ce mois</p>
            <p className="text-sm font-bold text-[#F0EDE8] truncate">{recuCeMois.toLocaleString('fr-FR')} F</p>
          </div>
          <div className="card-soft rounded-2xl p-3.5">
            <p className="text-[10px] font-semibold text-[#8A9BB5] uppercase tracking-wide mb-1">Transactions</p>
            <p className="text-sm font-bold text-[#F0EDE8]">{transactions.length}</p>
          </div>
          <div className="card-soft rounded-2xl p-3.5">
            <p className="text-[10px] font-semibold text-[#8A9BB5] uppercase tracking-wide mb-1">Dernière</p>
            <p className="text-sm font-bold text-[#F0EDE8]">{derniereLabel}</p>
          </div>
        </div>

        {/* Transactions récentes */}
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-[#F0EDE8]">Transactions récentes</p>
          {transactions.length > 0 && (
            <button onClick={onOpenTransactions} className="text-xs font-semibold" style={{ color: BLUE }}>Voir tout →</button>
          )}
        </div>
        {loading ? [1, 2, 3].map(n => <div key={n} className="h-16 skeleton-dark rounded-xl mb-2" />) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center card-navy rounded-2xl">
            <p className="font-bold text-[#F0EDE8] mb-1">Aucune transaction</p>
            <p className="text-sm text-[#8A9BB5]">Vos loyers, frais de visite et intégrations apparaîtront ici.</p>
          </div>
        ) : transactions.slice(0, 5).map((t: any, i: number) => {
          const isCredit = t.type === 'credit' || Number(t.montant) > 0
          const cat = categorieTransaction(t.description)
          return (
            <button key={t.id || i} onClick={() => setDetailTx(t)} className="w-full flex items-center gap-3 p-3.5 card-navy rounded-xl mb-2 text-left hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cat.color + '18' }}>
                <span style={{ color: cat.color }}>{isCredit ? <IcTrendUp /> : <IcTrendDown />}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#F0EDE8] text-sm truncate">{t.description || (isCredit ? 'Crédit' : 'Débit')}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ background: cat.color + '15', color: cat.color }}>{cat.label}</span>
                  <span className="text-[10px] text-[#8A9BB5]">{new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
              <p className="font-bold text-sm flex-shrink-0" style={{ color: isCredit ? '#22C55E' : '#EF4444' }}>
                {isCredit ? '+' : '-'}{Math.abs(Number(t.montant)).toLocaleString('fr-FR')} F
              </p>
            </button>
          )
        })}
      </div>
      {showRetrait && (
        <RetraitModal solde={solde} onClose={() => setShowRetrait(false)} onSuccess={load} />
      )}
      {detailTx && <TransactionDetailModal t={detailTx} onClose={() => setDetailTx(null)} />}
    </div>
  )
}

// ─── Tab: Historique des transactions ──────────────────────────────────────────
function categorieTransaction(description: string): { label: string; color: string } {
  const d = (description || '').toLowerCase()
  if (d.startsWith('loyer')) return { label: 'Loyer', color: BLUE }
  if (d.startsWith('frais de visite')) return { label: 'Visite', color: '#7B2FBE' }
  if (d.startsWith('intégration') || d.startsWith('integration')) return { label: 'Intégration', color: '#F59E0B' }
  return { label: 'Autre', color: '#6B7280' }
}

// Statut réel du paiement à l'origine du mouvement (enrichi côté backend via
// wallets.service.ts::getMyTransactions, jointure par référence sur la table
// `transactions`). `null` = mouvement sans paiement lié (ex. retrait) : par
// construction déjà survenu, donc "Complété".
function txStatutMeta(statut: string | null | undefined): { label: string; color: string } {
  if (statut === 'en_attente') return { label: 'En attente', color: '#FF9800' }
  if (statut === 'echoue')     return { label: 'Échoué',     color: '#EF4444' }
  if (statut === 'rembourse')  return { label: 'Remboursé',  color: '#6B7280' }
  return { label: 'Complété', color: '#22C55E' }
}
const METHODE_LABELS: Record<string, string> = { momo: 'MTN MoMo', flooz: 'Moov Flooz', celtiis: 'Celtiis Cash', fedapay: 'FedaPay' }

function TransactionDetailModal({ t, onClose }: { t: any; onClose: () => void }) {
  const isCredit = t.type === 'credit' || Number(t.montant) > 0
  const cat = categorieTransaction(t.description)
  const statut = txStatutMeta(t.statut)
  const lien = t.visite_id ? `Visite #${t.visite_id}` : t.loyer_id ? `Loyer #${t.loyer_id}` : t.contrat_id ? `Contrat #${t.contrat_id}` : null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="bg-[#0B1C30] rounded-2xl w-full max-w-md border border-[#1A3355]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A3355]">
          <h2 className="font-bold text-[#F0EDE8]">Détail de la transaction</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0B1C30] text-[#8A9BB5] flex-shrink-0">✕</button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cat.color + '18' }}>
              <span style={{ color: cat.color }}>{isCredit ? <IcTrendUp /> : <IcTrendDown />}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[#F0EDE8] truncate">{t.description || (isCredit ? 'Crédit' : 'Débit')}</p>
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: cat.color + '15', color: cat.color }}>{cat.label}</span>
            </div>
            <p className="font-extrabold text-lg flex-shrink-0" style={{ color: isCredit ? '#22C55E' : '#EF4444' }}>
              {isCredit ? '+' : '-'}{Math.abs(Number(t.montant)).toLocaleString('fr-FR')} F
            </p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#8A9BB5]">Statut</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: statut.color + '18', color: statut.color }}>{statut.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8A9BB5]">Date</span>
              <span className="font-semibold text-[#F0EDE8]">{new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8A9BB5]">Référence</span>
              <span className="font-mono text-xs text-[#F0EDE8]">{t.reference || '—'}</span>
            </div>
            {t.methode_paiement && (
              <div className="flex items-center justify-between">
                <span className="text-[#8A9BB5]">Moyen de paiement</span>
                <span className="font-semibold text-[#F0EDE8]">{METHODE_LABELS[t.methode_paiement] || t.methode_paiement}</span>
              </div>
            )}
            {t.telephone_paiement && (
              <div className="flex items-center justify-between">
                <span className="text-[#8A9BB5]">Numéro utilisé</span>
                <span className="font-semibold text-[#F0EDE8]">{t.telephone_paiement}</span>
              </div>
            )}
            {lien && (
              <div className="flex items-center justify-between">
                <span className="text-[#8A9BB5]">Concerne</span>
                <span className="font-semibold text-[#F0EDE8]">{lien}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TransactionsTab() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'tous' | 'credit' | 'debit'>('tous')
  const [catFilter, setCatFilter] = useState('Tous')
  const [detailTx, setDetailTx] = useState<any>(null)

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
      <div className="bg-[#0B1C30] border-b border-[#1A3355] flex items-center gap-3 px-4 md:px-6 py-3 flex-shrink-0 flex-wrap">
        <h1 className="text-[17px] font-bold uppercase tracking-wide" style={{ color: BLUE }}>Historique des transactions</h1>
        <div className="flex-1" />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="bg-[#112440] border border-[#1A3355] rounded-lg px-2.5 py-1.5 text-sm outline-none text-[#F0EDE8]">
          {categories.map(c => <option key={c} value={c}>{c === 'Tous' ? 'Toutes les catégories' : c}</option>)}
        </select>
        <div className="flex items-center rounded-lg border border-[#1A3355] p-0.5">
          {(['tous', 'credit', 'debit'] as const).map(f => (
            <button key={f} onClick={() => setTypeFilter(f)}
              className="rounded-md px-3 py-1 text-xs font-semibold transition-colors"
              style={typeFilter === f ? { background: BLUE, color: '#060D1A' } : { color: 'var(--p-muted)' }}>
              {f === 'tous' ? 'Tous' : f === 'credit' ? 'Entrées' : 'Sorties'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
      {/* Cartes de synthèse */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="flex items-center gap-3 rounded-xl card-navy p-3.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#22C55E18' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17 7 7 17M17 17H7V7" /></svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[#8A9BB5]">Total entrées</p>
            <p className="text-base font-bold text-[#F0EDE8] truncate">{fmtPrix(totalIn)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl card-navy p-3.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#EF444418' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10v10M7 17 17 7" /></svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[#8A9BB5]">Total sorties</p>
            <p className="text-base font-bold text-[#F0EDE8] truncate">{fmtPrix(totalOut)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl card-navy p-3.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BLUE + '18' }}>
            <span style={{ color: BLUE }}><IcTrendUp /></span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[#8A9BB5]">Plus grosse</p>
            <p className="text-base font-bold text-[#F0EDE8] truncate">{fmtPrix(largest)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl card-navy p-3.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#1A3355' }}>
            <span className="text-[#8A9BB5] font-bold text-sm">#</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[#8A9BB5]">Nombre</p>
            <p className="text-base font-bold text-[#F0EDE8] truncate">{transactions.length}</p>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative mb-4">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A9BB5]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une transaction…"
          className="w-full bg-[#112440] border border-[#1A3355] rounded-lg pl-8 pr-3 py-2 text-sm outline-none text-[#F0EDE8] placeholder:text-[#8A9BB5] focus:border-[#4B6BFF]" />
      </div>

      {/* Tableau */}
      <div className="rounded-xl overflow-hidden card-soft">
        {loading ? (
          <div className="p-4 space-y-2">{[1, 2, 3, 4].map(n => <div key={n} className="h-14 skeleton-dark rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <p className="font-bold text-[#F0EDE8] mb-1">Aucune transaction</p>
            <p className="text-sm text-[#8A9BB5] px-6">{search || catFilter !== 'Tous' || typeFilter !== 'tous' ? 'Rien ne correspond à ces filtres.' : 'Vos revenus (loyers, frais de visite, intégrations) apparaîtront ici.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--p-surface)', borderBottom: `1px solid var(--p-border)` }}>
                  <th className="text-left font-semibold text-[#8A9BB5] text-[11px] uppercase tracking-wide px-4 py-2.5">Transaction</th>
                  <th className="text-left font-semibold text-[#8A9BB5] text-[11px] uppercase tracking-wide px-4 py-2.5 hidden sm:table-cell">Référence</th>
                  <th className="text-right font-semibold text-[#8A9BB5] text-[11px] uppercase tracking-wide px-4 py-2.5">Montant</th>
                  <th className="text-left font-semibold text-[#8A9BB5] text-[11px] uppercase tracking-wide px-4 py-2.5 hidden md:table-cell">Date</th>
                  <th className="text-left font-semibold text-[#8A9BB5] text-[11px] uppercase tracking-wide px-4 py-2.5 hidden lg:table-cell">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const isCredit = t.type === 'credit' || Number(t.montant) > 0
                  const cat = categorieTransaction(t.description)
                  const statut = txStatutMeta(t.statut)
                  return (
                    <tr key={t.id || i} onClick={() => setDetailTx(t)} className="cursor-pointer hover:bg-[#0B1C30] transition-colors"
                      style={{ borderBottom: i < filtered.length - 1 ? `1px solid var(--p-border)` : undefined }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cat.color + '18' }}>
                            <span style={{ color: cat.color }}>{isCredit ? <IcTrendUp /> : <IcTrendDown />}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#F0EDE8] text-sm truncate">{t.description || (isCredit ? 'Crédit' : 'Débit')}</p>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: cat.color + '15', color: cat.color }}>{cat.label}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="font-mono text-xs text-[#8A9BB5]">{t.reference || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-sm" style={{ color: isCredit ? '#22C55E' : '#EF4444' }}>
                          {isCredit ? '+' : '-'}{Math.abs(Number(t.montant)).toLocaleString('fr-FR')} F
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-[#8A9BB5]">{new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: statut.color + '18', color: statut.color }}>{statut.label}</span>
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
      {detailTx && <TransactionDetailModal t={detailTx} onClose={() => setDetailTx(null)} />}
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
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-8">
      <div className="xl:max-w-4xl xl:mx-auto">
        <div className="mb-5">
          <p className="text-lg font-bold text-[#F0EDE8]">Mes espaces &amp; rôles</p>
          <p className="text-sm text-[#8A9BB5] mt-0.5">Basculez entre vos espaces ou activez-en un nouveau — jusqu'à 3 rôles actifs simultanément.</p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl mb-4" style={{ background: '#EF444414', border: '1px solid #EF444430' }}>
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="px-4 py-3 rounded-xl flex items-center gap-2 mb-4" style={{ background: '#22C55E14', border: '1px solid #22C55E30' }}>
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ordered.map(r => {
            const isActiveNow = r.key === activeRole
            const isPrincipal = r.key === rolePrincipal
            const isActif = actifs.includes(r.key)
            const isDisponible = !isActif
            // Un propriétaire ne peut lui-même s'ajouter que l'espace démarcheur
            // (même restriction métier que ManageRolesScreen côté mobile,
            // activatableRoles=['demarcheur'] pour un rôle principal propriétaire)
            // — prospect/locataire restent visibles mais non auto-activables ici.
            const isActivable = isDisponible && (rolePrincipal !== 'proprietaire' || r.key === 'demarcheur')
            const busy = loadingRole === r.key
            const statusLabel = isActiveNow ? 'Espace actuel' : isPrincipal ? 'Rôle principal' : isActif ? 'Actif' : null

            return (
              <div key={r.key} className="rounded-2xl overflow-hidden bg-[#112440] transition-shadow hover:shadow-md"
                style={{
                  border: isActiveNow ? `1.5px solid ${r.color}` : '1px solid rgba(0,0,0,0.07)',
                  boxShadow: isActiveNow ? `0 4px 16px ${r.color}25` : '0 1px 3px rgba(0,0,0,0.03)',
                }}>
                <div className="p-4 flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isDisponible ? '#1A3355' : `linear-gradient(135deg, ${r.color}, ${shade(r.color, 0.3)})`,
                      color: isDisponible ? '#8A93A3' : '#fff',
                      boxShadow: isDisponible ? undefined : `0 4px 10px ${r.color}40`,
                    }}>
                    <MaskIcon role={r.key} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-[#F0EDE8] text-sm">{r.label}</p>
                      {statusLabel && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: isActiveNow ? r.color : r.color + '18', color: isActiveNow ? '#fff' : r.color }}>
                          {statusLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#8A9BB5] mt-0.5 leading-relaxed">{r.desc}</p>
                  </div>
                </div>

                <div className="px-4 pb-4 flex gap-2">
                  {isActivable ? (
                    <button onClick={() => setActivating(activating === r.key ? null : r.key)} disabled={actifs.length >= 3}
                      className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold disabled:opacity-40 transition-opacity hover:opacity-90"
                      style={{ background: r.color }}>
                      Activer ce rôle
                    </button>
                  ) : isDisponible ? (
                    <p className="flex-1 py-2.5 text-center text-[11px] text-[#8A9BB5]">Non disponible pour un compte propriétaire</p>
                  ) : (
                    <>
                      {!isActiveNow && (
                        <button onClick={() => goToRoleSpace(r.key)}
                          className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-opacity hover:opacity-80"
                          style={{ background: r.color + '18', color: r.color }}>
                          Accéder à cet espace
                        </button>
                      )}
                      {!isPrincipal && (
                        <button onClick={() => desactiverRole(r.key)} disabled={busy}
                          className={`${isActiveNow ? 'flex-1' : ''} py-2.5 px-3 rounded-xl text-xs font-bold border disabled:opacity-50`}
                          style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444', background: 'rgba(239,68,68,0.06)' }}>
                          {busy ? '…' : 'Désactiver'}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {activating === r.key && (
                  <div className="mx-4 mb-4 px-4 pt-3 pb-4 rounded-xl space-y-3" style={{ background: 'var(--p-card)', border: `1px solid var(--p-border)` }}>
                    <p className="text-sm font-semibold text-[#F0EDE8]">Justification (optionnelle)</p>
                    <textarea value={justif} onChange={e => setJustif(e.target.value)} rows={2}
                      placeholder="Ex: Je souhaite aussi proposer des biens à la vente"
                      className="w-full border border-[#1A3355] rounded-xl px-3 py-2.5 text-sm outline-none resize-none focus:border-[#4B6BFF] bg-[#0B1C30] text-[#F0EDE8] placeholder:text-[#8A9BB5]" />
                    <div className="flex gap-2">
                      <button onClick={() => setActivating(null)} className="flex-1 py-2.5 rounded-xl border border-[#1A3355] text-sm font-semibold text-[#8A9BB5] bg-[#0B1C30]">Annuler</button>
                      <button onClick={() => activerRole(r.key)} disabled={busy}
                        className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60"
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
    </div>
  )
}

function ProfilTab({ user, biens, visites, onOpenTransactions, onOpenRoles, onScrolled }: { user: any; biens: any[]; visites: any[]; onOpenTransactions: () => void; onOpenRoles: () => void; onScrolled?: (v: boolean) => void }) {
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

  const visitesConfirmees = visites.filter(v => v.statut === 'confirmee').length
  const visitesEnAttente = visites.filter(v => v.statut === 'en_attente').length
  const visitesEffectuees = visites.filter(v => v.statut === 'effectuee').length

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null

  const kpis = [
    { label: 'Score', value: `${Math.round(score)}`, color: BLUE },
    { label: 'Occupation', value: `${tauxOccupation}%`, color: '#16A34A' },
    { label: 'Publiés', value: `${tauxPublication}%`, color: '#F59E0B' },
  ]

  const menuItems = [
    { icon: <IcEdit />, label: 'Modifier le profil', color: BLUE, onClick: () => setEditOpen(true) },
    { icon: <IcShield />, label: 'Changer le mot de passe', color: '#7B2FBE', onClick: () => setPasswordOpen(true) },
    { icon: <IcPerson />, label: 'Gérer mes rôles', color: '#F59E0B', onClick: onOpenRoles },
    { icon: <IcPayments />, label: 'Historique des transactions', color: '#16A34A', onClick: onOpenTransactions },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: 'var(--p-deep)' }}>
      <div className="flex-1 overflow-y-auto pb-10"
        onScroll={e => onScrolled?.(e.currentTarget.scrollTop > 50)}>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="px-5 pt-4 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-1" style={{ color: 'var(--p-muted)' }}>COMPTE</p>
            <h2 className="text-[24px] font-black tracking-tight" style={{ color: 'var(--p-text)' }}>Mon profil</h2>
          </div>

          <div className="px-4 space-y-3">
            {/* Carte hero — version claire du gradient mobile [#0D1117→#1A1F5E→#0F3460] */}
            <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(99,102,241,0.14)' }}>
              <div className="relative px-5 pt-5 pb-7"
                style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 55%, #DBEAFE 100%)' }}>
                {/* Cercles décoratifs */}
                <div className="absolute top-0 right-0 w-52 h-52 rounded-full pointer-events-none"
                  style={{ background: 'rgba(99,102,241,0.08)', transform: 'translate(35%, -35%)' }} />
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full pointer-events-none"
                  style={{ background: 'rgba(59,130,246,0.07)', transform: 'translate(-35%, 35%)' }} />
                {/* Badge rôle */}
                <div className="flex justify-end mb-5">
                  <span className="px-3 py-1.5 rounded-full text-[11px] font-bold"
                    style={{ background: 'rgba(99,102,241,0.14)', color: '#3730A3' }}>Propriétaire</span>
                </div>
                {/* Avatar + infos */}
                <div className="flex flex-col items-center text-center">
                  {user?.photo_profil
                    ? <img src={user.photo_profil} alt="" className="w-20 h-20 rounded-2xl object-cover shadow-lg mb-3"
                        style={{ border: '3px solid rgba(255,255,255,0.9)' }} />
                    : <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #4B6BFF, #6366F1)', border: '3px solid rgba(255,255,255,0.9)' }}>
                        {initials}
                      </div>
                  }
                  <p className="font-black text-[19px] leading-tight" style={{ color: '#1E1B4B' }}>{user?.prenom} {user?.nom}</p>
                  <p className="text-[13px] mt-1" style={{ color: '#4338CA' }}>{user?.email || user?.telephone}</p>
                  {memberSince && (
                    <p className="text-[12px] mt-2" style={{ color: '#6366F1' }}>Membre depuis {memberSince}</p>
                  )}
                </div>
              </div>
            </div>

          {/* KPI strip */}
          <div className="flex rounded-2xl overflow-hidden"
            style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {kpis.map((k, i) => (
              <div key={k.label} className="flex-1 flex flex-col items-center justify-center py-5 px-2 text-center"
                style={{ borderLeft: i > 0 ? '1px solid var(--p-border)' : 'none' }}>
                <p className="text-[26px] font-black leading-none" style={{ color: k.color }}>{k.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1.5" style={{ color: 'var(--p-muted)' }}>{k.label}</p>
              </div>
            ))}
          </div>

          {/* Menu actions */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {menuItems.map((item, i) => (
              <button key={i} onClick={item.onClick}
                className="w-full flex items-center gap-3.5 px-4 py-4 text-left transition-colors"
                style={{ borderTop: i > 0 ? '1px solid var(--p-border)' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--p-deep)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: item.color + '14', color: item.color }}>
                  {item.icon}
                </div>
                <p className="flex-1 text-[14px] font-semibold" style={{ color: 'var(--p-text)' }}>{item.label}</p>
                <span style={{ color: 'var(--p-muted)' }}><IcChevron /></span>
              </button>
            ))}
          </div>

          {/* Visites */}
          <div className="rounded-2xl p-4" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-4" style={{ color: 'var(--p-muted)' }}>MES RÉSERVATIONS</p>
            <div className="flex">
              {[
                { label: 'Total', value: visites.length, color: BLUE },
                { label: 'Confirmées', value: visitesConfirmees, color: '#16A34A' },
                { label: 'En attente', value: visitesEnAttente, color: '#F59E0B' },
                { label: 'Effectuées', value: visitesEffectuees, color: '#7B2FBE' },
              ].map((s, i) => (
                <div key={s.label} className="flex-1 min-w-0 flex flex-col items-center justify-center"
                  style={{ borderLeft: i > 0 ? '1px solid var(--p-border)' : 'none' }}>
                  <p className="text-[22px] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide mt-1.5 truncate px-1 text-center" style={{ color: 'var(--p-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Biens */}
          <div className="rounded-2xl p-4" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-4" style={{ color: 'var(--p-muted)' }}>MES BIENS</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total', value: biens.length, color: BLUE },
                { label: 'Publiés', value: approuves, color: '#16A34A' },
                { label: 'Occupés', value: biensOccupes, color: '#F59E0B' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center justify-center py-3 rounded-xl"
                  style={{ background: s.color + '0E' }}>
                  <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: 'var(--p-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>
            {user?.nb_etoiles != null && (
              <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--p-border)' }}>
                <span style={{ color: '#F59E0B' }}><IcStar /></span>
                <p className="text-[13px] font-bold" style={{ color: 'var(--p-text)' }}>
                  {user.nb_etoiles} étoile{user.nb_etoiles !== 1 ? 's' : ''}
                </p>
                <p className="text-[12px]" style={{ color: 'var(--p-muted)' }}>note moyenne clients</p>
              </div>
            )}
          </div>

          {/* Déconnexion */}
          <button onClick={() => { logout(); navigate('/login') }}
            className="w-full py-4 rounded-2xl font-bold text-[15px] transition-all"
            style={{ background: '#FFF0F0', color: '#EF4444', border: '1px solid #EF444422' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FFE4E4')}
            onMouseLeave={e => (e.currentTarget.style.background = '#FFF0F0')}>
            Se déconnecter
          </button>
          </div>{/* /space-y-3 */}
        </div>{/* /max-w-2xl */}
      </div>{/* /overflow-y-auto */}
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ProprietaireDashboard() {
  const { user: authUser, logout, rolesActifs, activeRole, setActiveRole } = useAuth()
  const { unreadMessages, unreadAlertes, refresh: refreshNotifications } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const [isDark, setIsDark] = useState(false)
  const fromDetail = !!(location.state as any)?.fromDetail
  const [isScrolled, setIsScrolled] = useState(fromDetail)
  const [menuOpen, setMenuOpen] = useState(false)
  const tabMounted = useRef(false)
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
  const goToRoleSpace = (role: string) => {
    setActiveRole(role)
    navigate(ROLE_ROUTES[role] || '/')
  }
  const [tab, setTab] = useState<Tab>((location.state as any)?.tab ?? 'tableau')
  // Ignore le premier montage : isScrolled est déjà à la bonne valeur initiale
  // (pill si on vient du détail, false sinon). Les changements de tab suivants
  // remettent bien à zéro.
  useEffect(() => {
    if (!tabMounted.current) { tabMounted.current = true; return }
    setIsScrolled(false)
    setMenuOpen(false)
  }, [tab])

  // Animation pill → pleine largeur à l'arrivée depuis la page détail
  useEffect(() => {
    if (!fromDetail) return
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsScrolled(false))
    })
    return () => cancelAnimationFrame(id)
  }, [])
  const carousel2Ref = useRef<HTMLDivElement>(null)
  const [carousel2Paused, setCarousel2Paused] = useState(false)
  const [carousel2Idx, setCarousel2Idx] = useState(0)

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

  useEffect(() => {
    if (carousel2Paused || biens.length === 0) return
    const id = setInterval(() => {
      const el = carousel2Ref.current
      if (!el || carousel2Paused) return
      const count = Math.min(5, biens.length)
      const cardW = el.scrollWidth / count
      const maxScroll = el.scrollWidth - el.clientWidth
      const isAtEnd = el.scrollLeft + cardW >= maxScroll - 1
      const next = isAtEnd ? 0 : el.scrollLeft + cardW
      el.scrollTo({ left: next, behavior: 'smooth' })
      setCarousel2Idx(isAtEnd ? 0 : Math.round(next / cardW))
    }, 3500)
    return () => clearInterval(id)
  }, [carousel2Paused, biens.length])

  const me = user || authUser
  const initials = `${me?.prenom?.[0] || ''}${me?.nom?.[0] || ''}`.toUpperCase()
  const score = me?.score_credibilite ?? 100
  const approuves = biens.filter(b => b.statut_moderation === 'approuve').length
  const enAttente = biens.filter(b => b.statut_moderation === 'en_attente').length
  const rejetes   = biens.filter(b => b.statut_moderation === 'rejete').length
  const reservationsEnAttente = visites.filter(v => v.statut === 'en_attente').length
  const totalVues = biens.reduce((s, b) => s + (b.nb_consultations || 0), 0)

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

  // Alerte loyers — réutilise les données déjà chargées (loyersDash), sans
  // appel réseau supplémentaire ; masquée si rien à signaler.
  const loyersDashList = (loyersDash?.contrats || []).flatMap((c: any) => c.loyers || [])
  const loyersEnRetardCount = loyersDash?.stats?.loyers_en_retard ?? loyersDashList.filter((l: any) => l.statut === 'en_retard').length
  const loyersImpayesCount = loyersDashList.filter((l: any) => l.statut === 'impaye').length

  const biensOccupes = biens.filter(b => b.statut === 'occupe').length
  const tauxOccupation = biens.length > 0 ? Math.round((biensOccupes / biens.length) * 100) : 0
  const biensApprouves = biens.filter(b => b.statut_moderation === 'approuve').length
  const biensEnAttente = biens.filter(b => b.statut_moderation === 'en_attente').length
  const biensRejetes   = biens.filter(b => b.statut_moderation === 'rejete').length

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div className={`proprio-root${isDark ? '' : ' proprio-light'} flex flex-col h-full`}
      style={{ background: 'var(--p-deep)' }}>

      {/* ── Navbar animée (HeroHeader pattern) ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 pointer-events-none transition-[padding] duration-300${isScrolled ? ' px-2' : ''}`}>
        <nav
          className="mx-auto pointer-events-auto border backdrop-blur-xl transition-all duration-300"
          style={{
            background: isScrolled ? 'var(--p-surface-glass)' : 'var(--p-surface)',
            borderColor: 'var(--p-border)',
            borderBottomWidth: isScrolled ? '1px' : '1px',
            borderTopWidth: isScrolled ? '1px' : '0px',
            borderLeftWidth: isScrolled ? '1px' : '0px',
            borderRightWidth: isScrolled ? '1px' : '0px',
            borderRadius: isScrolled ? '1rem' : '0px',
            marginTop: isScrolled ? '8px' : '0px',
            maxWidth: isScrolled ? '72rem' : '100%',
            paddingLeft: isScrolled ? '1rem' : '0.75rem',
            paddingRight: isScrolled ? '1rem' : '0.75rem',
            boxShadow: isScrolled ? '0 8px 32px rgba(0,0,0,0.14)' : '0 1px 0 rgba(212,168,71,0.15)',
          }}>
          <div className="flex items-center gap-3 py-3">

            {/* Logo */}
            <button onClick={() => { setTab('tableau'); setIsScrolled(false) }} className="flex items-center gap-2 flex-shrink-0">
              <img src={logoUrl} alt="REFUGE" className="w-8 h-8 rounded-[8px] object-contain" />
              <span className="hidden sm:block font-black text-[13px] tracking-tight" style={{ color: BLUE }}>REFUGE</span>
            </button>

            {/* Nav tabs — desktop */}
            <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
              {NAV_ITEMS.map(item => {
                const active = tab === item.key
                const badge = item.key === 'messages' ? unreadMessages : item.key === 'reservations' ? reservationsEnAttente : 0
                return (
                  <button key={item.key}
                    onClick={() => { setTab(item.key); setIsScrolled(false); if (item.key === 'messages') refreshNotifications() }}
                    className="relative whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.1em] px-3 py-2 rounded-lg"
                    style={{
                      ...(active ? { color: BLUE, background: BLUE + '14' } : { color: 'var(--p-muted)' }),
                      minHeight: '36px',
                      transition: 'color 0.2s ease, background 0.2s ease',
                    }}>
                    {item.label}
                    {badge > 0 && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: '#FF3B30' }} />}
                  </button>
                )
              })}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Theme toggle */}
              <button onClick={() => setIsDark(d => !d)} title={isDark ? 'Mode clair' : 'Mode sombre'} aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
                className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors"
                style={{ borderColor: 'var(--p-border)', background: 'var(--p-card)', color: BLUE, minWidth: '32px', minHeight: '32px' }}>
                {isDark
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-9h-1M4.34 12H3.34m14.66-6.34-.7.7M6.7 17.3l-.7.7m12.02.02-.7-.7M6.7 6.7 6 6m6 3a3 3 0 110 6 3 3 0 010-6z"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                }
              </button>
              {/* Alertes */}
              <button onClick={() => navigate('/notifications')} title="Alertes"
                className="relative w-8 h-8 rounded-lg flex items-center justify-center border transition-colors"
                style={{ borderColor: 'var(--p-border)', background: 'var(--p-card)', color: 'var(--p-muted)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadAlertes > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: '#FF3B30' }} />}
              </button>
              {/* Profile + roles flyout */}
              <div className="relative" onMouseEnter={() => openRolesMenu('topbar')} onMouseLeave={scheduleCloseRolesMenu}>
                <button onClick={() => setTab('profil')}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 border transition-colors"
                  style={{ borderColor: 'var(--p-border)', background: 'var(--p-card)' }}>
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: BLUE }}>
                    {loading ? '…' : initials}
                  </div>
                  <span className="hidden lg:block text-[13px] font-semibold truncate max-w-[96px]" style={{ color: 'var(--p-text)' }}>
                    {loading ? '…' : me?.prenom || ''}
                  </span>
                </button>
                {rolesMenuOpen === 'topbar' && rolesActifs.length > 1 && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border py-1.5 z-30"
                    style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
                    onMouseEnter={() => openRolesMenu('topbar')} onMouseLeave={scheduleCloseRolesMenu}>
                    <p className="px-3.5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-muted)' }}>Mes espaces</p>
                    {rolesActifs.map(r => (
                      <button key={r} onClick={() => goToRoleSpace(r)}
                        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm text-left transition-colors"
                        style={{ color: r === activeRole ? BLUE : 'var(--p-text)', fontWeight: r === activeRole ? 700 : 500 }}>
                        {ROLE_LABELS[r] || r}
                        {r === activeRole && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: BLUE + '22', color: BLUE }}>Actuel</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Logout — desktop */}
              <button onClick={() => { logout(); navigate('/login') }} title="Déconnexion"
                className="hidden xl:flex w-8 h-8 rounded-lg items-center justify-center border transition-colors"
                style={{ borderColor: 'var(--p-border)', background: 'var(--p-card)', color: '#EF4444' }}>
                <IcLogout />
              </button>
              {/* Hamburger — mobile */}
              <button onClick={() => setMenuOpen(o => !o)}
                className="xl:hidden w-8 h-8 rounded-lg flex items-center justify-center border"
                style={{ borderColor: 'var(--p-border)', background: 'var(--p-card)', color: 'var(--p-muted)' }}>
                <div style={{ width: 18, height: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <motion.span animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }} transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }} style={{ display: 'block', height: 2, borderRadius: 2, background: 'currentColor', transformOrigin: 'center' }} />
                  <motion.span animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }} transition={{ duration: 0.22, ease: 'easeInOut' }} style={{ display: 'block', height: 2, borderRadius: 2, background: 'currentColor' }} />
                  <motion.span animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }} transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }} style={{ display: 'block', height: 2, borderRadius: 2, background: 'currentColor', transformOrigin: 'center' }} />
                </div>
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          <AnimatePresence initial={false}>
            {menuOpen && (
              <motion.div
                className="xl:hidden overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="border-t pb-4 pt-3" style={{ borderColor: 'var(--p-border)' }}>
                  <div className="grid grid-cols-4 gap-1">
                    {NAV_ITEMS.map(item => {
                      const active = tab === item.key
                      return (
                        <button key={item.key}
                          onClick={() => { setTab(item.key); setMenuOpen(false); setIsScrolled(false); if (item.key === 'messages') refreshNotifications() }}
                          className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-[11px] font-medium transition-all"
                          style={active ? { color: BLUE, background: BLUE + '14', fontWeight: 700 } : { color: 'var(--p-muted)' }}>
                          {item.icon}
                          <span className="truncate w-full text-center px-1">{item.label}</span>
                        </button>
                      )
                    })}
                    <button onClick={() => { logout(); navigate('/login') }}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-[11px] font-medium"
                      style={{ color: '#EF4444' }}>
                      <IcLogout />
                      <span>Quitter</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{ paddingTop: '4rem' }}>
        <div className="flex-1 overflow-hidden flex flex-col">
        {tab === 'tableau' && (
          <div className="flex-1 overflow-y-auto overflow-x-hidden" onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 50)}>
            {/* ── Hero photo ── */}
            <div className="relative overflow-hidden" style={{ minHeight: '380px' }}>
              <img src={villaImg} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center 30%' }} />
              {/* Dégradé sombre — lisibilité texte + fondu vers le fond */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(6,13,26,0.45) 0%, rgba(6,13,26,0.72) 50%, #060D1A 100%)' }} />
              {/* Accent gold ambiant en haut-gauche */}
              <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: BLUE }} />

              <div className="relative px-5 md:px-8 xl:px-10 pt-10 pb-12">
                {/* Eyebrow */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px w-6" style={{ background: '#fff' }} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.32em]" style={{ color: '#fff' }}>Espace propriétaire</p>
                </div>

                <h1 className="text-[32px] md:text-[40px] font-black tracking-tight leading-[1.1] text-white">
                  Bonjour{me?.prenom ? `,` : ''}<br />
                  {me?.prenom && <span style={{ color: '#fff' }}>{me.prenom}</span>}
                  {!me?.prenom && <span style={{ color: '#fff' }}>Propriétaire</span>}
                </h1>
                <p className="text-[12px] mt-2.5 text-white/50 font-medium">
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>

                {/* Mini stats pills glassmorphic */}
                <div className="flex gap-3 mt-7 overflow-x-auto scrollbar-hide pb-0.5">
                  {[
                    { icon: <IcHome />, value: `${biens.length}`, label: 'Biens', color: BLUE },
                    { icon: <IcStar />, value: `${me?.nb_etoiles ?? 0}`, label: 'Étoiles', color: '#F59E0B' },
                    { icon: <IcShield />, value: `${score}`, label: 'Score', color: '#22C55E' },
                    { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><circle cx="12" cy="12" r="3"/></svg>, value: `${totalVues}`, label: 'Vues', color: '#A78BFA' },
                  ].map(s => (
                    <div key={s.label} className="flex-shrink-0 flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3"
                      style={{ background: 'rgba(6,13,26,0.55)', border: `1px solid ${BLUE}28`, backdropFilter: 'blur(16px)', minWidth: '68px', minHeight: '44px' }}>
                      <span style={{ color: s.color }}>{s.icon}</span>
                      <p className="font-black text-[18px] leading-none text-white">{s.value}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Contenu sous le hero ── */}
            <div className="px-5 md:px-8 xl:px-10 py-6">
              <AnimatedGroup
                preset="blur-slide"
                stagger={0.08}
                variants={{
                  container: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } },
                  item: { hidden: { opacity: 0, scale: 0.92, y: 16 }, visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } },
                }}>

              {/* Alert loyers */}
              {(loyersImpayesCount > 0 || loyersEnRetardCount > 0) && (
                <button onClick={() => setTab('loyers')} aria-label="Voir les loyers en retard"
                  className="w-full flex items-center gap-3 rounded-2xl mb-5 p-4 border text-left cursor-pointer"
                  style={{ background: '#F4433608', borderColor: '#F4433628', transition: 'transform 200ms ease, box-shadow 200ms ease', minHeight: '56px' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.01)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(244,67,54,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F4433618' }}>
                    <span style={{ color: '#F44336' }}><IcClock /></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: 'var(--p-text)' }}>
                      {loyersImpayesCount > 0 && `${loyersImpayesCount} loyer${loyersImpayesCount > 1 ? 's' : ''} impayé${loyersImpayesCount > 1 ? 's' : ''}`}
                      {loyersImpayesCount > 0 && loyersEnRetardCount > 0 && ' · '}
                      {loyersEnRetardCount > 0 && `${loyersEnRetardCount} en retard`}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--p-muted)' }}>Nécessite votre attention</p>
                  </div>
                  <span style={{ color: 'var(--p-muted)' }}><IcChevron /></span>
                </button>
              )}

              {/* ── Actions rapides — chips scrollables ── */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--p-muted)' }}>Actions rapides</p>
                <LiveIndicator label={lastUpdatedLabel} refreshing={refreshing} />
              </div>
              <div className="flex gap-2.5 mb-7 overflow-x-auto scrollbar-hide pb-1">
                {[
                  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>, color: BLUE, label: 'Nouveau bien', action: () => navigate('/nouveau-bien') },
                  { icon: <IcCal />, color: '#4B6BFF', label: 'Réservations', badge: reservationsEnAttente, action: () => setTab('reservations') },
                  { icon: <IcPayments />, color: '#22C55E', label: 'Loyers', badge: loyersImpayesCount + loyersEnRetardCount, action: () => setTab('loyers') },
                  { icon: <IcMessagesNav />, color: '#FF6B35', label: 'Messages', badge: unreadMessages, action: () => { setTab('messages'); refreshNotifications() } },
                  { icon: <IcWallet />, color: '#A78BFA', label: 'Portefeuille', action: () => setTab('portefeuille') },
                ].map(q => (
                  <button key={q.label} onClick={q.action} aria-label={q.label}
                    className="relative flex-shrink-0 flex items-center gap-2.5 rounded-full px-4 py-2.5"
                    style={{ background: q.color + '12', border: `1.5px solid ${q.color}30`, minHeight: '44px', transition: 'all 180ms ease' }}
                    onMouseEnter={e => { e.currentTarget.style.background = q.color + '22'; e.currentTarget.style.boxShadow = `0 4px 16px ${q.color}25` }}
                    onMouseLeave={e => { e.currentTarget.style.background = q.color + '12'; e.currentTarget.style.boxShadow = '' }}>
                    <span style={{ color: q.color }}>{q.icon}</span>
                    <span className="text-[12px] font-semibold whitespace-nowrap" style={{ color: 'var(--p-text)' }}>{q.label}</span>
                    {(q.badge ?? 0) > 0 && (
                      <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black text-white" style={{ background: '#FF3B30' }}>
                        {(q.badge ?? 0) > 9 ? '9+' : q.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ── Carte portefeuille biens — PropertyStatsCard ── */}
              <div className="sticky top-0 z-10 flex items-center justify-between py-2 mb-2 -mx-1 px-1" style={{ background: 'var(--p-deep)' }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--p-muted)' }}>Mes biens</p>
                <span className="text-[13px] font-black" style={{ color: BLUE }}>{biens.length}</span>
              </div>
              <div className="mb-5 mx-auto w-full px-2" style={{ maxWidth: '72rem' }}>
                <PropertyStatsCard
                  title="Mes biens"   
                  total={biens.length}
                  dark={isDark}
                  stats={[
                    { label: 'Total',       value: biens.length,   color: BLUE      },
                    { label: 'Publiés',     value: biensApprouves, color: '#22C55E' },
                    { label: 'En attente',  value: biensEnAttente, color: '#F59E0B' },
                    { label: 'Rejetés',     value: biensRejetes,   color: '#EF4444' },
                  ]}
                />
              </div>

              {/* Activité — visites + occupation */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-20 mb-7">
                {[
                  {
                    label: 'Visites ce mois',
                    value: `${visitesMoisActuel}`,
                    sub: hasVisites && visitesTrendPct !== undefined
                      ? `${visitesTrendPct >= 0 ? '↑' : '↓'} ${Math.abs(visitesTrendPct)}% vs mois dernier`
                      : 'ce mois',
                    subColor: hasVisites && visitesTrendPct !== undefined
                      ? (visitesTrendPct >= 0 ? '#22C55E' : '#EF4444')
                      : undefined,
                    color: '#7B2FBE',
                    icon: <IcCal />,
                  },
                  {
                    label: "Taux d'occupation",
                    value: `${tauxOccupation}%`,
                    sub: `${biensOccupes} / ${biens.length} biens`,
                    color: '#22C55E',
                    icon: <IcHome />,
                  },
                ].map(card => (
                  <div key={card.label}>
                    <div className="flex flex-col items-center text-center rounded-2xl px-5 py-4 sm:px-8 sm:py-5 flex-shrink-0 w-[42vw] sm:w-auto"
                      style={{
                        background: 'var(--p-card)',
                        border: '1px solid var(--p-border)',
                        boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)',
                      }}>
                      <span className="flex items-center justify-center w-10 h-10 rounded-full mb-2.5 flex-shrink-0"
                        style={{ background: card.color + '18', color: card.color }}>
                        {card.icon}
                      </span>
                      <p className="font-black text-[26px] leading-none mb-1" style={{ color: card.color }}>
                        {card.value}
                      </p>
                      <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--p-muted)' }}>
                        {card.label}
                      </p>
                      {card.sub && (
                        <p className="text-[10px]" style={{ color: card.subColor ?? 'var(--p-muted)' }}>
                          {card.sub}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── 5 derniers biens en carousel ── */}
              {biens.length > 0 && (() => {
                const recentBiens = [...biens]
                  .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                  .slice(0, 5)
                return (
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--p-muted)' }}>Mes biens récents</p>
                      <button onClick={() => setTab('biens')} className="text-xs font-bold" style={{ color: BLUE }}>Voir tout →</button>
                    </div>
                    <div
                      ref={carousel2Ref}
                      className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
                      onMouseEnter={() => setCarousel2Paused(true)}
                      onMouseLeave={() => setCarousel2Paused(false)}
                    >
                      {recentBiens.map(b => {
                        const { label: sLabel, color: sColor } = statutBien(b.statut_moderation || 'en_attente')
                        const loc = b.localisation
                        const adresse = loc ? `${loc.quartier ? loc.quartier + ', ' : ''}${loc.ville || ''}` : '—'
                        const cover = b.photos?.find((p: any) => p.is_cover) || b.photos?.[0]
                        const compo = bienComposition(b)
                        return (
                          <div
                            key={b.id}
                            className="flex-shrink-0 snap-start group rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1"
                            style={{ width: 'calc(33.333% - 14px)', background: 'var(--p-card)', border: '1px solid var(--p-border)' }}
                            onClick={() => navigate(`/proprietaire/biens/${b.id}`, { state: { fromDashboard: true } })}
                            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(75,107,255,0.14)'}
                            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = ''}
                          >
                            <div className="relative overflow-hidden" style={{ height: 160 }}>
                              {cover?.url
                                ? <img src={cover.url} alt={bienLabel(b)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                : <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, #1a2a4a, ${BLUE}30)` }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={1.2} className="w-10 h-10 opacity-40"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                                  </div>
                              }
                              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)' }} />
                              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: sColor }}>{sLabel}</span>
                              <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(0,0,0,0.50)', color: '#fff' }}>
                                {b.transaction === 'location' ? 'À louer' : 'À vendre'}
                              </span>
                              <div className="absolute bottom-3 left-3 right-3">
                                <p className="text-white font-black text-[15px] leading-none drop-shadow">
                                  {fmtPrix(b.prix)}{b.transaction === 'location' && <span className="text-[11px] font-normal text-white/70"> /mois</span>}
                                </p>
                              </div>
                            </div>
                            <div className="p-3">
                              <p className="font-bold text-[14px] leading-tight mb-1.5 truncate" style={{ color: 'var(--p-text)' }}>{bienLabel(b)}</p>
                              <div className="flex items-center gap-1 mb-2">
                                <span style={{ color: 'var(--p-muted)' }}><IcPin /></span>
                                <span className="text-xs truncate" style={{ color: 'var(--p-muted)' }}>{adresse}</span>
                              </div>
                              {compo && (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--p-border)', color: 'var(--p-muted)' }}>{compo}</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {recentBiens.length > 3 && (
                      <div className="flex justify-center gap-2 mt-4">
                        {recentBiens.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              const el = carousel2Ref.current
                              if (!el) return
                              const cardW = el.scrollWidth / recentBiens.length
                              el.scrollTo({ left: cardW * i, behavior: 'smooth' })
                              setCarousel2Idx(i)
                            }}
                            style={{ width: carousel2Idx === i ? 20 : 8, height: 8, borderRadius: 4, background: carousel2Idx === i ? '#4B6BFF' : 'rgba(75,107,255,0.25)', transition: 'all 0.3s ease', border: 'none', cursor: 'pointer', padding: 0 }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}

              </AnimatedGroup>
              <div className="h-24 xl:h-8" />
            </div>
          </div>
        )}
        {tab === 'biens'        && <MesBiensTab onScrolled={setIsScrolled} />}
        {tab === 'reservations' && <ReservationsTab biens={biens} onScrolled={setIsScrolled} />}
        {tab === 'messages'     && <MessagesTab />}
        {tab === 'loyers'       && <LoyersTab onScrolled={setIsScrolled} />}
        {tab === 'portefeuille' && <PortefeuilleTab onOpenTransactions={() => setTab('transactions')} />}
        {tab === 'transactions' && <TransactionsTab />}
        {tab === 'roles'        && <RolesTab />}
        {tab === 'profil'       && <ProfilTab user={me} biens={biens} visites={visites} onOpenTransactions={() => setTab('transactions')} onOpenRoles={() => setTab('roles')} onScrolled={setIsScrolled} />}
      </div>

      </div>

      {/* FAB */}
      {(tab === 'tableau' || tab === 'biens') && (
        <div className="xl:hidden fixed bottom-20 right-4 md:bottom-24 md:right-8 z-20">
          <button onClick={() => navigate('/nouveau-bien')}
            className="flex items-center gap-2 px-5 py-3.5 rounded-full font-bold shadow-lg active:scale-95 md:hover:-translate-y-0.5 transition-transform"
            style={{ background: 'linear-gradient(135deg, #4B6BFF, #3A5AEE)', color: '#fff', boxShadow: '0 4px 15px rgba(75,107,255,0.45)' }}>
            <IcPlus /> Nouveau bien
          </button>
        </div>
      )}

      {/* Bottom Nav — fixed, mobile & tablet */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div style={{ background: 'var(--p-surface)', borderTop: '1px solid var(--p-border)', boxShadow: '0 -4px 24px rgba(0,0,0,0.30)' }}>
          <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
            {TABS.map(t => {
              const active = tab === t.key
              const badge = t.key === 'messages' ? unreadMessages : 0
              return (
                <button key={t.key} onClick={() => { setTab(t.key); if (t.key === 'messages') refreshNotifications() }}
                  className="relative flex items-center gap-1.5 px-2 py-2 rounded-[14px] transition-all"
                  style={active ? { background: BLUE + '14' } : {}}>
                  <span className="relative" style={{ color: active ? BLUE : 'var(--p-muted)' }}>
                    {t.icon}
                    {badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-bold text-white" style={{ background: '#FF3B30' }}>
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </span>
                  {active && <span className="text-xs font-bold" style={{ color: BLUE }}>{t.label}</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
