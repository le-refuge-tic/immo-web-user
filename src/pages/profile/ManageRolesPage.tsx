import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { rolesApi } from '../../api/rolesApi'

type RoleInfo = {
  key: string
  label: string
  desc: string
  color: string
  bg: string
}

const ROLES: RoleInfo[] = [
  { key: 'prospect',     label: 'Prospect',     desc: 'Chercher à louer ou acheter un bien',           color: '#4B6BFF', bg: 'rgba(75,107,255,0.1)' },
  { key: 'proprietaire', label: 'Propriétaire', desc: 'Publier et gérer vos biens immobiliers',         color: '#2E86C1', bg: 'rgba(46,134,193,0.1)' },
  { key: 'demarcheur',   label: 'Agent',        desc: 'Mandataire immobilier — gérer des biens clients', color: '#9B59B6', bg: 'rgba(155,89,182,0.1)' },
  { key: 'locataire',    label: 'Locataire',    desc: 'Accéder à votre logement et payer vos loyers',   color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
]

function roleLabel(key: string) {
  return ROLES.find(r => r.key === key)?.label || key
}

export default function ManageRolesPage() {
  const { user, rolesActifs, updateUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState<string | null>(null)
  const [justif, setJustif] = useState('')
  const [activating, setActivating] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const rolePrincipal = user?.role_principal || user?.role || ''
  const actifs = rolesActifs

  const activerRole = async (role: string) => {
    setLoading(role); setError('')
    try {
      await rolesApi.activer(role)
      const newRoles = [...actifs, role]
      updateUser({ roles_actifs: newRoles })
      setActivating(null); setJustif('')
      setSuccess(`Rôle "${roleLabel(role)}" activé avec succès.`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e?.response?.data?.message || `Impossible d'activer ce rôle.`)
    }
    setLoading(null)
  }

  const desactiverRole = async (role: string) => {
    if (!confirm(`Désactiver le rôle "${roleLabel(role)}" ?`)) return
    setLoading(role); setError('')
    try {
      await rolesApi.desactiver(role)
      const newRoles = actifs.filter(r => r !== role)
      updateUser({ roles_actifs: newRoles })
      setSuccess(`Rôle "${roleLabel(role)}" désactivé.`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Impossible de désactiver ce rôle.')
    }
    setLoading(null)
  }

  const goToDashboard = (role: string) => {
    if (role === 'proprietaire') navigate('/proprietaire')
    else if (role === 'demarcheur') navigate('/demarcheur')
    else if (role === 'locataire') navigate('/locataire')
    else navigate('/')
  }

  const disponibles = ROLES.filter(r => !actifs.includes(r.key) && r.key !== rolePrincipal && r.key !== 'locataire')
  const actifsList  = ROLES.filter(r => actifs.includes(r.key))

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-14 md:pt-6 pb-5"
        style={{ background: 'linear-gradient(135deg,#1A1A2E,#4B6BFF)', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.12)' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <p className="text-white font-bold text-lg">Gérer mes rôles</p>
            <p className="text-white/60 text-xs mt-0.5">Activez ou désactivez vos rôles</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 py-6 space-y-5 pb-10">

          {error && (
            <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="px-4 py-3 rounded-xl flex items-center gap-2" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>{success}</p>
            </div>
          )}

          {/* Rôle principal */}
          <div>
            <p className="text-xs font-bold text-text-grey uppercase tracking-wide mb-2">Rôle principal</p>
            {ROLES.filter(r => r.key === rolePrincipal).map(r => (
              <div key={r.key} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: r.bg, border: `1.5px solid ${r.color}30` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: r.color }}>
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-text-dark text-sm">{r.label}</p>
                  <p className="text-xs text-text-grey mt-0.5">{r.desc}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: r.color, color: 'white' }}>Principal</span>
              </div>
            ))}
          </div>

          {/* Rôles actifs secondaires */}
          {actifsList.filter(r => r.key !== rolePrincipal).length > 0 && (
            <div>
              <p className="text-xs font-bold text-text-grey uppercase tracking-wide mb-2">Rôles actifs</p>
              <div className="space-y-2">
                {actifsList.filter(r => r.key !== rolePrincipal).map(r => (
                  <div key={r.key} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.85)', border: `1px solid ${r.color}25`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: r.bg }}>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-text-dark text-sm">{r.label}</p>
                      <p className="text-xs text-text-grey mt-0.5">{r.desc}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => goToDashboard(r.key)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold"
                        style={{ background: r.bg, color: r.color }}>
                        Accéder
                      </button>
                      <button onClick={() => desactiverRole(r.key)} disabled={loading === r.key}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border"
                        style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444', background: 'rgba(239,68,68,0.06)' }}>
                        {loading === r.key ? '…' : 'Désactiver'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rôles disponibles */}
          {disponibles.length > 0 && (
            <div>
              <p className="text-xs font-bold text-text-grey uppercase tracking-wide mb-2">Rôles disponibles</p>
              <p className="text-xs text-text-grey mb-3">Activez un rôle supplémentaire (max 3 rôles actifs)</p>
              <div className="space-y-2">
                {disponibles.map(r => (
                  <div key={r.key}>
                    <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.07)' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,0,0,0.05)' }}>
                        <svg className="w-5 h-5 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-text-dark text-sm">{r.label}</p>
                        <p className="text-xs text-text-grey mt-0.5">{r.desc}</p>
                      </div>
                      <button onClick={() => setActivating(activating === r.key ? null : r.key)} disabled={actifs.length >= 3}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                        style={{ background: r.color, color: 'white' }}>
                        Activer
                      </button>
                    </div>
                    {activating === r.key && (
                      <div className="mt-2 px-4 pt-3 pb-4 rounded-xl space-y-3" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.08)' }}>
                        <p className="text-sm font-semibold text-text-dark">Justification (optionnelle)</p>
                        <textarea value={justif} onChange={e => setJustif(e.target.value)} rows={2}
                          placeholder="Ex: Je souhaite aussi proposer des biens à la vente"
                          className="w-full border border-divider rounded-xl px-3 py-2.5 text-sm outline-none resize-none focus:border-primary" />
                        <div className="flex gap-2">
                          <button onClick={() => setActivating(null)} className="flex-1 py-2.5 rounded-xl border border-divider text-sm font-semibold text-text-grey">Annuler</button>
                          <button onClick={() => activerRole(r.key)} disabled={loading === r.key}
                            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60"
                            style={{ background: r.color }}>
                            {loading === r.key ? 'Activation…' : 'Confirmer'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Switcher rapide */}
          {actifsList.length > 1 && (
            <div>
              <p className="text-xs font-bold text-text-grey uppercase tracking-wide mb-2">Changer d'espace</p>
              <div className="grid grid-cols-2 gap-2">
                {actifsList.map(r => (
                  <button key={r.key} onClick={() => goToDashboard(r.key)}
                    className="p-4 rounded-2xl flex flex-col items-center gap-2 transition-all"
                    style={{ background: r.bg, border: `1.5px solid ${r.color}30` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: r.color }}>
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    </div>
                    <p className="font-bold text-sm" style={{ color: r.color }}>{r.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
