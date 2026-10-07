import { useTheme } from '../../context/ThemeContext'
import type { ThemePreference } from '../../context/ThemeContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { userApi } from '../../api/userApi'
import { visitesApi } from '../../api/visitesApi'
import { walletApi } from '../../api/walletApi'
import EditProfileModal from './EditProfileModal'
import ChangePasswordModal from './ChangePasswordModal'
import NumeroRetraitModal from '../../components/wallet/NumeroRetraitModal'
import { bienTypeLabel } from '../../utils/bienType'
import { usePageTitle } from '../../utils/usePageTitle'

const ROLE_LABELS: Record<string, string> = {
  prospect:   'Prospect',
  locataire:  'Locataire',
  proprietaire: 'Propriétaire',
  demarcheur: 'Démarcheur',
  admin:      'Admin',
  super_admin: 'Super Admin',
}

// SVG icons
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
const KeyMenuIcon = () => (
  <svg className="w-5 h-5 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
)
const WalletMenuIcon = () => (
  <svg className="w-5 h-5 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2 2 0 00-2-2H5a2 2 0 00-2 2m18 0v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6m18 0v-1a2 2 0 00-2-2H5a2 2 0 00-2 2v1m14 3h.01" />
  </svg>
)
const PhoneMenuIcon = () => (
  <svg className="w-5 h-5 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
)
const UsersMenuIcon = () => (
  <svg className="w-5 h-5 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const CalendarMenuIcon = () => (
  <svg className="w-5 h-5 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const MoonMenuIcon = () => (
  <svg className="w-5 h-5 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
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
  creneau?: { debut: string; bien?: { id?: number; type?: string; localisation?: { ville?: string; quartier?: string } } }
  bien?: { id?: number; type?: string; localisation?: { ville?: string; quartier?: string } }
  feedback_donne?: boolean
  note_client?: number | null
  feedback_tags?: string[]
  feedback_libre?: string
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
      <p className="text-micro text-text-grey">{label}</p>
    </div>
  )
}

type MenuItemProps = {
  icon: React.ReactNode
  label: string
  /** Valeur actuelle affichée à droite (ex. numéro masqué, nombre de visites). */
  value?: string
  onClick: () => void
  showDivider?: boolean
}

function MenuItem({ icon, label, value, onClick, showDivider = true }: MenuItemProps) {
  return (
    <>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-black/5 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
      >
        {icon}
        <span className="flex-1 min-w-0 text-left text-sm text-text-dark font-medium">{label}</span>
        {value && <span className="text-xs text-text-grey truncate max-w-[40%]">{value}</span>}
        <ChevronRightIcon />
      </button>
      {showDivider && <div className="h-px bg-divider ml-[50px]" />}
    </>
  )
}

function MenuGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="space-y-2">
      <h2 className="px-1 text-micro font-bold uppercase tracking-wider text-text-grey">{title}</h2>
      <div className="glass-card rounded-[16px] overflow-hidden">{children}</div>
    </section>
  )
}

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light',  label: 'Clair'   },
  { value: 'dark',   label: 'Sombre'  },
  { value: 'system', label: 'Système' },
]

