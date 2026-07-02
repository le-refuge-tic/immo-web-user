import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { biensApi } from '../../api/biensApi'
import { visitesApi } from '../../api/visitesApi'
import { userApi } from '../../api/userApi'

type Tab = 'stats' | 'biens' | 'reservations' | 'creneaux' | 'loyers'

const BIEN_STATUT: Record<string, { label: string; color: string }> = {
  actif:      { label: 'Actif',        color: 'text-success bg-success/10' },
  inactif:    { label: 'Inactif',      color: 'text-text-grey bg-surface-g' },
  en_attente: { label: 'En attente',   color: 'text-warning bg-warning/10' },
}

// SVG icons for tabs
const StatsIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)
const HomeTabIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)
const CalTabIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const ClockTabIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const MoneyTabIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const PersonIcon = () => (
  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const PlusIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)
const CloseXIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const CheckIcon = () => (
  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)
const WithdrawIcon = () => (
  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
)

type TabDef = { key: Tab; label: string; icon: React.ReactNode }
const TABS: TabDef[] = [
  { key: 'stats',        label: 'Stats',        icon: <StatsIcon /> },
  { key: 'biens',        label: 'Biens',        icon: <HomeTabIcon /> },
  { key: 'reservations', label: 'Reservations', icon: <CalTabIcon /> },
  { key: 'creneaux',     label: 'Creneaux',     icon: <ClockTabIcon /> },
  { key: 'loyers',       label: 'Loyers',       icon: <MoneyTabIcon /> },
]

export default function ProprietaireDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('stats')
  const [biens, setBiens] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [creneaux, setCreneaux] = useState<any[]>([])
  const [loyers, setLoyers] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [b, r, c, l] = await Promise.allSettled([
          biensApi.mesBiens(),
          visitesApi.reservationsRecues(),
          visitesApi.mesCreneaux(),
          userApi.loyersStats(),
        ])
        if (b.status === 'fulfilled') setBiens(Array.isArray(b.value) ? b.value : b.value.data || [])
        if (r.status === 'fulfilled') setReservations(Array.isArray(r.value) ? r.value : r.value.data || [])
        if (c.status === 'fulfilled') setCreneaux(Array.isArray(c.value) ? c.value : c.value.data || [])
        if (l.status === 'fulfilled') setLoyers(l.value)
      } catch (_) {}
      setLoading(false)
    }
    load()
  }, [])

  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()

  return (
    <div className="min-h-full bg-app-bg">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #4B6BFF 0%, #7B4BFF 100%)' }} className="px-4 pt-12 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {user?.photo_profil ? (
              <img
                src={user.photo_profil}
                alt=""
                className="w-11 h-11 rounded-full object-cover"
                style={{ border: '2px solid rgba(255,255,255,0.5)' }}
              />
            ) : (
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.5)' }}
              >
                <span className="text-white font-bold">{initials}</span>
              </div>
            )}
            <div>
              <p className="text-white/70 text-xs">Tableau de bord</p>
              <p className="text-white font-bold">{user?.prenom} {user?.nom}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/profil')}
            className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"
          >
            <PersonIcon />
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Biens',        value: biens.length        },
            { label: 'Reservations', value: reservations.length },
            { label: 'Creneaux',     value: creneaux.length     },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-white text-xl font-bold">{s.value}</p>
              <p className="text-white/70 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-divider">
        <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold flex-shrink-0 border-b-2 transition-colors ${
                tab === t.key ? 'border-primary text-primary' : 'border-transparent text-text-grey'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-white rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {tab === 'stats'        && <StatsTab biens={biens} reservations={reservations} loyers={loyers} />}
            {tab === 'biens'        && <BiensTab biens={biens} navigate={navigate} setBiens={setBiens} />}
            {tab === 'reservations' && <ReservationsTab reservations={reservations} setReservations={setReservations} />}
            {tab === 'creneaux'     && <CreneauxTab creneaux={creneaux} setCreneaux={setCreneaux} biens={biens} />}
            {tab === 'loyers'       && <LoyersTab loyers={loyers} />}
          </>
        )}
      </div>
    </div>
  )
}

type StatCardProps = { label: string; value: string | number; colorClass: string }
function StatCard({ label, value, colorClass }: StatCardProps) {
  return (
    <div className={`rounded-2xl p-4 ${colorClass}`}>
      <p className="font-bold text-2xl mb-1">{value}</p>
      <p className="text-xs opacity-80 font-medium">{label}</p>
    </div>
  )
}

