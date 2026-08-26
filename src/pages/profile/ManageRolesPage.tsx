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
  icon: React.ReactNode
}

const IcSearch = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2m2.2-5.3a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" /></svg>
const IcHome = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
const IcBriefcase = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="8" width="18" height="12" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18" /></svg>
const IcKey = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a4 4 0 11-8.6 2.4L2 14v3h3v-2h2v-2h2l1.6-1.6A4 4 0 0115 7z" /><circle cx="15.5" cy="6.5" r=".6" fill="currentColor" /></svg>

const ROLES: RoleInfo[] = [
  { key: 'prospect',     label: 'Prospect',     desc: 'Chercher à louer ou acheter un bien',            color: '#4B6BFF', bg: 'rgba(75,107,255,0.1)',  icon: <IcSearch /> },
  { key: 'proprietaire', label: 'Propriétaire', desc: 'Publier et gérer vos biens immobiliers',          color: '#2E86C1', bg: 'rgba(46,134,193,0.1)',  icon: <IcHome /> },
  { key: 'demarcheur',   label: 'Agent',        desc: 'Mandataire immobilier — gérer des biens clients', color: '#9B59B6', bg: 'rgba(155,89,182,0.1)',  icon: <IcBriefcase /> },
  { key: 'locataire',    label: 'Locataire',    desc: 'Accéder à votre logement et payer vos loyers — obtenu en rejoignant un bien via un code d\'invitation', color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   icon: <IcKey /> },
]

function roleLabel(key: string) {
  return ROLES.find(r => r.key === key)?.label || key
}

export default function ManageRolesPage() {
  const { user, rolesActifs, updateUser, activeRole, setActiveRole } = useAuth()
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
    } finally {
      setLoading(null)
    }
  }

  const desactiverRole = async (role: string) => {
    if (!confirm(`Désactiver le rôle "${roleLabel(role)}" ?`)) return
    setLoading(role); setError('')
    try {
      await rolesApi.desactiver(role)
      const newRoles = actifs.filter(r => r !== role)
      updateUser({ roles_actifs: newRoles })
      // setActiveRole uniquement après updateUser pour éviter un état incohérent
      if (role === activeRole) setActiveRole(rolePrincipal)
      setSuccess(`Rôle "${roleLabel(role)}" désactivé.`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Impossible de désactiver ce rôle.')
      // Ne pas toucher activeRole en cas d'échec API
    } finally {
      setLoading(null)
    }
  }

  const goToDashboard = (role: string) => {
    setActiveRole(role)
    if (role === 'proprietaire') navigate('/proprietaire')
    else if (role === 'demarcheur') navigate('/demarcheur')
    else if (role === 'locataire') navigate('/locataire')
    else navigate('/')
  }

  // Un seul ensemble ordonné : espace courant d'abord, puis rôle principal,
  // puis rôles actifs secondaires, puis rôles disponibles à activer — au lieu
  // de répéter les mêmes cartes dans plusieurs sections + un switcher séparé.
  const ordered = [...ROLES].sort((a, b) => {
    const rank = (r: RoleInfo) =>
      r.key === activeRole ? 0 : r.key === rolePrincipal ? 1 : actifs.includes(r.key) ? 2 : 3
    return rank(a) - rank(b)
  })

  return (
    <div className="min-h-full flex flex-col bg-[#F4F6FA]">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-14 md:pt-8 pb-6 md:pb-8"
        style={{ background: 'linear-gradient(135deg,#1A1A2E,#4B6BFF)', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.12)' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <p className="text-white font-bold text-lg md:text-xl">Espaces & rôles</p>
            <p className="text-white/60 text-xs md:text-sm mt-0.5">Basculez entre vos espaces ou activez-en un nouveau</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-5 py-6 pb-10">

          {error && (
            <div className="px-4 py-3 rounded-xl mb-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="px-4 py-3 rounded-xl flex items-center gap-2 mb-4" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>{success}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-3">
            {ordered.map(r => {
              const isActiveNow = r.key === activeRole
              const isPrincipal = r.key === rolePrincipal
              const isActif = actifs.includes(r.key)
              const isDisponible = !isActif
              const busy = loading === r.key

              const statusLabel = isActiveNow ? 'Espace actuel' : isPrincipal ? 'Rôle principal' : isActif ? 'Actif' : null

              return (
                <div key={r.key} className="rounded-2xl overflow-hidden transition-shadow hover:shadow-md"
                  style={{
                    background: '#fff',
                    border: isActiveNow ? `1.5px solid ${r.color}` : '1px solid rgba(0,0,0,0.07)',
                    boxShadow: isActiveNow ? `0 4px 16px ${r.color}25` : '0 1px 3px rgba(0,0,0,0.03)',
                  }}>
                  <div className="p-4 flex items-start gap-3">
                    <div className="w-11 h-11 rounded-[13px] flex items-center justify-center flex-shrink-0" style={{ background: isDisponible ? 'rgba(0,0,0,0.05)' : r.color, color: isDisponible ? '#8A93A3' : '#fff' }}>
                      {r.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-text-dark text-sm">{r.label}</p>
                        {statusLabel && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: isActiveNow ? r.color : r.bg, color: isActiveNow ? '#fff' : r.color }}>
                            {statusLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-grey mt-0.5 leading-relaxed">{r.desc}</p>
                    </div>
                  </div>

                  <div className="px-4 pb-4 flex gap-2">
                    {isDisponible && r.key === 'locataire' ? (
                      // Le statut locataire ne s'auto-active jamais : il vient uniquement
                      // de la validation d'une demande de liaison à un bien en gestion
                      // (code d'invitation), jamais d'une activation directe.
                      <button onClick={() => navigate('/rejoindre-bien')}
                        className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition-opacity hover:opacity-90"
                        style={{ background: r.color }}>
                        Rejoindre un bien
                      </button>
                    ) : isDisponible ? (
                      <button onClick={() => setActivating(activating === r.key ? null : r.key)} disabled={actifs.length >= 3}
                        className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold disabled:opacity-40 transition-opacity hover:opacity-90"
                        style={{ background: r.color }}>
                        Activer ce rôle
                      </button>
                    ) : (
                      <>
                        {!isActiveNow && (
                          <button onClick={() => goToDashboard(r.key)}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-opacity hover:opacity-80"
                            style={{ background: r.bg, color: r.color }}>
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
                    <div className="mx-4 mb-4 px-4 pt-3 pb-4 rounded-xl space-y-3" style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <p className="text-sm font-semibold text-text-dark">Justification (optionnelle)</p>
                      <textarea value={justif} onChange={e => setJustif(e.target.value)} rows={2}
                        placeholder="Ex: Je souhaite aussi proposer des biens à la vente"
                        className="w-full border border-divider rounded-xl px-3 py-2.5 text-sm outline-none resize-none focus:border-primary bg-white" />
                      <div className="flex gap-2">
                        <button onClick={() => setActivating(null)} className="flex-1 py-2.5 rounded-xl border border-divider text-sm font-semibold text-text-grey bg-white">Annuler</button>
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

          <p className="text-xs text-text-grey text-center mt-5">Vous pouvez activer jusqu'à 3 rôles simultanément.</p>
        </div>
      </div>
    </div>
  )
}
