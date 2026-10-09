import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'
import { useScrolled } from '../context/ScrollContext'
import { useTheme } from '../context/ThemeContext'
import logoUrl from '../assets/REFUGE-LOGO.webp'

// Liens texte : 4 entrées max. Alertes et Messages passent en boutons icône
// (avec badge) à droite, Profil et Mes visites dans le menu de l'avatar.
const NAV_ITEMS = [
  { path: '/',             label: 'Accueil',         authRequired: false },
  { path: '/search',       label: 'Rechercher',      authRequired: false },
  { path: '/favoris',      label: 'Favoris',         authRequired: true  },
  { path: '/nouveau-bien', label: 'Publier un bien', authRequired: true  },
]

const ICON_ITEMS = [
  { path: '/notifications', label: 'Alertes'  },
  { path: '/conversations', label: 'Messages' },
] as const

const ROLE_ROUTES: Record<string, { label: string; path: string }> = {
  proprietaire: { label: 'Espace Propriétaire', path: '/proprietaire' },
  demarcheur:   { label: 'Espace Démarcheur',   path: '/demarcheur'   },
  commercial:   { label: 'Espace Démarcheur',    path: '/demarcheur'   },
  locataire:    { label: 'Espace Locataire',     path: '/locataire'    },
  prospect:     { label: 'Espace Client',        path: '/'             },
}

// Icônes inline légères
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 21a1.94 1.94 0 003.4 0"/>
  </svg>
)
const ChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/>
  </svg>
)
const LogOutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/>
  </svg>
)

