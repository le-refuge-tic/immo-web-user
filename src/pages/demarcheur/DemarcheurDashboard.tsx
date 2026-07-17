import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { biensApi } from '../../api/biensApi'
import { visitesApi } from '../../api/visitesApi'
import { userApi } from '../../api/userApi'
import { walletApi } from '../../api/walletApi'
import { delegationApi } from '../../api/delegationApi'

// ─── Icons ────────────────────────────────────────────────────────────────────
const IcDash    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
const IcHome    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
const IcCal     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
const IcPerson  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
const IcPlus    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
const IcVerif   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
const IcShield  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
const IcEye     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
const IcStar    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
const IcPin     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
const IcTrash   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
const IcRefresh = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
const IcChat    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
const IcUpload  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
const IcChevron = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
const IcWallet  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>

// ─── Constants ────────────────────────────────────────────────────────────────
const PURPLE      = '#9B59B6'
const DARK_PURPLE = '#4A0E8F'
const MID_PURPLE  = '#7B2FBE'

type Tab = 'tableau' | 'biens' | 'reservations' | 'portefeuille' | 'profil' | 'delegations'

const DELEG_STATUT: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente',  color: '#F59E0B' },
  active:     { label: 'Active',      color: '#22C55E' },
  revoquee:   { label: 'Révoquée',    color: '#EF4444' },
  expiree:    { label: 'Expirée',     color: '#9CA3AF' },
  refusee:    { label: 'Refusée',     color: '#EF4444' },
}

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'tableau',      label: 'Tableau',      icon: <IcDash /> },
  { key: 'biens',        label: 'Mes biens',    icon: <IcHome /> },
  { key: 'reservations', label: 'Réservations', icon: <IcCal /> },
  { key: 'portefeuille', label: 'Portefeuille', icon: <IcWallet /> },
  { key: 'profil',       label: 'Profil',       icon: <IcPerson /> },
]

function typeLabel(t: string) {
  const m: Record<string, string> = { maison: 'Maison', appart_vide: 'Appartement vide', appart_meuble: 'Appartement meublé', terrain: 'Terrain', guesthouse: 'Guesthouse' }
  return m[t] || t
}
function fmtPrix(p: any) {
  const n = Number(p); return n >= 1000 ? `${Math.round(n / 1000)}K FCFA` : `${n} FCFA`
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
  if (s === 'effectuee')       return { label: 'Effectuée',       color: PURPLE }
  if (s === 'contre_proposee') return { label: 'Contre-proposée', color: '#E67E22' }
  return { label: 'En attente', color: '#FF9800' }
}

