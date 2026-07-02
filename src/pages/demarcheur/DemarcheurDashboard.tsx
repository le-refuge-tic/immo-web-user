import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { biensApi } from '../../api/biensApi'
import { visitesApi } from '../../api/visitesApi'
import { userApi } from '../../api/userApi'

type Tab = 'stats' | 'biens' | 'reservations' | 'profil' | 'verification'

export default function DemarcheurDashboard() {
  const { user, updateUser } = useAuth()
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

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'stats', label: 'Stats', icon: '📊' },
    { key: 'biens', label: 'Biens', icon: '🏠' },
    { key: 'reservations', label: 'Réservations', icon: '📅' },
    { key: 'verification', label: 'Vérification', icon: '🪪' },
    { key: 'profil', label: 'Profil', icon: '👤' },
  ]

  const handleUploadCip = async () => {
    if (!cipFile) return
    setUploading(true)
    try {
      await userApi.uploadCip(cipFile)
    } catch (_) {}
    setUploading(false)
  }

  const handleUploadIfu = async () => {
    if (!ifuFile) return
    setUploading(true)
    try {
      await userApi.uploadIfu(ifuFile)
    } catch (_) {}
    setUploading(false)
  }

  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()

  return (
    <div className="min-h-full bg-app-bg">
      {/* Header */}
      <div className="bg-gradient-to-br from-secondary to-[#FF9B65] px-4 pt-12 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {user?.photo_profil ? (
              <img src={user.photo_profil} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-white/50" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center">
                <span className="text-white font-bold">{initials}</span>
              </div>
            )}
            <div>
              <p className="text-white/70 text-xs">Démarcheur</p>
              <p className="text-white font-bold">{user?.prenom} {user?.nom}</p>
            </div>
          </div>
          <button onClick={() => navigate('/profil')}
            className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
            <p className="text-white/70 text-xs">Réservations</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-divider">
        <div className="flex overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold flex-shrink-0 border-b-2 transition-colors ${
                tab === t.key ? 'border-secondary text-secondary' : 'border-transparent text-text-grey'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(n => <div key={n} className="bg-white rounded-2xl h-24 animate-pulse" />)}
          </div>
        ) : (
          <>
            {tab === 'stats' && (
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon="🏠" label="Biens publiés" value={biens.length} color="bg-secondary-l text-secondary" />
                <StatCard icon="📅" label="Réservations" value={reservations.length} color="bg-primary-l text-primary" />
                <StatCard icon="✅" label="Confirmées" value={reservations.filter((r: any) => r.statut === 'confirmee').length} color="bg-success/10 text-success" />
                <StatCard icon="⏳" label="En attente" value={reservations.filter((r: any) => r.statut === 'en_attente').length} color="bg-warning/10 text-warning" />
              </div>
            )}

            {tab === 'biens' && (
              <div>
                <button onClick={() => navigate('/nouveau-bien')}
                  className="w-full mb-4 bg-secondary text-white py-3 rounded-xl font-bold text-sm shadow-btn-o flex items-center justify-center gap-2">
                  + Publier un bien
                </button>
                {biens.length === 0 ? (
                  <div className="text-center py-10 text-text-grey text-sm">Aucun bien publié</div>
                ) : (
                  <div className="space-y-3">
                    {biens.map((b: any) => (
                      <div key={b.id} className="bg-white rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-text-dark text-sm">{b.type}</p>
                          <p className="text-xs text-text-grey">{b.localisation?.ville}</p>
                          <p className="text-sm font-semibold text-secondary mt-0.5">
                            {Number(b.prix).toLocaleString('fr-FR')} FCFA
                          </p>
                        </div>
                        <button onClick={() => navigate(`/biens/${b.id}`)}
                          className="bg-secondary-l text-secondary px-3 py-2 rounded-xl text-xs font-bold">
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
                  <div className="text-center py-10 text-text-grey text-sm">Aucune réservation reçue</div>
                ) : reservations.map((r: any) => (
                  <div key={r.id} className="bg-white rounded-2xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-text-dark text-sm">
                          {r.prospect?.prenom} {r.prospect?.nom}
                        </p>
                        <p className="text-xs text-text-grey">{r.creneau?.bien?.localisation?.ville}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        r.statut === 'en_attente' ? 'text-warning bg-warning/10' :
                        r.statut === 'confirmee' ? 'text-success bg-success/10' :
                        'text-danger bg-danger/10'
                      }`}>
                        {r.statut}
                      </span>
                    </div>
                    {r.statut === 'en_attente' && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={async () => {
                          await visitesApi.confirmerVisite(r.id)
                          setReservations(prev => prev.map(x => x.id === r.id ? { ...x, statut: 'confirmee' } : x))
                        }} className="flex-1 bg-success text-white py-2 rounded-xl text-xs font-bold">
                          ✓ Confirmer
                        </button>
                        <button onClick={async () => {
                          await visitesApi.refuserVisite(r.id)
                          setReservations(prev => prev.map(x => x.id === r.id ? { ...x, statut: 'annulee' } : x))
                        }} className="flex-1 bg-danger text-white py-2 rounded-xl text-xs font-bold">
                          ✕ Refuser
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === 'verification' && (
              <div className="space-y-4">
                <p className="text-sm text-text-grey">
                  Pour publier des biens, votre identité doit être vérifiée via une CIP et/ou un IFU.
                </p>

                <div className="bg-white rounded-2xl p-4">
                  <p className="font-bold text-text-dark text-sm mb-3">📇 Carte d'Identité (CIP)</p>
                  <input type="file" accept="image/*,application/pdf"
                    onChange={e => setCipFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-text-grey mb-3" />
                  <button onClick={handleUploadCip} disabled={!cipFile || uploading}
                    className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50">
                    {uploading ? 'Envoi…' : 'Envoyer la CIP'}
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-4">
                  <p className="font-bold text-text-dark text-sm mb-3">🏢 Numéro IFU</p>
                  <input type="file" accept="image/*,application/pdf"
                    onChange={e => setIfuFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-text-grey mb-3" />
                  <button onClick={handleUploadIfu} disabled={!ifuFile || uploading}
                    className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50">
                    {uploading ? 'Envoi…' : 'Envoyer l\'IFU'}
                  </button>
                </div>
              </div>
            )}

            {tab === 'profil' && (
              <div className="space-y-3">
                <button onClick={() => navigate('/profil/edit')}
                  className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 text-left">
                  <span className="text-xl">✏️</span>
                  <span className="text-sm font-semibold text-text-dark">Modifier mon profil</span>
                  <svg className="w-4 h-4 text-text-grey ml-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button onClick={() => navigate('/profil/password')}
                  className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 text-left">
                  <span className="text-xl">🔒</span>
                  <span className="text-sm font-semibold text-text-dark">Changer le mot de passe</span>
                  <svg className="w-4 h-4 text-text-grey ml-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className={`rounded-2xl p-4 ${color}`}>
      <p className="text-2xl mb-1">{icon}</p>
      <p className="font-bold text-lg">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  )
}
