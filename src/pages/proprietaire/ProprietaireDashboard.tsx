import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { biensApi } from '../../api/biensApi'
import { visitesApi } from '../../api/visitesApi'
import { userApi } from '../../api/userApi'
import { walletApi } from '../../api/walletApi'
import { delegationApi } from '../../api/delegationApi'
import { chatApi } from '../../api/chatApi'
import { loyersApi } from '../../api/loyersApi'
import EditProfileModal from '../profile/EditProfileModal'
import ChangePasswordModal from '../profile/ChangePasswordModal'
import EditBienModal from '../bien/EditBienModal'

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
const IcChevron = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>

// ─── Constants ────────────────────────────────────────────────────────────────
const BLUE      = '#2E86C1'
const DARK_BLUE = '#0F3460'

type Tab = 'tableau' | 'biens' | 'reservations' | 'creneaux' | 'loyers' | 'portefeuille' | 'profil' | 'delegations'

const DELEG_STATUT: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente',  color: '#F59E0B' },
  active:     { label: 'Active',      color: '#22C55E' },
  revoquee:   { label: 'Révoquée',    color: '#EF4444' },
  expiree:    { label: 'Expirée',     color: '#9CA3AF' },
  refusee:    { label: 'Refusée',     color: '#EF4444' },
}

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'tableau',       label: 'Tableau',       icon: <IcDash /> },
  { key: 'biens',         label: 'Mes biens',     icon: <IcHome /> },
  { key: 'reservations',  label: 'Réservations',  icon: <IcCal /> },
  { key: 'creneaux',      label: 'Créneaux',      icon: <IcClock /> },
  { key: 'loyers',        label: 'Loyers',        icon: <IcMoney /> },
  { key: 'portefeuille',  label: 'Portefeuille',  icon: <IcWallet /> },
  { key: 'profil',        label: 'Profil',        icon: <IcPerson /> },
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

