import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/authApi'
import { userApi } from '../../api/userApi'
import { visitesApi } from '../../api/visitesApi'

const ROLE_LABELS: Record<string, string> = {
  prospect:   'Prospect',
  locataire:  'Locataire',
  proprietaire: 'Propriétaire',
  demarcheur: 'Démarcheur',
  admin:      'Admin',
  super_admin: 'Super Admin',
}

// SVG icons
const SettingsIcon = () => (
  <svg className="w-5 h-5 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const CalendarStatIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const ShieldIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)
const WarningIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)
const CalendarCardIcon = () => (
  <svg className="w-[22px] h-[22px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const ArrowRightSmIcon = () => (
  <svg className="w-3.5 h-3.5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)
const EyeActiveIcon = () => (
  <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)
const PersonMenuIcon = () => (
  <svg className="w-5 h-5 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const LockMenuIcon = () => (
  <svg className="w-5 h-5 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)
const ReceiptMenuIcon = () => (
  <svg className="w-5 h-5 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)
const StarMenuIcon = () => (
  <svg className="w-5 h-5 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
)
const ChevronRightIcon = () => (
  <svg className="w-[18px] h-[18px] text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)
const LogoutIcon = () => (
  <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

type Visite = {
  id: number
  statut: string
  bienType?: string
  dateVisite?: string
  creneau?: { debut: string; bien?: { type?: string } }
}

type StatBadgeProps = {
  icon: React.ReactNode
  value: string
  label: string
  color: string
  bg: string
  border: string
}

function StatBadge({ icon, value, label, color, bg, border }: StatBadgeProps) {
  return (
    <div
      className="flex flex-col items-center px-3.5 py-2.5 rounded-[14px]"
      style={{ backgroundColor: bg, border: `1px solid ${border}` }}
    >
      <div style={{ color }}>{icon}</div>
      <p className="text-base font-bold mt-1" style={{ color }}>{value}</p>
      <p className="text-[10px] text-text-grey">{label}</p>
    </div>
  )
}

type MenuItemProps = {
  icon: React.ReactNode
  label: string
  onClick: () => void
  showDivider?: boolean
}

function MenuItem({ icon, label, onClick, showDivider = true }: MenuItemProps) {
  return (
    <>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-surface-g transition-colors"
      >
        {icon}
        <span className="flex-1 text-left text-sm text-text-dark font-medium">{label}</span>
        <ChevronRightIcon />
      </button>
      {showDivider && <div className="h-px bg-divider ml-[50px]" />}
    </>
  )
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [apiUser, setApiUser] = useState<any>(null)
  const [visites, setVisites] = useState<Visite[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [u, v] = await Promise.allSettled([
          userApi.me(),
          visitesApi.mesVisites(),
        ])
        if (u.status === 'fulfilled') setApiUser(u.value)
        if (v.status === 'fulfilled') {
          const list = Array.isArray(v.value) ? v.value : v.value?.data || []
          setVisites(list)
        }
      } catch (_) {}
      setIsLoading(false)
    }
    load()
  }, [])

  if (!user) return null

  const initials = `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase()
  const fullName = `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Utilisateur'
  const role = user.role
  const roleLabel = ROLE_LABELS[role] || role

  const visitCount = visites.filter(v => v.statut !== 'annulee').length
  const score = apiUser?.score_credibilite ?? 100
  const penalite = parseFloat(apiUser?.penalite_pourcentage ?? '0') || 0
  const penaliteStr = `${penalite.toFixed(0)}%`

  const visiteActive = visites.find(v => v.statut === 'en_attente' || v.statut === 'confirmee')

  const handleLogout = async () => {
    const rt = localStorage.getItem('rg_refresh') || ''
    try { await authApi.logout(rt) } catch (_) {}
    logout()
    navigate('/', { replace: true })
  }

  const handleAnnuler = async () => {
    if (!visiteActive) return
    if (!window.confirm(
      visiteActive.statut === 'confirmee'
        ? 'Si vous annulez cette visite confirmée, une pénalité sera appliquée à votre compte.'
        : 'Voulez-vous vraiment annuler cette demande de visite ?'
    )) return
    try {
      await visitesApi.annuler(visiteActive.id)
      setVisites(prev => prev.map(v => v.id === visiteActive.id ? { ...v, statut: 'annulee' } : v))
    } catch (_) {}
  }

  return (
    <div className="min-h-full bg-app-bg">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-text-dark">Profil</h1>
        <div className="w-[38px] h-[38px] bg-surface-g rounded-[10px] flex items-center justify-center">
          <SettingsIcon />
        </div>
      </div>

      <div className="overflow-y-auto px-5 pb-8">
        {/* Avatar */}
        <div className="flex justify-center mt-2.5">
          <div className="relative">
            {user.photo_profil ? (
              <img
                src={user.photo_profil}
                alt=""
                className="w-[88px] h-[88px] rounded-full object-cover"
                style={{ border: '3px solid #4B6BFF' }}
              />
            ) : (
              <div
                className="w-[88px] h-[88px] rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #4B6BFF 0%, #7B4BFF 100%)' }}
              >
                <span className="text-white text-[32px] font-bold">{initials}</span>
              </div>
            )}
            {/* Online indicator */}
            <div
              className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-white"
              style={{ backgroundColor: '#4CAF50' }}
            />
          </div>
        </div>

        {/* Name + email + role badge */}
        <div className="text-center mt-3">
          <p className="text-[18px] font-bold text-text-dark">{fullName}</p>
          {(apiUser?.email || user.email) && (
            <p className="text-[13px] text-text-grey mt-1">{apiUser?.email || user.email}</p>
          )}
          <div className="flex justify-center mt-1.5">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-3.5 py-1 rounded-full">
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Stats badges */}
        <div className="flex justify-center gap-3 mt-4">
          <StatBadge
            icon={<CalendarStatIcon />}
            value={String(visitCount)}
            label="Visites"
            color="#4B6BFF"
            bg="rgba(75,107,255,0.08)"
            border="rgba(75,107,255,0.15)"
          />
          <StatBadge
            icon={<ShieldIcon />}
            value={String(score)}
            label="Score"
            color="#4CAF50"
            bg="rgba(76,175,80,0.08)"
            border="rgba(76,175,80,0.15)"
          />
          <StatBadge
            icon={<WarningIcon />}
            value={penaliteStr}
            label="Pénalité"
            color={penalite > 0 ? '#F44336' : '#4CAF50'}
            bg={penalite > 0 ? 'rgba(244,67,54,0.08)' : 'rgba(76,175,80,0.08)'}
            border={penalite > 0 ? 'rgba(244,67,54,0.15)' : 'rgba(76,175,80,0.15)'}
          />
        </div>

        {/* Loading spinner or visite active */}
        <div className="mt-5">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : visiteActive ? (
            <div
              className="bg-white rounded-[14px] p-3.5 mb-3 flex items-center gap-3"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            >
              <div className="w-[42px] h-[42px] rounded-[11px] bg-primary/10 flex items-center justify-center flex-shrink-0">
                <EyeActiveIcon />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-text-dark">
                  {visiteActive.statut === 'confirmee' ? 'Visite confirmée' : 'Visite en attente'}
                </p>
                <p className="text-[11px] text-text-grey mt-0.5">
                  {visiteActive.creneau?.bien?.type || visiteActive.bienType || 'Bien'}
                  {visiteActive.creneau?.debut
                    ? ` · ${new Date(visiteActive.creneau.debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
                    : visiteActive.dateVisite ? ` · ${visiteActive.dateVisite}` : ''}
                </p>
              </div>
              <button
                onClick={handleAnnuler}
                className="text-[11px] font-bold text-danger px-2.5 py-1.5 rounded-[8px]"
                style={{ background: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.3)' }}
              >
                Annuler
              </button>
            </div>
          ) : null}
        </div>

        {/* CTA Mes visites */}
        <button
          onClick={() => navigate('/mes-visites')}
          className="w-full flex items-center gap-3.5 p-4 rounded-[16px] mb-6"
          style={{
            background: 'linear-gradient(135deg, #4B6BFF 0%, #7B4BFF 100%)',
            boxShadow: '0 4px 12px rgba(75,107,255,0.3)',
          }}
        >
          <div className="w-11 h-11 rounded-[12px] bg-white/15 flex items-center justify-center flex-shrink-0">
            <CalendarCardIcon />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white text-[15px] font-bold">Mes visites</p>
            <p className="text-white/70 text-[12px]">
              {visitCount} visite{visitCount > 1 ? 's' : ''} au total
            </p>
          </div>
          <ArrowRightSmIcon />
        </button>

        {/* Menu items */}
        <div className="bg-white rounded-[16px] overflow-hidden mb-6">
          <MenuItem icon={<PersonMenuIcon />} label="Modifier le profil" onClick={() => navigate('/profil/edit')} />
          <MenuItem icon={<LockMenuIcon />}   label="Sécurité & Mot de passe" onClick={() => navigate('/profil/password')} />
          <MenuItem icon={<ReceiptMenuIcon />} label="Historique des transactions" onClick={() => {}} />
          <MenuItem icon={<StarMenuIcon />}   label="Donner mon avis" onClick={() => {}} showDivider={false} />
        </div>

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-[14px] rounded-full"
          style={{ backgroundColor: '#FF6B35' }}
        >
          <LogoutIcon />
          <span className="text-white text-[15px] font-bold">Se déconnecter</span>
        </button>
      </div>
    </div>
  )
}