function QuickAction({ icon, color, label, onClick }: { icon: React.ReactNode; color: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex-1 bg-white rounded-2xl py-4 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform">
      <div className="w-11 h-11 rounded-[13px] flex items-center justify-center" style={{ background: color + '20' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <span className="text-[11px] font-semibold text-text-dark text-center leading-tight">{label}</span>
    </button>
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
    : biens.filter(b => b.statut_moderation === 'rejete')

  const del = async (id: number) => {
    if (!confirm('Supprimer ce bien ?')) return
    try { await biensApi.delete(id); load() } catch (_) {}
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="bg-white px-4 py-3 border-b border-divider flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-text-dark">{biens.length} bien{biens.length > 1 ? 's' : ''}</p>
          <div className="flex gap-2">
            <button onClick={() => navigate('/nouveau-bien')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-semibold" style={{ background: PURPLE }}>
              <IcPlus /> Ajouter
            </button>
            <button onClick={load} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: PURPLE + '15', color: PURPLE }}>
              <IcRefresh /> Actualiser
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {['Tous', 'Publié', 'En attente', 'Rejeté'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border"
              style={filter === f ? { background: PURPLE, color: '#fff', borderColor: PURPLE } : { color: '#9E9E9E', borderColor: '#E8EAED' }}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          [1,2,3].map(n => <div key={n} className="h-48 bg-white rounded-2xl animate-pulse mb-3" />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: PURPLE + '15' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth={1.5} className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            </div>
            <p className="font-bold text-text-dark mb-1">Aucun bien trouvé</p>
            <p className="text-sm text-text-grey mb-5">Publiez votre premier bien</p>
            <button onClick={() => navigate('/nouveau-bien')} className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm" style={{ background: PURPLE }}>
              <IcPlus /> Ajouter un bien
            </button>
          </div>
        ) : filtered.map(b => {
          const { label, color } = statutBien(b.statut_moderation || 'en_attente')
          const loc = b.localisation
          const adresse = loc ? `${loc.quartier ? loc.quartier + ', ' : ''}${loc.ville || ''}` : '—'
          const cover = b.photos?.find((p: any) => p.is_cover) || b.photos?.[0]
          return (
            <div key={b.id} className="bg-white rounded-2xl shadow-sm overflow-hidden mb-3">
              <div className="relative h-32">
                {cover?.url
                  ? <img src={cover.url} className="w-full h-full object-cover" alt="" />
                  : <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${DARK_PURPLE}cc, ${PURPLE}aa)` }}><svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} className="w-12 h-12"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg></div>
                }
                <div className="absolute inset-0 bg-black/20" />
                <span className="absolute top-3 left-3 px-2 py-1 rounded-lg text-white text-[11px] font-bold" style={{ background: color }}>{label}</span>
                <button onClick={() => del(b.id)} className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.2)' }}><IcTrash /></button>
                <span className="absolute bottom-3 left-3 text-white text-sm font-bold">{fmtPrix(b.prix)}{b.transaction === 'location' ? '/mois' : ''}</span>
              </div>
              <div className="p-3.5">
                <p className="font-bold text-text-dark text-sm">{typeLabel(b.type)}</p>
                <div className="flex items-center gap-1 mt-0.5"><span className="text-text-grey"><IcPin /></span><span className="text-xs text-text-grey">{adresse}</span></div>
                {b.statut_moderation === 'rejete' && b.motif_refus && (
                  <div className="mt-2 p-2 rounded-lg bg-danger/5 border border-danger/20"><p className="text-danger text-xs">{b.motif_refus}</p></div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab: Réservations ────────────────────────────────────────────────────────
function ReservationsTab() {
  const [visites, setVisites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Toutes')
  const [cpId, setCpId] = useState<number | null>(null)
  const [cpDate, setCpDate] = useState('')
  const [cpTime, setCpTime] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const d = await visitesApi.reservationsRecues(); setVisites(Array.isArray(d) ? d : d.data || []) } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = filter === 'Toutes' ? visites
    : filter === 'À traiter' ? visites.filter(v => v.statut === 'en_attente')
    : visites.filter(v => v.statut === 'confirmee')

  const confirmer = async (id: number) => {
    try { await visitesApi.confirmerVisite(id); load() } catch (_) {}
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
      setCpId(null); setCpDate(''); setCpTime(''); load()
    } catch (_) {}
    setSubmitting(false)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="bg-white border-b border-divider flex flex-shrink-0">
        {['Toutes', 'À traiter', 'Confirmées'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="flex-1 py-3 text-xs font-bold border-b-2 transition-colors"
            style={filter === f ? { borderColor: PURPLE, color: PURPLE } : { borderColor: 'transparent', color: '#9E9E9E' }}>
            {f}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          [1,2].map(n => <div key={n} className="h-40 bg-white rounded-2xl animate-pulse mb-3" />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: PURPLE + '15' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <p className="font-bold text-text-dark mb-1">Aucune réservation</p>
            <p className="text-sm text-text-grey text-center">Les demandes de visite apparaîtront ici</p>
          </div>
        ) : filtered.map((v, i) => {
          const { label, color } = statutVisite(v.statut)
          const nom = `${v.prospect?.prenom || ''} ${v.prospect?.nom || ''}`.trim() || 'Client'
          const init = nom.charAt(0).toUpperCase()
          const bType = typeLabel(v.bien?.type || '')
          const bLoc = v.bien?.localisation ? `${v.bien.localisation.quartier || ''} ${v.bien.localisation.ville || ''}`.trim() : '—'
          const dateStr = v.date_souhaitee ? new Date(v.date_souhaitee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
          return (
            <div key={v.id || i} className="bg-white rounded-2xl shadow-sm mb-3 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-[13px] flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${PURPLE}, ${DARK_PURPLE})` }}>{init}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-dark text-sm">{nom}</p>
                  <p className="text-xs text-text-grey">{v.prospect?.telephone || '—'}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex-shrink-0" style={{ background: color + '20', color }}>{label}</span>
              </div>
              <div className="bg-surface-g rounded-xl p-3 mb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span style={{ color: PURPLE }}><IcHome /></span>
                  <p className="text-xs font-medium text-text-dark truncate">{bType} — {bLoc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-grey"><IcCal /></span>
                  <p className="text-xs text-text-grey">Demandé pour : {dateStr}</p>
                </div>
              </div>
              {v.paiement_effectue && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-3 text-xs font-semibold" style={{ background: '#4CAF5010', borderColor: '#4CAF5030', color: '#4CAF50' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Frais de visite payés
                </div>
              )}
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold" style={{ borderColor: PURPLE + '50', color: PURPLE, background: PURPLE + '10' }}>
                  <IcChat /> Chat
                </button>
                {v.statut === 'en_attente' && <>
                  <button onClick={() => setCpId(v.id)} className="flex-1 py-2 rounded-xl border text-xs font-bold" style={{ borderColor: PURPLE + '80', color: PURPLE }}>Autre créneau</button>
                  <button onClick={() => confirmer(v.id)} className="flex-1 py-2 rounded-xl text-white text-xs font-bold" style={{ background: '#4CAF50' }}>Confirmer</button>
                </>}
                {v.statut === 'confirmee' && (
                  <button onClick={() => visitesApi.marquerEffectuee(v.id).then(load)} className="flex-1 py-2 rounded-xl text-white text-xs font-bold" style={{ background: PURPLE }}>Marquer effectuée</button>
                )}
              </div>
              {cpId === v.id && (
                <div className="mt-3 pt-3 border-t border-divider">
                  <p className="text-sm font-bold text-text-dark mb-3">Proposer un autre créneau</p>
                  <div className="space-y-2 mb-3">
                    <input type="date" value={cpDate} onChange={e => setCpDate(e.target.value)}
                      className="w-full bg-surface-g rounded-xl px-3 py-2.5 text-sm outline-none border border-divider" />
                    <input type="time" value={cpTime} onChange={e => setCpTime(e.target.value)}
                      className="w-full bg-surface-g rounded-xl px-3 py-2.5 text-sm outline-none border border-divider" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setCpId(null)} className="flex-1 py-2.5 rounded-xl border border-divider text-sm font-semibold text-text-grey">Annuler</button>
                    <button onClick={contreProposer} disabled={!cpDate || !cpTime || submitting}
                      className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: PURPLE }}>
                      {submitting ? 'Envoi…' : 'Envoyer'}
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

// ─── Tab: Portefeuille ────────────────────────────────────────────────────────
function PortefeuilleTab() {
  const [wallet, setWallet]         = useState<any>(null)
  const [transactions, setTrans]    = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [showRetrait, setShowRetrait] = useState(false)
  const [montant, setMontant]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [retraitOk, setRetraitOk]  = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [w, t] = await Promise.all([walletApi.me(), walletApi.transactions()])
      setWallet(w)
      setTrans(Array.isArray(t) ? t : t.data || [])
    } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const demanderRetrait = async () => {
    if (!montant || Number(montant) <= 0) return
    setSubmitting(true)
    try {
      await walletApi.demandeRetrait(Number(montant))
      setRetraitOk(true); setShowRetrait(false); setMontant(''); load()
    } catch (_) {}
    setSubmitting(false)
  }

  const solde = Number(wallet?.solde || 0)

  return (
    <div className="flex-1 overflow-y-auto pb-10">
      {/* Balance card */}
      <div className="mx-4 mt-5 rounded-2xl p-5 text-white" style={{ background: `linear-gradient(135deg, ${DARK_PURPLE}, ${PURPLE})`, boxShadow: `0 8px 20px ${PURPLE}4D` }}>
        <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Solde disponible</p>
        <p className="text-3xl font-bold mb-4">{loading ? '…' : solde.toLocaleString('fr-FR')} FCFA</p>
        <button onClick={() => setShowRetrait(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm"
          style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8l-8 8-8-8"/></svg>
          Demander un retrait
        </button>
      </div>

      <div className="px-4 py-5">
        {retraitOk && (
          <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>Demande de retrait envoyée avec succès.</p>
          </div>
        )}

        <p className="font-bold text-text-dark mb-4">Historique des transactions</p>
        {loading ? (
          [1,2,3].map(n => <div key={n} className="h-16 bg-white rounded-2xl animate-pulse mb-3" />)
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: PURPLE + '15' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p className="font-bold text-text-dark mb-1">Aucune transaction</p>
            <p className="text-text-grey text-sm">Vos commissions apparaîtront ici.</p>
          </div>
        ) : transactions.map((t: any, i: number) => {
          const isCredit = t.type === 'credit' || Number(t.montant) > 0
          return (
            <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl mb-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: isCredit ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={isCredit ? '#22C55E' : '#EF4444'} strokeWidth={2.5} className="w-5 h-5">
                  {isCredit
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8l-8-8-8 8"/>
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V4m8 8l-8 8-8-8"/>}
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-dark text-sm truncate">{t.description || (isCredit ? 'Crédit' : 'Débit')}</p>
                <p className="text-xs text-text-grey mt-0.5">{new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-sm" style={{ color: isCredit ? '#22C55E' : '#EF4444' }}>
                  {isCredit ? '+' : '-'}{Math.abs(Number(t.montant)).toLocaleString('fr-FR')} F
                </p>
                {t.solde_apres != null && <p className="text-[10px] text-text-grey">{Number(t.solde_apres).toLocaleString('fr-FR')} F</p>}
              </div>
            </div>
          )
        })}
      </div>

      {showRetrait && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowRetrait(false)}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(40px)' }}
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-text-dark text-lg mb-4">Demande de retrait</h3>
            <p className="text-sm text-text-grey mb-3">Solde disponible : <strong>{solde.toLocaleString('fr-FR')} FCFA</strong></p>
            <label className="block text-sm font-semibold text-text-dark mb-1.5">Montant à retirer (FCFA)</label>
            <input type="number" value={montant} onChange={e => setMontant(e.target.value)} min={1} max={solde}
              placeholder="Ex: 50000"
              className="w-full border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary mb-4 bg-surface-g" />
            <div className="flex gap-3">
              <button onClick={() => setShowRetrait(false)}
                className="flex-1 py-3.5 rounded-xl border border-divider font-bold text-sm text-text-grey">Annuler</button>
              <button onClick={demanderRetrait} disabled={submitting || !montant || Number(montant) > solde}
                className="flex-1 py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${DARK_PURPLE}, ${PURPLE})` }}>
                {submitting ? 'Envoi…' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Profil ──────────────────────────────────────────────────────────────
function DelegationsRecuesTab({ onBack }: { onBack: () => void }) {
  const [delegations, setDelegations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const d = await delegationApi.recues()
      setDelegations(Array.isArray(d) ? d : d.data || [])
    } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const repondre = async (id: number, accepter: boolean) => {
    setActingId(id)
    try { await delegationApi.repondre(id, accepter); load() } catch (_) {}
    setActingId(null)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="bg-white px-4 py-3 border-b border-divider flex items-center flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-text-grey text-sm font-semibold">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Délégations reçues
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? [1, 2].map(n => <div key={n} className="h-24 bg-white rounded-xl animate-pulse mb-3" />) : delegations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: PURPLE + '15' }}>
              <IcPerson />
            </div>
            <p className="font-bold text-text-dark mb-1">Aucune délégation</p>
            <p className="text-sm text-text-grey text-center px-6">Les propositions de gestion des propriétaires apparaîtront ici.</p>
          </div>
        ) : delegations.map(d => {
          const meta = DELEG_STATUT[d.statut] || { label: d.statut, color: '#9CA3AF' }
          return (
            <div key={d.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-text-dark text-sm">{d.proprietaire?.prenom} {d.proprietaire?.nom}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: meta.color, background: meta.color + '18' }}>{meta.label}</span>
              </div>
              <p className="text-xs text-text-grey mb-3">
                {d.bien ? `${typeLabel(d.bien.type)} — ${d.bien.localisation?.ville || ''}` : 'Tous les biens'} · {d.taux_commission_demarcheur}% commission
              </p>
              {d.statut === 'en_attente' && (
                <div className="flex gap-2">
                  <button onClick={() => repondre(d.id, true)} disabled={actingId === d.id}
                    className="flex-1 py-2 rounded-lg text-xs font-bold disabled:opacity-50" style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
                    Accepter
                  </button>
                  <button onClick={() => repondre(d.id, false)} disabled={actingId === d.id}
                    className="flex-1 py-2 rounded-lg text-xs font-bold disabled:opacity-50" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                    Refuser
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProfilTab({ user, onOpenDelegations }: { user: any; onOpenDelegations: () => void }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [cipFile, setCipFile] = useState<File | null>(null)
  const [ifuFile, setIfuFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()
  const score = user?.score_credibilite ?? 100

  const uploadCip = async () => {
    if (!cipFile) return
    setUploading(true)
    try { await userApi.uploadCip(cipFile); setCipFile(null) } catch (_) {}
    setUploading(false)
  }
  const uploadIfu = async () => {
    if (!ifuFile) return
    setUploading(true)
    try { await userApi.uploadIfu(ifuFile); setIfuFile(null) } catch (_) {}
    setUploading(false)
  }

  return (
    <div className="flex-1 overflow-y-auto pb-10">
      <div className="p-5 text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold"
          style={{ background: `linear-gradient(135deg, ${DARK_PURPLE}, ${PURPLE})` }}>{initials}</div>
        <p className="font-bold text-text-dark text-lg">{user?.prenom} {user?.nom}</p>
        <p className="text-sm text-text-grey">{user?.email || user?.telephone}</p>
      </div>

      {/* Score card */}
      <div className="px-4 mb-4">
        <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${DARK_PURPLE}, ${PURPLE})` }}>
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 rounded-xl text-white text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.15)' }}>Mon profil</span>
            <span className="text-white/70"><IcShield /></span>
          </div>
          <p className="text-white/70 text-xs mb-1">Score de crédibilité</p>
          <p className="text-white text-2xl font-bold mb-3">{score} / 100</p>
          <div className="h-1.5 rounded-full bg-white/20 mb-4"><div className="h-full rounded-full bg-white" style={{ width: `${score}%` }} /></div>
          <div className="flex">
            <div className="flex-1"><p className="text-white/60 text-[10px]">Biens</p><p className="text-white font-bold text-sm">{user?.nb_biens ?? 0}</p></div>
            <div className="w-px bg-white/20 mx-3" />
            <div className="flex-1"><p className="text-white/60 text-[10px]">Étoiles</p><p className="text-white font-bold text-sm">{user?.nb_etoiles ?? 0}</p></div>
            <div className="w-px bg-white/20 mx-3" />
            <div className="flex-1"><p className="text-white/60 text-[10px]">Pénalité</p><p className="text-white font-bold text-sm">{user?.penalite_pourcentage ?? 0}%</p></div>
          </div>
        </div>
      </div>

      {/* Vérification docs */}
      <div className="px-4 mb-4">
        <p className="font-bold text-text-dark mb-3">Vérification d'identité</p>
        <div className="space-y-3">
          {[
            { label: 'CIP (Carte d\'identité professionnelle)', file: cipFile, setFile: setCipFile, onUpload: uploadCip },
            { label: 'IFU (Identifiant Fiscal Unique)', file: ifuFile, setFile: setIfuFile, onUpload: uploadIfu },
          ].map(doc => (
            <div key={doc.label} className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-text-dark mb-3">{doc.label}</p>
              <label className="block border-2 border-dashed border-divider rounded-xl p-4 text-center cursor-pointer hover:border-primary transition-colors">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-text-grey"><IcUpload /></span>
                  <p className="text-xs text-text-grey">{doc.file ? doc.file.name : 'Cliquer pour choisir un fichier'}</p>
                </div>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => doc.setFile(e.target.files?.[0] || null)} />
              </label>
              {doc.file && (
                <button onClick={doc.onUpload} disabled={uploading}
                  className="w-full mt-2 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: PURPLE }}>
                  {uploading ? 'Envoi…' : 'Envoyer'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-2">
        {[{ label: 'Modifier le profil', to: '/profil/edit' }, { label: 'Changer le mot de passe', to: '/profil/password' }].map(item => (
          <button key={item.label} onClick={() => navigate(item.to)} className="w-full bg-white rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm">
            <span className="text-sm font-semibold text-text-dark">{item.label}</span>
            <IcChevron />
          </button>
        ))}
        <button onClick={onOpenDelegations} className="w-full bg-white rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm">
          <span className="text-sm font-semibold text-text-dark">Délégations reçues</span>
          <IcChevron />
        </button>
        <button onClick={() => { logout(); navigate('/login') }} className="w-full mt-2 py-3.5 rounded-xl text-danger font-bold text-sm border border-danger/20 bg-danger/5">
          Se déconnecter
        </button>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function DemarcheurDashboard() {
  const { user: authUser } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('tableau')
  const [user, setUser] = useState<any>(null)
  const [biens, setBiens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [u, b] = await Promise.allSettled([userApi.me(), biensApi.mesBiens()])
      if (u.status === 'fulfilled') setUser(u.value?.user || u.value)
      if (b.status === 'fulfilled') setBiens(Array.isArray(b.value) ? b.value : b.value.data || [])
    } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { loadData() }, [])

  const me = user || authUser
  const initials = `${me?.prenom?.[0] || ''}${me?.nom?.[0] || ''}`.toUpperCase()
  const score = me?.score_credibilite ?? 100

  return (
    <div className="flex flex-col h-full bg-[#F4F6FA] relative">

      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-12 pb-6" style={{ background: `linear-gradient(135deg, ${DARK_PURPLE} 0%, ${MID_PURPLE} 60%, ${PURPLE} 100%)` }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-[13px] flex items-center justify-center border flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }}>
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <span className="text-white font-bold text-sm">{initials}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-xs">Bonjour 👋</p>
            <p className="text-white font-bold text-base truncate">{loading ? '…' : `${me?.prenom || ''} ${me?.nom || ''}`.trim()}</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)' }}>
            <IcVerif />
            <span className="text-white text-[11px] font-semibold">Agent</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: <IcHome />, value: `${biens.length}`, label: 'Biens' },
            { icon: <IcEye />,  value: '--',              label: 'Vues' },
            { icon: <IcCal />,  value: '--',              label: 'Visites' },
            { icon: <IcStar />, value: `${score}`,        label: 'Score' },
          ].map(s => (
            <div key={s.label} className="rounded-xl py-2.5 px-1 text-center border"
              style={{ background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.15)' }}>
              <span className="text-white flex justify-center mb-1">{s.icon}</span>
              <p className="text-white font-bold text-base leading-none">{s.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === 'tableau' && (
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 py-5">
              <p className="text-[17px] font-bold text-text-dark mb-3.5">Actions rapides</p>
              <div className="flex gap-3 mb-7">
                <QuickAction icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>} color={PURPLE} label="Nouveau bien" onClick={() => navigate('/nouveau-bien')} />
                <QuickAction icon={<IcCal />} color="#4B6BFF" label="Réservations" onClick={() => setTab('reservations')} />
                <QuickAction icon={<IcHome />} color="#FF6B35" label="Mes biens" onClick={() => setTab('biens')} />
              </div>

              {/* Score de crédibilité card */}
              <div className="rounded-2xl p-5 mb-6" style={{ background: `linear-gradient(135deg, ${DARK_PURPLE}, ${PURPLE})`, boxShadow: `0 8px 20px ${PURPLE}4D` }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-xl text-white text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.15)' }}>Mon profil</span>
                  <span className="text-white/70"><IcShield /></span>
                </div>
                <p className="text-white/70 text-sm">Score de crédibilité</p>
                <p className="text-white text-[26px] font-bold mt-1 mb-3">{score} / 100</p>
                <div className="h-1.5 rounded-full bg-white/20 mb-4">
                  <div className="h-full rounded-full bg-white transition-all" style={{ width: `${score}%` }} />
                </div>
                <div className="flex items-center">
                  {[
                    { label: 'Biens',    value: `${biens.length}` },
                    { label: 'Étoiles', value: `${me?.nb_etoiles ?? 0}` },
                    { label: 'Pénalité', value: `${me?.penalite_pourcentage ?? 0}%` },
                  ].map((s, i) => (
                    <div key={s.label} className="flex items-center flex-1">
                      {i > 0 && <div className="w-px h-8 mr-3" style={{ background: 'rgba(255,255,255,0.2)' }} />}
                      <div>
                        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.label}</p>
                        <p className="text-white font-bold text-sm">{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Biens récents */}
              <div className="flex items-center justify-between mb-3.5">
                <p className="text-[17px] font-bold text-text-dark">Mes biens récents</p>
                <button onClick={() => setTab('biens')} className="text-sm font-semibold" style={{ color: PURPLE }}>Voir tout</button>
              </div>
              {loading ? (
                [1,2].map(n => <div key={n} className="h-20 bg-white rounded-xl animate-pulse mb-2.5" />)
              ) : biens.length === 0 ? (
                <div className="bg-white rounded-xl p-5 text-center shadow-sm">
                  <p className="text-text-grey text-sm">Aucun bien publié pour l'instant</p>
                </div>
              ) : biens.slice(0, 3).map(b => {
                const { label, color } = statutBien(b.statut_moderation || 'en_attente')
                const loc = b.localisation
                const adresse = loc ? `${loc.quartier ? loc.quartier + ', ' : ''}${loc.ville || ''}` : '—'
                return (
                  <div key={b.id} className="bg-white rounded-[14px] p-3.5 mb-2.5 flex items-center gap-3 shadow-sm">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: PURPLE + '15' }}>
                      <span style={{ color: PURPLE }}><IcHome /></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-text-dark text-sm">{typeLabel(b.type)}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-text-grey"><IcPin /></span>
                        <p className="text-xs text-text-grey truncate">{adresse}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-text-dark text-xs">{fmtPrix(b.prix)}</p>
                      <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: color + '20', color }}>{label}</span>
                    </div>
                  </div>
                )
              })}
              <div className="h-24" />
            </div>
          </div>
        )}
        {tab === 'biens'        && <MesBiensTab />}
        {tab === 'reservations' && <ReservationsTab />}
        {tab === 'portefeuille' && <PortefeuilleTab />}
        {tab === 'delegations'  && <DelegationsRecuesTab onBack={() => setTab('profil')} />}
        {tab === 'profil'       && <ProfilTab user={me} onOpenDelegations={() => setTab('delegations')} />}
      </div>

      {/* FAB */}
      {(tab === 'tableau' || tab === 'biens') && (
        <div className="absolute bottom-20 right-4 z-20">
          <button onClick={() => navigate('/nouveau-bien')}
            className="flex items-center gap-2 px-5 py-3.5 rounded-full text-white font-bold shadow-lg active:scale-95 transition-transform"
            style={{ background: PURPLE, boxShadow: `0 4px 15px ${PURPLE}60` }}>
            <IcPlus /> Nouveau bien
          </button>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="flex-shrink-0 bg-white border-t border-divider" style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
        <div className="flex items-center justify-around px-2 py-2">
          {TABS.map(t => {
            const active = tab === t.key
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[14px] transition-all"
                style={active ? { background: PURPLE + '18' } : {}}>
                <span style={{ color: active ? PURPLE : '#9E9E9E' }}>{t.icon}</span>
                {active && <span className="text-xs font-bold" style={{ color: PURPLE }}>{t.label}</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