function StatsTab({ biens, reservations, loyers }: any) {
  const actifs    = biens.filter((b: any) => b.statut === 'actif').length
  const enAttente = reservations.filter((r: any) => r.statut === 'en_attente').length
  const confirmes = reservations.filter((r: any) => r.statut === 'confirmee').length
  const totalPercu = loyers?.total_percu
    ? `${Number(loyers.total_percu).toLocaleString('fr-FR')} F`
    : '—'

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="Biens actifs"         value={actifs}    colorClass="bg-primary-l text-primary" />
      <StatCard label="Demandes en attente"  value={enAttente} colorClass="bg-warning/10 text-warning" />
      <StatCard label="Visites confirmees"   value={confirmes} colorClass="bg-success/10 text-success" />
      <StatCard label="Loyers percus"        value={totalPercu} colorClass="bg-secondary-l text-secondary" />
    </div>
  )
}

function BiensTab({ biens, navigate, setBiens }: any) {
  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce bien ?')) return
    try {
      await biensApi.delete(id)
      setBiens((prev: any[]) => prev.filter(b => b.id !== id))
    } catch (_) {}
  }

  return (
    <div>
      <button
        onClick={() => navigate('/nouveau-bien')}
        className="w-full mb-4 bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-btn flex items-center justify-center gap-2"
      >
        <PlusIcon />
        Ajouter un bien
      </button>

      {biens.length === 0 ? (
        <div className="text-center py-10 text-text-grey text-sm">Aucun bien publie</div>
      ) : (
        <div className="space-y-3">
          {biens.map((b: any) => {
            const st = BIEN_STATUT[b.statut] || { label: b.statut, color: 'text-text-grey bg-surface-g' }
            return (
              <div key={b.id} className="bg-white rounded-2xl p-4 shadow-card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-bold text-text-dark text-sm">{b.type}</p>
                    <p className="text-xs text-text-grey">{b.localisation?.ville}</p>
                    <p className="text-sm font-semibold text-primary mt-1">
                      {Number(b.prix).toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.color}`}>
                    {st.label}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => navigate(`/biens/${b.id}`)}
                    className="flex-1 bg-primary-l text-primary py-2 rounded-xl text-xs font-bold"
                  >
                    Voir
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="w-9 py-2 flex items-center justify-center border border-danger text-danger rounded-xl"
                  >
                    <CloseXIcon />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ReservationsTab({ reservations, setReservations }: any) {
  const handleAction = async (id: number, action: 'confirmer' | 'refuser') => {
    try {
      if (action === 'confirmer') await visitesApi.confirmerVisite(id)
      else await visitesApi.refuserVisite(id)
      setReservations((prev: any[]) =>
        prev.map(r =>
          r.id === id ? { ...r, statut: action === 'confirmer' ? 'confirmee' : 'annulee' } : r
        )
      )
    } catch (_) {}
  }

  return (
    <div className="space-y-3">
      {reservations.length === 0 ? (
        <div className="text-center py-10 text-text-grey text-sm">Aucune reservation recue</div>
      ) : reservations.map((r: any) => (
        <div key={r.id} className="bg-white rounded-2xl p-4 shadow-card">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-bold text-text-dark text-sm">
                {r.prospect?.prenom} {r.prospect?.nom}
              </p>
              <p className="text-xs text-text-grey">{r.creneau?.bien?.localisation?.ville}</p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              r.statut === 'en_attente' ? 'text-warning bg-warning/10' :
              r.statut === 'confirmee'  ? 'text-success bg-success/10' :
              'text-danger bg-danger/10'
            }`}>
              {r.statut === 'en_attente' ? 'En attente' : r.statut === 'confirmee' ? 'Confirmee' : 'Annulee'}
            </span>
          </div>
          {r.statut === 'en_attente' && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleAction(r.id, 'confirmer')}
                className="flex-1 bg-success text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
              >
                <CheckIcon /> Confirmer
              </button>
              <button
                onClick={() => handleAction(r.id, 'refuser')}
                className="flex-1 bg-danger text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
              >
                <CloseXIcon /> Refuser
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function CreneauxTab({ creneaux, setCreneaux, biens }: any) {
  const [bienId, setBienId] = useState('')
  const [debut, setDebut] = useState('')
  const [fin, setFin] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bienId || !debut || !fin) return
    setAdding(true)
    try {
      const data = await visitesApi.creerCreneau({ bien_id: Number(bienId), debut, fin })
      setCreneaux((prev: any[]) => [data, ...prev])
      setBienId(''); setDebut(''); setFin('')
    } catch (_) {}
    setAdding(false)
  }

  const handleDelete = async (id: number) => {
    try {
      await visitesApi.supprimerCreneau(id)
      setCreneaux((prev: any[]) => prev.filter(c => c.id !== id))
    } catch (_) {}
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="bg-white rounded-2xl p-4 space-y-3 shadow-card">
        <p className="font-bold text-text-dark text-sm">Nouveau creneau</p>
        <select
          value={bienId}
          onChange={e => setBienId(e.target.value)}
          required
          className="w-full bg-surface-g rounded-xl px-4 py-2.5 text-sm outline-none"
        >
          <option value="">Choisir un bien</option>
          {biens.map((b: any) => (
            <option key={b.id} value={b.id}>{b.type} – {b.localisation?.ville}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="datetime-local"
            value={debut}
            onChange={e => setDebut(e.target.value)}
            required
            className="flex-1 bg-surface-g rounded-xl px-3 py-2.5 text-sm outline-none"
          />
          <input
            type="datetime-local"
            value={fin}
            onChange={e => setFin(e.target.value)}
            required
            className="flex-1 bg-surface-g rounded-xl px-3 py-2.5 text-sm outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={adding}
          className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {adding ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Ajout…</span>
            </>
          ) : 'Ajouter'}
        </button>
      </form>

      <div className="space-y-2">
        {creneaux.map((c: any) => (
          <div key={c.id} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-card">
            <div>
              <p className="text-sm font-semibold text-text-dark">
                {new Date(c.debut).toLocaleDateString('fr-FR', {
                  weekday: 'short', day: 'numeric', month: 'short',
                })}
              </p>
              <p className="text-xs text-text-grey">
                {new Date(c.debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                {' – '}
                {new Date(c.fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button
              onClick={() => handleDelete(c.id)}
              className="w-8 h-8 flex items-center justify-center text-danger"
            >
              <CloseXIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function LoyersTab({ loyers }: any) {
  const [retrait, setRetrait] = useState(false)
  const [operator, setOperator] = useState('mtn')
  const [phone, setPhone] = useState('')
  const [montant, setMontant] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleRetrait = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await userApi.retrait({ operateur: operator, telephone: phone, montant: Number(montant) })
      setRetrait(false); setMontant(''); setPhone('')
    } catch (_) {}
    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-primary-l rounded-2xl p-4">
          <p className="text-xs text-text-grey mb-1">Total percu</p>
          <p className="text-xl font-bold text-primary">
            {loyers?.total_percu ? `${Number(loyers.total_percu).toLocaleString('fr-FR')} F` : '—'}
          </p>
        </div>
        <div className="bg-success/10 rounded-2xl p-4">
          <p className="text-xs text-text-grey mb-1">Solde disponible</p>
          <p className="text-xl font-bold text-success">
            {loyers?.solde ? `${Number(loyers.solde).toLocaleString('fr-FR')} F` : '—'}
          </p>
        </div>
      </div>

      <button
        onClick={() => setRetrait(true)}
        className="w-full bg-secondary text-white py-3.5 rounded-xl font-bold shadow-btn-o flex items-center justify-center gap-2"
      >
        <WithdrawIcon />
        Demander un retrait
      </button>

      {loyers?.historique && loyers.historique.length > 0 && (
        <div className="space-y-2">
          <p className="font-bold text-text-dark text-sm">Historique</p>
          {loyers.historique.map((l: any, i: number) => (
            <div key={i} className="bg-white rounded-xl p-3 flex justify-between">
              <p className="text-sm text-text-dark">{l.description || 'Loyer'}</p>
              <p className="text-sm font-bold text-success">+{Number(l.montant).toLocaleString('fr-FR')} F</p>
            </div>
          ))}
        </div>
      )}

      {retrait && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setRetrait(false)}>
          <div className="bg-white rounded-t-3xl p-6 w-full" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-divider rounded-full mx-auto mb-5" />
            <h3 className="font-bold text-text-dark mb-4">Demande de retrait</h3>
            <form onSubmit={handleRetrait} className="space-y-3">
              <div className="flex gap-2">
                {['mtn', 'moov', 'celtiis'].map(op => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setOperator(op)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold ${
                      operator === op ? 'border-primary text-primary bg-primary-l' : 'border-divider text-text-grey'
                    }`}
                  >
                    {op.toUpperCase()}
                  </button>
                ))}
              </div>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                placeholder="Numero Mobile Money"
                className="w-full bg-surface-g rounded-xl px-4 py-3 text-sm outline-none"
              />
              <input
                type="number"
                value={montant}
                onChange={e => setMontant(e.target.value)}
                required
                placeholder="Montant (FCFA)"
                className="w-full bg-surface-g rounded-xl px-4 py-3 text-sm outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-secondary text-white py-4 rounded-xl font-bold shadow-btn-o disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Envoi…</span>
                  </>
                ) : 'Valider'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