// ─── QuickAction ──────────────────────────────────────────────────────────────
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
          {['Tous', 'Publié', 'En attente', 'Rejeté'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border"
              style={filter === f ? { background: BLUE, color: '#fff', borderColor: BLUE } : { color: '#9E9E9E', borderColor: '#E8EAED' }}>
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
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: BLUE + '15' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={1.5} className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            </div>
            <p className="font-bold text-text-dark mb-1">Aucun bien trouvé</p>
            <p className="text-sm text-text-grey mb-5">Publiez votre premier bien</p>
            <button onClick={() => navigate('/nouveau-bien')} className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm" style={{ background: BLUE }}>
              <IcPlus /> Ajouter un bien
            </button>
          </div>
        ) : filtered.map(b => {
          const { label, color } = statutBien(b.statut_moderation || 'en_attente')
          const loc = b.localisation
          const adresse = loc ? `${loc.quartier ? loc.quartier + ', ' : ''}${loc.ville || ''}` : '—'
          const cover = b.photos?.find((p: any) => p.is_cover) || b.photos?.[0]
          return (
            <div key={b.id} onClick={() => navigate(`/biens/${b.id}`)} role="button" tabIndex={0}
              className="bg-white rounded-2xl shadow-sm overflow-hidden mb-3 cursor-pointer transition-transform hover:-translate-y-0.5">
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

function ReservationsTab() {
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
    : filter === 'À traiter' ? byBien.filter(v => !isEchouee(v) && v.statut === 'en_attente')
    : filter === 'Confirmées' ? byBien.filter(v => !isEchouee(v) && v.statut === 'confirmee')
    : filter === 'Échouées' ? byBien.filter(v => isEchouee(v))
    : byBien.filter(v => v.statut === 'annulee')

  const confirmer = async (id: number) => {
    try { await visitesApi.confirmerVisite(id); load() } catch (_) {}
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

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="bg-white border-b border-divider flex flex-shrink-0">
        {['Toutes', 'À traiter', 'Confirmées', 'Échouées', 'Annulées'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="flex-1 py-3 text-xs font-bold border-b-2 transition-colors"
            style={filter === f ? { borderColor: BLUE, color: BLUE } : { borderColor: 'transparent', color: '#9E9E9E' }}>
            {f}
          </button>
        ))}
      </div>
      {biensUniques.length >= 2 && (
        <div className="bg-white px-4 pb-2.5 flex gap-2 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setBienIdFilter(null)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border"
            style={bienIdFilter === null ? { background: DARK_BLUE, color: '#fff', borderColor: DARK_BLUE } : { color: '#9E9E9E', borderColor: '#E8EAED' }}>
            Tous les biens
          </button>
          {biensUniques.map(b => (
            <button key={b.id} onClick={() => setBienIdFilter(b.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border"
              style={bienIdFilter === b.id ? { background: DARK_BLUE, color: '#fff', borderColor: DARK_BLUE } : { color: '#9E9E9E', borderColor: '#E8EAED' }}>
              {b.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          [1,2].map(n => <div key={n} className="h-40 bg-white rounded-2xl animate-pulse mb-3" />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: BLUE + '15' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <p className="font-bold text-text-dark mb-1">Aucune réservation</p>
            <p className="text-sm text-text-grey text-center">Les demandes de visite apparaîtront ici</p>
          </div>
        ) : filtered.map((v, i) => {
          const echouee = isEchouee(v)
          const { label, color } = echouee ? { label: 'Échouée', color: '#EF4444' } : statutVisite(v.statut)
          const nom = `${v.client?.prenom || ''} ${v.client?.nom || ''}`.trim() || 'Client'
          const init = nom.charAt(0).toUpperCase()
          const bType = typeLabel(v.bien?.type || '')
          const bLoc = v.bien?.localisation ? `${v.bien.localisation.quartier || ''} ${v.bien.localisation.ville || ''}`.trim() : '—'
          const dateStr = v.date_souhaitee ? new Date(v.date_souhaitee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
          const contactNumero = v.client?.numero_whatsapp || v.client?.telephone
          return (
            <div key={v.id || i} className="bg-white rounded-2xl shadow-sm mb-3 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-[13px] flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${BLUE}, ${DARK_BLUE})` }}>{init}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-dark text-sm">{nom}</p>
                  <p className="text-xs text-text-grey">{v.client?.telephone || '—'}</p>
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
                <button onClick={() => ouvrirChat(v)} disabled={chatLoadingId === v.id}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold disabled:opacity-50" style={{ borderColor: BLUE + '50', color: BLUE, background: BLUE + '10' }}>
                  <IcChat /> {chatLoadingId === v.id ? '…' : 'Chat'}
                </button>
                {v.statut === 'en_attente' && <>
                  <button onClick={() => setCpId(v.id)} className="flex-1 py-2 rounded-xl border text-xs font-bold text-center" style={{ borderColor: BLUE + '80', color: BLUE }}>Autre créneau</button>
                  <button onClick={() => confirmer(v.id)} className="flex-1 py-2 rounded-xl text-white text-xs font-bold" style={{ background: '#4CAF50' }}>Confirmer</button>
                </>}
                {v.statut === 'confirmee' && (
                  <button onClick={async () => { try { await visitesApi.marquerEffectuee(v.id); load() } catch (_) {} }} className="flex-1 py-2 rounded-xl text-white text-xs font-bold" style={{ background: BLUE }}>Marquer effectuée</button>
                )}
              </div>
              {cpId === v.id && (
                <div className="mt-3 pt-3 border-t border-divider">
                  <p className="text-sm font-bold text-text-dark mb-3">Proposer un autre créneau</p>
                  <div className="space-y-2 mb-3">
                    <input type="date" value={cpDate} onChange={e => setCpDate(e.target.value)}
                      className="w-full bg-surface-g rounded-xl px-3 py-2.5 text-sm outline-none border border-divider focus:border-primary" />
                    <input type="time" value={cpTime} onChange={e => setCpTime(e.target.value)}
                      className="w-full bg-surface-g rounded-xl px-3 py-2.5 text-sm outline-none border border-divider focus:border-primary" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setCpId(null)} className="flex-1 py-2.5 rounded-xl border border-divider text-sm font-semibold text-text-grey">Annuler</button>
                    <button onClick={contreProposer} disabled={!cpDate || !cpTime || submitting}
                      className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: BLUE }}>
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

// ─── Tab: Créneaux ────────────────────────────────────────────────────────────
function CreneauxTab() {
  const [creneaux, setCreneaux] = useState<any[]>([])
  const [biens, setBiens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ bien_id: '', date: '', heure: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [c, b] = await Promise.allSettled([visitesApi.mesCreneaux(), biensApi.mesBiens()])
      if (c.status === 'fulfilled') setCreneaux(Array.isArray(c.value) ? c.value : c.value.data || [])
      if (b.status === 'fulfilled') setBiens(Array.isArray(b.value) ? b.value : b.value.data || [])
    } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.date || !form.heure || !form.bien_id) return
    setSaving(true)
    try {
      await visitesApi.creerCreneau({ bien_id: Number(form.bien_id), debut: `${form.date}T${form.heure}:00`, duree_minutes: 60 })
      setShowForm(false); setForm({ bien_id: '', date: '', heure: '' }); load()
    } catch (_) {}
    setSaving(false)
  }

  const del = async (id: number) => {
    try { await visitesApi.supprimerCreneau(id); load() } catch (_) {}
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="bg-white px-4 py-3 border-b border-divider flex items-center justify-between flex-shrink-0">
        <p className="font-bold text-text-dark">{creneaux.length} créneau{creneaux.length > 1 ? 'x' : ''}</p>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-semibold" style={{ background: BLUE }}>
          <IcPlus /> Ajouter
        </button>
      </div>
      {showForm && (
        <div className="bg-white border-b border-divider px-4 py-4 space-y-2 flex-shrink-0">
          <select value={form.bien_id} onChange={e => setForm({ ...form, bien_id: e.target.value })}
            className="w-full bg-surface-g rounded-xl px-3 py-2.5 text-sm outline-none border border-divider">
            <option value="">Choisir un bien</option>
            {biens.map(b => <option key={b.id} value={b.id}>{typeLabel(b.type)} — {b.localisation?.ville}</option>)}
          </select>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              className="flex-1 bg-surface-g rounded-xl px-3 py-2.5 text-sm outline-none border border-divider" />
            <input type="time" value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })}
              className="flex-1 bg-surface-g rounded-xl px-3 py-2.5 text-sm outline-none border border-divider" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-divider text-sm font-semibold text-text-grey">Annuler</button>
            <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: BLUE }}>
              {saving ? 'Enregistrement…' : 'Créer'}
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? [1,2].map(n => <div key={n} className="h-20 bg-white rounded-xl animate-pulse mb-3" />) : creneaux.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: BLUE + '15' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p className="font-bold text-text-dark mb-1">Aucun créneau</p>
            <p className="text-sm text-text-grey">Créez des créneaux pour recevoir des visites</p>
          </div>
        ) : creneaux.map((c, i) => (
          <div key={c.id || i} className="bg-white rounded-xl p-4 mb-3 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: BLUE + '15' }}>
              <span style={{ color: BLUE }}><IcClock /></span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-text-dark text-sm">
                {c.debut ? new Date(c.debut).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : '—'}
              </p>
              <p className="text-xs text-text-grey">
                {c.debut ? new Date(c.debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}{c.duree_minutes ? ` · ${c.duree_minutes} min` : ''}
              </p>
            </div>
            <button onClick={() => del(c.id)} className="text-danger p-1"><IcTrash /></button>
          </div>
        ))}
      </div>
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
                <div className="mt-1 bg-white rounded-xl border border-divider shadow-sm max-h-40 overflow-y-auto">
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
        {loading ? [1, 2].map(n => <div key={n} className="h-20 bg-white rounded-xl animate-pulse mb-3" />) : delegations.length === 0 ? (
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
            <div key={d.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-text-dark text-sm">{d.demarcheur?.prenom} {d.demarcheur?.nom}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: meta.color, background: meta.color + '18' }}>{meta.label}</span>
              </div>
              <p className="text-xs text-text-grey mb-2">
                {d.bien ? `${typeLabel(d.bien.type)} — ${d.bien.localisation?.ville || ''}` : 'Tous les biens'} · {d.taux_commission_demarcheur}% commission
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
  const sorted = [...loyers].sort((a, b) => new Date(b.date_echeance || 0).getTime() - new Date(a.date_echeance || 0).getTime())

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5">
      <div className="rounded-2xl p-5 mb-5 text-white" style={{ background: `linear-gradient(135deg, ${DARK_BLUE}, ${BLUE})`, boxShadow: `0 8px 20px ${BLUE}4D` }}>
        <p className="text-white/70 text-sm mb-1">Revenus totaux perçus</p>
        <p className="text-2xl font-bold">{Number(stats.revenus_total ?? 0).toLocaleString('fr-FR')} FCFA</p>
        <div className="flex gap-4 mt-4">
          <div><p className="text-white/60 text-xs">Ce mois-ci</p><p className="font-bold">{Number(stats.revenus_mois ?? 0).toLocaleString('fr-FR')} FCFA</p></div>
          <div className="w-px bg-white/20" />
          <div><p className="text-white/60 text-xs">En attente</p><p className="font-bold">{Number(enAttenteMontant).toLocaleString('fr-FR')} FCFA</p></div>
          <div className="w-px bg-white/20" />
          <div><p className="text-white/60 text-xs">En retard</p><p className="font-bold">{stats.loyers_en_retard ?? 0}</p></div>
        </div>
      </div>
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: BLUE + '15' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <p className="font-bold text-text-dark mb-1">Aucun loyer</p>
          <p className="text-sm text-text-grey">Les loyers apparaîtront ici</p>
        </div>
      ) : sorted.map((l: any, i: number) => (
        <div key={l.id || i} className="bg-white rounded-xl p-4 mb-3 shadow-sm flex items-center justify-between">
          <div>
            <p className="font-bold text-text-dark text-sm">{typeLabel(l.bien?.type || '')} — {l.bien?.localisation?.ville || '—'}</p>
            <p className="text-xs text-text-grey mt-0.5">{l.locataire?.prenom} {l.locataire?.nom}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-text-dark text-sm">{Number(l.montant).toLocaleString('fr-FR')} FCFA</p>
            <span className={`text-xs font-semibold ${l.statut === 'paye' ? 'text-success' : l.statut === 'en_retard' ? 'text-danger' : 'text-warning'}`}>
              {l.statut === 'paye' ? 'Payé' : l.statut === 'en_retard' ? 'En retard' : 'En attente'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Portefeuille ────────────────────────────────────────────────────────
function PortefeuilleTab() {
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTrans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showRetrait, setShowRetrait] = useState(false)
  const [montant, setMontant] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [retraitOk, setRetraitOk] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [w, t] = await Promise.all([walletApi.me(), walletApi.transactions()])
      setWallet(w); setTrans(Array.isArray(t) ? t : t.data || [])
    } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const demanderRetrait = async () => {
    setSubmitting(true)
    try { await walletApi.demandeRetrait(Number(montant)); setRetraitOk(true); setShowRetrait(false); setMontant(''); load() } catch (_) {}
    setSubmitting(false)
  }

  const solde = Number(wallet?.solde || 0)

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5">
      {retraitOk && (
        <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2" style={{ background: '#22C55E10', border: '1px solid #22C55E30' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5} className="w-4 h-4 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>Demande de retrait envoyée.</p>
        </div>
      )}
      <div className="rounded-2xl p-5 mb-5 text-white" style={{ background: `linear-gradient(135deg, ${DARK_BLUE}, ${BLUE})`, boxShadow: `0 8px 20px ${BLUE}4D` }}>
        <p className="text-white/70 text-sm mb-1">Solde disponible</p>
        <p className="text-2xl font-bold mb-4">{loading ? '…' : solde.toLocaleString('fr-FR')} FCFA</p>
        <button onClick={() => setShowRetrait(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8l-8 8-8-8"/></svg>
          Demander un retrait
        </button>
      </div>
      {showRetrait && (
        <div className="mb-4 bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-bold text-text-dark mb-3">Montant à retirer</p>
          <input type="number" value={montant} onChange={e => setMontant(e.target.value)} placeholder="Ex: 50000" min={1} max={solde}
            className="w-full bg-surface-g border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary mb-3" />
          <div className="flex gap-2">
            <button onClick={() => setShowRetrait(false)} className="flex-1 py-2.5 rounded-xl border border-divider text-sm font-semibold text-text-grey">Annuler</button>
            <button onClick={demanderRetrait} disabled={submitting || !montant} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: BLUE }}>
              {submitting ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </div>
      )}
      <p className="font-bold text-text-dark mb-3">Transactions</p>
      {loading ? [1,2,3].map(n => <div key={n} className="h-14 bg-white rounded-xl animate-pulse mb-2" />) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="font-bold text-text-dark mb-1">Aucune transaction</p>
          <p className="text-sm text-text-grey">Vos commissions apparaîtront ici.</p>
        </div>
      ) : transactions.map((t: any, i: number) => {
        const isCredit = t.type === 'credit' || Number(t.montant) > 0
        return (
          <div key={i} className="flex items-center gap-3 p-3.5 bg-white rounded-xl mb-2 shadow-sm">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: isCredit ? '#22C55E15' : '#EF444415' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={isCredit ? '#22C55E' : '#EF4444'} strokeWidth={2.5} className="w-4 h-4">
                {isCredit ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8l-8-8-8 8"/> : <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V4m8 8l-8 8-8-8"/>}
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text-dark text-xs truncate">{t.description || (isCredit ? 'Crédit' : 'Débit')}</p>
              <p className="text-[10px] text-text-grey">{new Date(t.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
            <p className="font-bold text-xs flex-shrink-0" style={{ color: isCredit ? '#22C55E' : '#EF4444' }}>
              {isCredit ? '+' : '-'}{Math.abs(Number(t.montant)).toLocaleString('fr-FR')} F
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ─── Tab: Profil ──────────────────────────────────────────────────────────────
function ProfilTab({ user, onOpenDelegations }: { user: any; onOpenDelegations: () => void }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()
  const score = user?.score_credibilite ?? 100
  return (
    <div className="flex-1 overflow-y-auto pb-10">
      <div className="p-5 text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold" style={{ background: `linear-gradient(135deg, ${DARK_BLUE}, ${BLUE})` }}>{initials}</div>
        <p className="font-bold text-text-dark text-lg">{user?.prenom} {user?.nom}</p>
        <p className="text-sm text-text-grey">{user?.email || user?.telephone}</p>
      </div>
      <div className="px-4 mb-4">
        <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${DARK_BLUE}, ${BLUE})` }}>
          <p className="text-white/70 text-xs mb-1">Score de crédibilité</p>
          <p className="text-white text-2xl font-bold mb-3">{score} / 100</p>
          <div className="h-1.5 rounded-full bg-white/20 mb-4"><div className="h-full rounded-full bg-white" style={{ width: `${score}%` }} /></div>
          <div><p className="text-white/60 text-[10px]">Étoiles</p><p className="text-white font-bold text-sm">{user?.nb_etoiles ?? 0}</p></div>
        </div>
      </div>
      <div className="px-4 space-y-2">
        <button onClick={() => setEditOpen(true)} className="w-full bg-white rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm">
          <span className="text-sm font-semibold text-text-dark">Modifier le profil</span>
          <IcChevron />
        </button>
        <button onClick={() => setPasswordOpen(true)} className="w-full bg-white rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm">
          <span className="text-sm font-semibold text-text-dark">Changer le mot de passe</span>
          <IcChevron />
        </button>
        <button onClick={onOpenDelegations} className="w-full bg-white rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm">
          <span className="text-sm font-semibold text-text-dark">Délégations de gestion</span>
          <IcChevron />
        </button>
        <button onClick={() => navigate('/mes-roles')} className="w-full bg-white rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm">
          <span className="text-sm font-semibold text-text-dark">Gérer mes rôles</span>
          <IcChevron />
        </button>
        <button onClick={() => navigate('/portefeuille')} className="w-full bg-white rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm">
          <span className="text-sm font-semibold text-text-dark">Historique des transactions</span>
          <IcChevron />
        </button>
        <button onClick={() => { logout(); navigate('/login') }} className="w-full mt-2 py-3.5 rounded-xl text-danger font-bold text-sm border border-danger/20 bg-danger/5">
          Se déconnecter
        </button>
      </div>
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ProprietaireDashboard() {
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
  const approuves = biens.filter(b => b.statut_moderation === 'approuve').length
  const enAttente = biens.filter(b => b.statut_moderation === 'en_attente').length
  const rejetes   = biens.filter(b => b.statut_moderation === 'rejete').length

  return (
    <div className="flex flex-col h-full bg-[#F4F6FA] relative">

      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-12 pb-6" style={{ background: `linear-gradient(135deg, ${DARK_BLUE} 0%, #1A5276 50%, ${BLUE} 100%)` }}>
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
            <IcHome />
            <span className="text-white text-[11px] font-semibold">Propriétaire</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: <IcHome />,   value: `${biens.length}`,               label: 'Biens' },
            { icon: <IcStar />,   value: `${me?.nb_etoiles ?? 0}`,        label: 'Étoiles' },
            { icon: <IcShield />, value: `${score}`,                      label: 'Score' },
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
                <QuickAction icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>} color={BLUE} label="Nouveau bien" onClick={() => navigate('/nouveau-bien')} />
                <QuickAction icon={<IcCal />} color="#4B6BFF" label="Réservations" onClick={() => setTab('reservations')} />
                <QuickAction icon={<IcClock />} color="#FF6B35" label="Créneaux" onClick={() => setTab('creneaux')} />
              </div>

              {/* Occupation card */}
              <div className="rounded-2xl p-5 mb-6" style={{ background: `linear-gradient(135deg, ${DARK_BLUE}, ${BLUE})`, boxShadow: `0 8px 20px ${BLUE}4D` }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-xl text-white text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.15)' }}>Mes biens</span>
                  <span className="text-white/70"><IcHome /></span>
                </div>
                <p className="text-white/70 text-sm">Tableau de bord occupation</p>
                <p className="text-white text-[22px] font-bold mt-1 mb-4">{biens.length} bien{biens.length > 1 ? 's' : ''} au total</p>
                <div className="flex items-center">
                  {[
                    { label: 'Total',      value: biens.length },
                    { label: 'Publiés',    value: approuves },
                    { label: 'En attente', value: enAttente },
                    { label: 'Rejetés',    value: rejetes },
                  ].map((s, i) => (
                    <div key={s.label} className="flex items-center flex-1">
                      {i > 0 && <div className="w-px h-8 mr-3" style={{ background: 'rgba(255,255,255,0.2)' }} />}
                      <div>
                        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.label}</p>
                        <p className="text-white font-bold text-base">{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Biens récents */}
              <div className="flex items-center justify-between mb-3.5">
                <p className="text-[17px] font-bold text-text-dark">Mes biens récents</p>
                <button onClick={() => setTab('biens')} className="text-sm font-semibold" style={{ color: BLUE }}>Voir tout</button>
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
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: BLUE + '15' }}>
                      <span style={{ color: BLUE }}><IcHome /></span>
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
        {tab === 'creneaux'     && <CreneauxTab />}
        {tab === 'loyers'       && <LoyersTab />}
        {tab === 'portefeuille' && <PortefeuilleTab />}
        {tab === 'delegations'  && <DelegationsTab onBack={() => setTab('profil')} />}
        {tab === 'profil'       && <ProfilTab user={me} onOpenDelegations={() => setTab('delegations')} />}
      </div>

      {/* FAB */}
      {(tab === 'tableau' || tab === 'biens') && (
        <div className="absolute bottom-20 right-4 z-20">
          <button onClick={() => navigate('/nouveau-bien')}
            className="flex items-center gap-2 px-5 py-3.5 rounded-full text-white font-bold shadow-lg active:scale-95 transition-transform"
            style={{ background: BLUE, boxShadow: `0 4px 15px ${BLUE}60` }}>
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
  )
}