export default function TopNav() {
  const { isLoggedIn, user, logout, rolesActifs, activeRole, setActiveRole } = useAuth()
  const { unreadAlertes, unreadMessages } = useNotifications()
  const { scrolled } = useScrolled()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const handleNav = (item: { path: string; authRequired: boolean }) => {
    if (item.authRequired && !isLoggedIn) {
      sessionStorage.setItem('post_login_redirect', item.path)
      navigate('/login')
    } else navigate(item.path)
    setMenuOpen(false)
  }

  const initials = user ? `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase() : ''

  const handleLogout = () => {
    setMenuOpen(false)
    navigate('/')
    requestAnimationFrame(() => requestAnimationFrame(logout))
  }

  // Rôles avec dashboard propre (filtre ceux sans route connue)
  const espacesRoles = rolesActifs.filter(r => ROLE_ROUTES[r])

  const isDark = theme === 'dark'

  const menuItemStyle: React.CSSProperties = { color: isDark ? 'rgba(255,255,255,0.85)' : '#1D1D1F' }

  return (
    <header className={`hidden md:block fixed top-0 left-0 right-0 z-[60] pointer-events-none transition-[padding] duration-300${scrolled ? ' px-3' : ''}`}>
      <nav
        aria-label="Navigation principale"
        className="mx-auto pointer-events-auto flex items-center transition-all duration-300"
        style={{
          background: scrolled
            ? (isDark ? 'rgba(15,15,20,0.90)' : 'rgba(245,245,247,0.88)')
            : (isDark ? 'rgba(15,15,20,0.80)' : 'rgba(245,245,247,0.78)'),
          backdropFilter: 'blur(48px) saturate(180%)',
          WebkitBackdropFilter: 'blur(48px) saturate(180%)',
          borderTopWidth:    scrolled ? '1px' : '0px',
          borderLeftWidth:   scrolled ? '1px' : '0px',
          borderRightWidth:  scrolled ? '1px' : '0px',
          borderBottomWidth: '1px',
          borderStyle: 'solid',
          borderColor: scrolled
            ? (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.09)')
            : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'),
          borderRadius: scrolled ? '1rem' : '0px',
          maxWidth: scrolled ? '72rem' : '100%',
          boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.12)' : 'inset 0 -0.5px 0 rgba(0,0,0,0.04), 0 2px 20px rgba(0,0,0,0.06)',
          height: 72,
          paddingLeft:  scrolled ? '1.25rem' : undefined,
          paddingRight: scrolled ? '1.25rem' : undefined,
        }}
      >
        <div className="w-full px-4 md:px-6 lg:px-16 grid grid-cols-[auto_1fr_auto] items-center gap-3 lg:gap-6">

          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 lg:gap-3 flex-shrink-0">
            <img src={logoUrl} alt="REFUGE" style={{ width: 60, height: 60, objectFit: 'contain', filter: isDark ? 'brightness(1.15) drop-shadow(0 0 6px rgba(0,174,239,0.35))' : 'none' }} className="lg:w-[68px] lg:h-[68px]" />
            {/* #0077B6 en clair : #00AEEF sur fond clair ne passe pas le contraste AA (2,6:1) */}
            <span className="font-extrabold text-xl lg:text-2xl tracking-tight hidden sm:inline" style={{ color: isDark ? '#00AEEF' : '#0077B6' }}>REFUGE</span>
          </button>

          {/* Nav centré */}
          <nav aria-label="Liens rapides" className="flex items-center justify-center gap-0.5 lg:gap-1">
            {NAV_ITEMS.map(item => {
              const active = isActive(item.path)
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item)}
                  className={`relative flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-4 py-2 rounded-xl text-[13px] lg:text-sm font-medium transition-all whitespace-nowrap ${!active ? 'nav-link' : ''}`}
                  style={{
                    color:      active ? '#4B6BFF' : (isDark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.55)'),
                    background: active ? 'rgba(75,107,255,0.12)' : 'transparent',
                    border:     active ? '1px solid rgba(75,107,255,0.25)' : '1px solid transparent',
                    boxShadow:  active ? 'inset 0 1px 0 rgba(255,255,255,0.6)' : 'none',
                  }}
                >
                  {item.label}
                </button>
              )
            })}
          </nav>

          {/* Droite : Alertes, Messages, auth. Le thème se règle dans Profil → Apparence. */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {isLoggedIn && ICON_ITEMS.map(item => {
              const active = isActive(item.path)
              const badge = item.path === '/notifications' ? unreadAlertes : unreadMessages
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  aria-label={item.label + (badge > 0 ? `, ${badge} non lu${badge > 1 ? 's' : ''}` : '')}
                  aria-current={active ? 'page' : undefined}
                  title={item.label}
                  className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    color: active ? '#4B6BFF' : (isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.60)'),
                    background: active ? 'rgba(75,107,255,0.12)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.75)'),
                    border: '1px solid ' + (active ? 'rgba(75,107,255,0.25)' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)')),
                  }}
                >
                  {item.path === '/notifications' ? <BellIcon /> : <ChatIcon />}
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-micro font-bold text-white" style={{ background: '#FF3B30', border: '2px solid ' + (isDark ? '#0F0F14' : '#F5F5F7') }}>
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </button>
              )
            })}

            {/* Auth */}
            {!isLoggedIn ? (
              <div className="flex items-center gap-2 lg:gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="px-3 lg:px-4 py-2 text-[13px] lg:text-sm font-semibold rounded-xl transition-all whitespace-nowrap"
                  style={{
                    color: isDark ? 'rgba(255,255,255,0.85)' : '#1D1D1F',
                    background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.70)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)'),
                    boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  Se connecter
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-3 lg:px-4 py-2 text-[13px] lg:text-sm font-semibold rounded-xl text-white transition-all btn-glow whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)', boxShadow: '0 4px 16px rgba(75,107,255,0.35)' }}
                >
                  S'inscrire
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  aria-label="Menu utilisateur"
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl transition-all"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.75)',
                    backdropFilter: 'blur(32px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(32px) saturate(160%)',
                    border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.95)'),
                    boxShadow: isDark
                      ? '0 4px 16px rgba(0,0,0,0.25)'
                      : 'inset 0 1.5px 0 rgba(255,255,255,1), 0 4px 16px rgba(0,0,0,0.08)',
                  }}
                >
                  {user?.photo_profil ? (
                    <img src={user.photo_profil} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
                      {initials}
                    </div>
                  )}
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-semibold leading-none" style={menuItemStyle}>{user?.prenom} {user?.nom}</p>
                    <p className="text-caption mt-0.5 capitalize" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}>{user?.role}</p>
                  </div>
                  <svg className="w-4 h-4 ml-1" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {menuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2.5 w-60 rounded-2xl overflow-hidden z-50 anim-scale-in"
                    style={{
                      background: isDark ? 'rgba(20,20,28,0.92)' : 'rgba(255,255,255,0.82)',
                      backdropFilter: 'blur(56px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(56px) saturate(180%)',
                      border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.95)'),
                      boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.45)' : 'inset 0 1.5px 0 rgba(255,255,255,1), 0 20px 60px rgba(0,0,0,0.14)',
                    }}
                  >
                    <div className="py-1.5" style={{ borderBottom: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') }}>
                      {[{ path: '/profil', label: 'Mon profil' }, { path: '/mes-visites', label: 'Mes visites' }].map(l => (
                        <button key={l.path} onClick={() => { navigate(l.path); setMenuOpen(false) }} role="menuitem"
                          className="menu-item-hover w-full flex items-center px-4 py-2.5 text-sm font-medium text-left" style={menuItemStyle}>
                          {l.label}
                        </button>
                      ))}
                    </div>
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-micro font-bold uppercase tracking-widest" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)' }}>
                        Mes espaces
                      </p>
                    </div>
                    {espacesRoles.length > 1 ? (
                      /* Multi-rôles : liste des espaces avec bascule silencieuse. */
                      espacesRoles.map(role => {
                        const { label, path } = ROLE_ROUTES[role]
                        const isCurrent = activeRole === role
                        return (
                          <button
                            key={role}
                            onClick={() => { setActiveRole(role); navigate(path); setMenuOpen(false) }}
                            role="menuitem"
                            className="menu-item-hover w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium text-left"
                            style={{ color: isCurrent ? '#4B6BFF' : (isDark ? 'rgba(255,255,255,0.80)' : '#1D1D1F') }}
                          >
                            <span>{label}</span>
                            {isCurrent && (
                              <span className="text-micro font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(75,107,255,0.12)', color: 'var(--tx-blue)' }}>
                                Actif
                              </span>
                            )}
                          </button>
                        )
                      })
                    ) : (
                      /* Rôle unique : le seul "espace" mène au profil. */
                      <button
                        onClick={() => { navigate('/profil'); setMenuOpen(false) }}
                        role="menuitem"
                        className="menu-item-hover w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium text-left"
                        style={{ color: 'var(--tx-blue)' }}
                      >
                        <span>{ROLE_ROUTES[activeRole]?.label || 'Mon profil'}</span>
                        <span className="text-micro font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(75,107,255,0.12)', color: 'var(--tx-blue)' }}>
                          Actif
                        </span>
                      </button>
                    )}
                    <div className="py-1.5 mt-1.5" style={{ borderTop: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') }}>
                      <button onClick={handleLogout} role="menuitem"
                        className="menu-item-hover w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-left" style={{ color: '#FF3B30' }}>
                        <LogOutIcon /> Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
