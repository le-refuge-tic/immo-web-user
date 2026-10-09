import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { rolesApi } from '../../../api/rolesApi'
import { BLUE, ROLE_ROUTES, shade } from './shared'
import type { Tab } from './shared'

// ─── Tab: Profil ──────────────────────────────────────────────────────────────
// ─── Tab: Gérer mes rôles ───────────────────────────────────────────────────────
// Icônes rendues en CSS mask (data-URI SVG) plutôt qu'en <svg stroke> inline :
// la couleur vient alors de `background` sur le conteneur (currentColor via
// `color`), ce qui permet le dégradé plein-couleur des puces de rôle actif.
export function svgMaskUrl(inner: string): string {
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
  { key: 'prospect',     label: 'Prospect',     desc: 'Chercher à louer ou acheter un bien',            color: '#3A5AEE' },
  { key: 'proprietaire', label: 'Propriétaire', desc: 'Publier et gérer vos biens immobiliers',          color: BLUE },
  { key: 'demarcheur',   label: 'Agent',        desc: 'Mandataire immobilier — gérer des biens clients', color: '#9B59B6' },
  { key: 'locataire',    label: 'Locataire',    desc: 'Accéder à votre logement et payer vos loyers',    color: '#15803D' },
]

export function RolesTab() {
  const { user, rolesActifs, updateUser, activeRole, setActiveRole } = useAuth()
  const navigate = useNavigate()
  const [loadingRole, setLoadingRole] = useState<string | null>(null)
  const [justif, setJustif] = useState('')
  const [activating, setActivating] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmDesactiverRole, setConfirmDesactiverRole] = useState<string | null>(null)

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
    setConfirmDesactiverRole(null)
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

        <div role="alert" aria-live="assertive" aria-atomic="true">
          {error && (
            <div className="px-4 py-3 rounded-xl mb-4" style={{ background: '#EF444414', border: '1px solid #EF444430' }}>
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}
        </div>
        {success && (
          <div className="px-4 py-3 rounded-xl flex items-center gap-2 mb-4" style={{ background: '#22C55E14', border: '1px solid #22C55E30' }}>
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            <p className="text-sm font-semibold" style={{ color: 'var(--tx-green)' }}>{success}</p>
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
                        confirmDesactiverRole === r.key ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => desactiverRole(r.key)} disabled={busy} className="py-2 px-3 rounded-xl text-xs font-bold text-white" style={{ background: '#DC2626', border: 'none' }}>
                              {busy ? '…' : 'Confirmer'}
                            </button>
                            <button onClick={() => setConfirmDesactiverRole(null)} className="py-2 px-2 rounded-xl text-xs font-bold border" style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#6B7280', background: 'transparent' }}>✕</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDesactiverRole(r.key)} disabled={busy}
                            className={`${isActiveNow ? 'flex-1' : ''} py-2.5 px-3 rounded-xl text-xs font-bold border disabled:opacity-50`}
                            style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--tx-red)', background: 'rgba(239,68,68,0.06)' }}>
                            Désactiver
                          </button>
                        )
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

