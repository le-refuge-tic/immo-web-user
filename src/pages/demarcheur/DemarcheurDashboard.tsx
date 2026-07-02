import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { biensApi } from '../../api/biensApi'
import { visitesApi } from '../../api/visitesApi'
import { userApi } from '../../api/userApi'

type Tab = 'stats' | 'biens' | 'reservations' | 'profil' | 'verification'

const StatsIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)
const HomeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)
const CalIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const IdCardIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
  </svg>
)
const PersonIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const PlusIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)
const ChevronRightIcon = () => (
  <svg className="w-4 h-4 text-text-grey ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)
const CheckIcon = () => (
  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)
const CloseIcon = () => (
  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const EditIcon = () => (
  <svg className="w-5 h-5 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)
const LockIcon = () => (
  <svg className="w-5 h-5 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)
const UploadIcon = () => (
  <svg className="w-8 h-8 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
)

type TabDef = { key: Tab; label: string; icon: React.ReactNode }
const TABS: TabDef[] = [
  { key: 'stats',        label: 'Stats',        icon: <StatsIcon /> },
  { key: 'biens',        label: 'Biens',        icon: <HomeIcon /> },
  { key: 'reservations', label: 'Reservations', icon: <CalIcon /> },
  { key: 'verification', label: 'Verification', icon: <IdCardIcon /> },
  { key: 'profil',       label: 'Profil',       icon: <PersonIcon /> },
]

export default function DemarcheurDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('stats')
  const [biens, setBiens] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cipFile, setCipFile] = useState<File | null>(null)
  const [ifuFile, setIfuFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [b, r] = await Promise.allSettled([
          biensApi.mesBiens(),
          visitesApi.reservationsRecues(),
        ])
        if (b.status === 'fulfilled') setBiens(Array.isArray(b.value) ? b.value : b.value.data || [])
        if (r.status === 'fulfilled') setReservations(Array.isArray(r.value) ? r.value : r.value.data || [])
      } catch (_) {}
      setLoading(false)
    }
    load()
  }, [])

  const handleUploadCip = async () => {
    if (!cipFile) return
    setUploading(true)
    try { await userApi.uploadCip(cipFile) } catch (_) {}
    setUploading(false)
  }

  const handleUploadIfu = async () => {
    if (!ifuFile) return
    setUploading(true)
    try { await userApi.uploadIfu(ifuFile) } catch (_) {}
    setUploading(false)
  }

  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()

  return (
    <div className="min-h-full bg-app-bg">
      {/* Header – secondary gradient for demarcheur */}
      <div className="bg-gradient-to-br from-secondary to-[#FF9B65] px-4 pt-12 pb-5">
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
              <p className="text-white/70 text-xs">Demarcheur</p>
              <p className="text-white font-bold">{user?.prenom} {user?.nom}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/profil')}
            className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-white text-xl font-bold">{biens.length}</p>
            <p className="text-white/70 text-xs">Biens</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-white text-xl font-bold">{reservations.length}</p>
            <p className="text-white/70 text-xs">Reservations</p>
          </div>
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
                tab === t.key ? 'border-secondary text-secondary' : 'border-transparent text-text-grey'
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
            {tab === 'stats' && (
              <div className="grid grid-cols-2 gap-3">
                <DStatCard label="Biens publies"  value={biens.length}                                                          colorClass="bg-secondary-l text-secondary" />
                <DStatCard label="Reservations"   value={reservations.length}                                                    colorClass="bg-primary-l text-primary" />
                <DStatCard label="Confirmees"     value={reservations.filter((r: any) => r.statut === 'confirmee').length}      colorClass="bg-success/10 text-success" />
                <DStatCard label="En attente"     value={reservations.filter((r: any) => r.statut === 'en_attente').length}     colorClass="bg-warning/10 text-warning" />
              </div>
            )}

            {tab === 'biens' && (
              <div>
                <button
                  onClick={() => navigate('/nouveau-bien')}
                  className="w-full mb-4 bg-secondary text-white py-3 rounded-xl font-bold text-sm shadow-btn-o flex items-center justify-center gap-2"
                >
                  <PlusIcon />
                  Publier un bien
                </button>
                {biens.length === 0 ? (
                  <div className="text-center py-10 text-text-grey text-sm">Aucun bien publie</div>
                ) : (
                  <div className="space-y-3">
                    {biens.map((b: any) => (
                      <div key={b.id} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-card">
                        <div>
                          <p className="font-bold text-text-dark text-sm">{b.type}</p>
                          <p className="text-xs text-text-grey">{b.localisation?.ville}</p>
                          <p className="text-sm font-semibold text-secondary mt-0.5">
                            {Number(b.prix).toLocaleString('fr-FR')} FCFA
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(`/biens/${b.id}`)}
                          className="bg-secondary-l text-secondary px-3 py-2 rounded-xl text-xs font-bold"
                        >
                          Voir
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'reservations' && (
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
                          onClick={async () => {
                            await visitesApi.confirmerVisite(r.id)
                            setReservations(prev => prev.map(x => x.id === r.id ? { ...x, statut: 'confirmee' } : x))
                          }}
                          className="flex-1 bg-success text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                        >
                          <CheckIcon /> Confirmer
                        </button>
                        <button
                          onClick={async () => {
                            await visitesApi.refuserVisite(r.id)
                            setReservations(prev => prev.map(x => x.id === r.id ? { ...x, statut: 'annulee' } : x))
                          }}
                          className="flex-1 bg-danger text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                        >
                          <CloseIcon /> Refuser
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === 'verification' && (
              <div className="space-y-4">
                <p className="text-sm text-text-grey leading-relaxed">
                  Pour publier des biens, votre identite doit etre verifiee via une CIP et/ou un IFU.
                </p>

                {/* CIP upload */}
                <div className="bg-white rounded-2xl p-4 shadow-card">
                  <p className="font-bold text-text-dark text-sm mb-3">Carte d'Identite (CIP)</p>
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-divider rounded-xl py-6 cursor-pointer hover:border-primary transition-colors mb-3">
                    <UploadIcon />
                    <span className="text-sm text-text-grey">
                      {cipFile ? cipFile.name : 'Cliquer pour selectionner un fichier'}
                    </span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={e => setCipFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <button
                    onClick={handleUploadCip}
                    disabled={!cipFile || uploading}
                    className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Envoi…</span>
                      </>
                    ) : 'Envoyer la CIP'}
                  </button>
                </div>

                {/* IFU upload */}
                <div className="bg-white rounded-2xl p-4 shadow-card">
                  <p className="font-bold text-text-dark text-sm mb-3">Numero IFU</p>
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-divider rounded-xl py-6 cursor-pointer hover:border-primary transition-colors mb-3">
                    <UploadIcon />
                    <span className="text-sm text-text-grey">
                      {ifuFile ? ifuFile.name : 'Cliquer pour selectionner un fichier'}
                    </span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={e => setIfuFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <button
                    onClick={handleUploadIfu}
                    disabled={!ifuFile || uploading}
                    className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Envoi…</span>
                      </>
                    ) : "Envoyer l'IFU"}
                  </button>
                </div>
              </div>
            )}

            {tab === 'profil' && (
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/profil/edit')}
                  className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 text-left shadow-card"
                >
                  <EditIcon />
                  <span className="text-sm font-semibold text-text-dark">Modifier mon profil</span>
                  <ChevronRightIcon />
                </button>
                <button
                  onClick={() => navigate('/profil/password')}
                  className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 text-left shadow-card"
                >
                  <LockIcon />
                  <span className="text-sm font-semibold text-text-dark">Changer le mot de passe</span>
                  <ChevronRightIcon />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

type DStatCardProps = { label: string; value: string | number; colorClass: string }
function DStatCard({ label, value, colorClass }: DStatCardProps) {
  return (
    <div className={`rounded-2xl p-4 ${colorClass}`}>
      <p className="font-bold text-2xl mb-1">{value}</p>
      <p className="text-xs opacity-80 font-medium">{label}</p>
    </div>
  )
}