/** Seul endroit de l'app où l'on choisit le thème. */
function AppearanceRow() {
  const { preference, setPreference } = useTheme()
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-center gap-3.5 mb-3">
        <MoonMenuIcon />
        <span id="apparence-label" className="flex-1 text-sm text-text-dark font-medium">Apparence</span>
      </div>
      <div role="radiogroup" aria-labelledby="apparence-label" className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06]">
        {THEME_OPTIONS.map(o => {
          const selected = preference === o.value
          return (
            <button
              key={o.value}
              role="radio"
              aria-checked={selected}
              onClick={() => setPreference(o.value)}
              className={`py-2 rounded-lg text-[13px] font-semibold transition-all ${selected ? 'bg-white dark:bg-white/15 text-primary dark:text-white shadow-sm' : 'text-text-grey'}`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      {preference === 'system' && <p className="text-caption text-text-grey mt-2">Suit le réglage de votre téléphone ou ordinateur.</p>}
    </div>
  )
}

export default function ProfilePage() {
  usePageTitle('Profil')
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [apiUser, setApiUser] = useState<any>(null)
  const [visites, setVisites] = useState<Visite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [numeroInfo, setNumeroInfo] = useState<{ masque: string | null } | null>(null)
  const [numeroOpen, setNumeroOpen] = useState(false)
  const [confirmAnnulerVisite, setConfirmAnnulerVisite] = useState(false)

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
          setVisites(list as unknown as Visite[]) // type local divergent de types/api (FE-A-003)
        }
      } catch (_) {}
      setIsLoading(false)
    }
    load()
    walletApi.numeroRetrait().then(setNumeroInfo).catch(() => {})
  }, [])

  if (!user) return null

  const initials = `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase()
  const fullName = `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Utilisateur'
  const role = user.role
  const roleLabel = ROLE_LABELS[role] || role

  const visitCount = visites.filter(v => v.statut !== 'annulee').length
  const score = (Number(apiUser?.nb_etoiles) || 0) * 20

  const visiteActive = visites.find(v => v.statut === 'en_attente' || v.statut === 'confirmee')
  const mesAvis = visites.filter(v => v.statut === 'effectuee' && v.feedback_donne && v.note_client != null)

  const handleLogout = () => {
    // La révocation serveur est faite par logout() (AuthContext).
    // Naviguer vers l'accueil D'ABORD, puis vider le contexte auth seulement
    // après deux frames (donne à React le temps de démonter /profil, qui est
    // protégé par PrivateRoute). Sinon PrivateRoute est encore monté quand
    // isLoggedIn passe à false : son propre effet de redirection vers
    // /login s'exécute après coup et écrase cette navigation vers l'accueil,
    // même si logout() est appelé après navigate() — un simple setTimeout(0)
    // ne suffit pas, la course a été vérifiée empiriquement.
    navigate('/', { replace: true })
    requestAnimationFrame(() => requestAnimationFrame(logout))
  }

  const handleAnnuler = async () => {
    if (!visiteActive) return
    setConfirmAnnulerVisite(false)
    // Recharger même en cas d'erreur réseau — le serveur a peut-être traité la
    // demande (cold start Render) et l'état affiché doit refléter la réalité.
    try {
      await visitesApi.annuler(visiteActive.id)
    } catch (_) {
    } finally {
      try {
        const data = await visitesApi.mesVisites()
        setVisites((Array.isArray(data) ? data : data.data || []) as unknown as Visite[])
      } catch (_) {}
    }
  }

  const AvatarBlock = ({ size = 88 }: { size?: number }) => (
    <div className="relative inline-block">
      {user.photo_profil ? (
        <img loading="lazy" src={user.photo_profil} alt="" className="rounded-full object-cover" style={{ width: size, height: size, border: '3px solid #4B6BFF' }} />
      ) : (
        <div className="rounded-full flex items-center justify-center" style={{ width: size, height: size, background: 'linear-gradient(135deg, #4B6BFF 0%, #7B4BFF 100%)' }}>
          <span className="text-white font-bold" style={{ fontSize: size * 0.36 }}>{initials}</span>
        </div>
      )}
      <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: '#4CAF50' }} />
    </div>
  )

  const StatsRow = () => (
    <div className="flex gap-3">
      <StatBadge icon={<CalendarStatIcon />} value={String(visitCount)} label="Visites" color="#4B6BFF" bg="rgba(75,107,255,0.08)" border="rgba(75,107,255,0.15)" />
      <StatBadge icon={<ShieldIcon />} value={String(score)} label="Score" color="#15803D" bg="rgba(76,175,80,0.08)" border="rgba(76,175,80,0.15)" />
      <StatBadge icon={<StarMenuIcon />} value={String(mesAvis.length)} label="Avis" color="#B45309" bg="rgba(245,158,11,0.08)" border="rgba(245,158,11,0.18)" />
    </div>
  )

  const MenuBlocks = () => (
    <>
      <MenuGroup title="Mon compte">
        <MenuItem icon={<PersonMenuIcon />}   label="Modifier le profil" onClick={() => setEditOpen(true)} />
        <MenuItem icon={<CalendarMenuIcon />} label="Mes visites" value={visiteActive ? '1 en cours' : String(visitCount)} onClick={() => navigate('/mes-visites')} />
        <MenuItem icon={<UsersMenuIcon />}    label="Rôles et espaces" value={roleLabel} onClick={() => navigate('/mes-roles')} />
        <MenuItem icon={<KeyMenuIcon />}      label="Rejoindre un bien (code d'invitation)" onClick={() => navigate('/rejoindre-bien')} showDivider={false} />
      </MenuGroup>
      <MenuGroup title="Paiements">
        <MenuItem icon={<WalletMenuIcon />}  label="Mon portefeuille" onClick={() => navigate('/portefeuille')} />
        <MenuItem icon={<PhoneMenuIcon />}   label="Numéro de retrait MoMo" value={numeroInfo?.masque ?? undefined} onClick={() => setNumeroOpen(true)} />
        <MenuItem icon={<ReceiptMenuIcon />} label="Mes transactions" onClick={() => navigate('/mes-paiements')} showDivider={false} />
      </MenuGroup>
      <MenuGroup title="Paramètres">
        <AppearanceRow />
        <div className="h-px bg-divider ml-[50px]" />
        <MenuItem icon={<LockMenuIcon />} label="Sécurité et mot de passe" onClick={() => setPasswordOpen(true)} />
        <MenuItem icon={<StarMenuIcon />} label="Donner mon avis" onClick={() => navigate('/mes-visites')} showDivider={false} />
      </MenuGroup>
    </>
  )

  const MesAvisBlock = () => (
    mesAvis.length === 0 ? null : (
      <div className="glass-card rounded-[16px] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-text-dark text-sm">Mes avis</h3>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">{mesAvis.length}</span>
        </div>
        <div className="space-y-3">
          {mesAvis.map(v => (
            <div key={v.id} className="rounded-[12px] p-3" style={{ background: '#F59E0B0D', border: '1px solid #F59E0B26' }}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-text-dark truncate">
                  {v.bien ? bienTypeLabel(v.bien) : 'Bien'}
                  {v.bien?.localisation?.quartier ? ` — ${v.bien.localisation.quartier}` : ''}
                </p>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {[1, 2, 3, 4, 5].map(n => (
                    <svg key={n} viewBox="0 0 24 24" className="w-3.5 h-3.5" fill={n <= (v.note_client ?? 0) ? '#B45309' : 'none'} stroke="#F59E0B" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  ))}
                </div>
              </div>
              {v.feedback_tags && v.feedback_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {v.feedback_tags.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded text-micro font-semibold" style={{ background: '#F59E0B18', color: 'var(--tx-amber)' }}>{t}</span>
                  ))}
                </div>
              )}
              {v.feedback_libre && <p className="text-xs text-text-grey italic">« {v.feedback_libre} »</p>}
            </div>
          ))}
        </div>
      </div>
    )
  )

  const VisiteActiveBlock = () => {
    if (!visiteActive) return null
    const bien = visiteActive.bien || visiteActive.creneau?.bien
    const bienId = bien?.id
    const typeStr = bien ? bienTypeLabel(bien) : 'Bien'
    const lieu = bien?.localisation ? (bien.localisation.quartier || bien.localisation.ville) : null
    const dateStr = visiteActive.creneau?.debut
      ? new Date(visiteActive.creneau.debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
      : visiteActive.dateVisite || null
    const goToBien = () => { if (bienId) navigate(`/biens/${bienId}`) }

    return (
      <div
        onClick={goToBien}
        role={bienId ? 'button' : undefined}
        tabIndex={bienId ? 0 : undefined}
        onKeyDown={e => { if (bienId && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); goToBien() } }}
        className={`glass-card rounded-[14px] p-3.5 flex items-center gap-3 ${bienId ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
      >
        <div className="w-[42px] h-[42px] rounded-[11px] bg-primary/10 flex items-center justify-center flex-shrink-0">
          <EyeActiveIcon />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-text-dark">{visiteActive.statut === 'confirmee' ? 'Visite confirmée' : 'Visite en attente'}</p>
          <p className="text-caption text-text-grey mt-0.5 truncate">
            {typeStr}
            {lieu ? ` — ${lieu}` : ''}
            {dateStr ? ` · ${dateStr}` : ''}
          </p>
        </div>
        {bienId && (
          <svg className="w-4 h-4 flex-shrink-0 text-text-grey/50" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
        {confirmAnnulerVisite ? (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={e => { e.stopPropagation(); handleAnnuler() }} className="text-caption font-bold text-white px-2.5 py-1.5 rounded-[8px]" style={{ background: '#DC2626' }}>Confirmer</button>
            <button onClick={e => { e.stopPropagation(); setConfirmAnnulerVisite(false) }} className="text-caption font-bold px-2 py-1.5 rounded-[8px]" style={{ background: 'rgba(0,0,0,0.06)', color: '#6B7280' }}>✕</button>
          </div>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); setConfirmAnnulerVisite(true) }}
            className="text-caption font-bold text-danger px-2.5 py-1.5 rounded-[8px] flex-shrink-0"
            style={{ background: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.3)' }}>
            Annuler
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Une seule mise en page : 1 colonne sur téléphone/tablette, identité à gauche + réglages à droite sur desktop. */}
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-8 lg:pt-10 pb-28 md:pb-12">
        <h1 className="text-xl lg:text-2xl font-bold text-text-dark mb-5 lg:mb-8">Profil</h1>
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-5 lg:gap-6 items-start">

          {/* Identité */}
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="glass-card rounded-2xl p-5 md:p-6 flex flex-col items-center text-center gap-3">
              <AvatarBlock size={88} />
              <div>
                <p className="text-[18px] font-bold text-text-dark">{fullName}</p>
                {(apiUser?.email || user.email) && <p className="text-[13px] text-text-grey mt-1 break-all">{apiUser?.email || user.email}</p>}
                <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-3.5 py-1 rounded-full mt-2">{roleLabel}</span>
              </div>
              <StatsRow />
            </div>
            {isLoading ? (
              <div className="flex justify-center py-4"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : <VisiteActiveBlock />}
          </div>

          {/* Réglages */}
          <div className="space-y-5 min-w-0">
            <MenuBlocks />
            <MesAvisBlock />
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-[14px] rounded-2xl font-bold text-white" style={{ backgroundColor: '#C2410C' }}>
              <LogoutIcon />
              <span className="text-[15px]">Se déconnecter</span>
            </button>
          </div>
        </div>
      </div>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      {numeroOpen && (
        <NumeroRetraitModal
          current={numeroInfo?.masque ?? null}
          onClose={() => setNumeroOpen(false)}
          onSaved={() => { setNumeroOpen(false); walletApi.numeroRetrait().then(setNumeroInfo).catch(() => {}) }}
        />
      )}
    </div>
  )
}
