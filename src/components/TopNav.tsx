import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'
import { useScrolled } from '../context/ScrollContext'
import { useTheme } from '../context/ThemeContext'
import logoUrl from '../assets/REFUGE-LOGO.png'

const NAV_ITEMS = [
  { path: '/',              label: 'Accueil',     authRequired: false },
  { path: '/favoris',       label: 'Favoris',     authRequired: true  },
  { path: '/mes-visites',   label: 'Mes visites', authRequired: true  },
  { path: '/notifications', label: 'Alertes',     authRequired: true  },
  { path: '/conversations', label: 'Messages',    authRequired: true  },
  { path: '/profil',        label: 'Profil',      authRequired: true  },
]

const ROLE_ROUTES: Record<string, { label: string; path: string }> = {
  proprietaire: { label: 'Espace Propriétaire', path: '/proprietaire' },
  demarcheur:   { label: 'Espace Démarcheur',   path: '/demarcheur'   },
  locataire:    { label: 'Espace Locataire',     path: '/locataire'    },
}

// Icônes inline légères
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
)
const LogOutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/>
  </svg>
)

export default function TopNav() {
  const { isLoggedIn, user, logout, rolesActifs, activeRole } = useAuth()
  const { unreadAlertes, unreadMessages } = useNotifications()
  const { scrolled } = useScrolled()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const handleNav = (item: typeof NAV_ITEMS[0]) => {
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
          height: 64,
          paddingLeft:  scrolled ? '1.25rem' : undefined,
          paddingRight: scrolled ? '1.25rem' : undefined,
        }}
      >
        <div className="w-full px-4 md:px-6 lg:px-16 grid grid-cols-[auto_1fr_auto] items-center gap-3 lg:gap-6">

          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2 lg:gap-2.5 flex-shrink-0">
            <img src={logoUrl} alt="REFUGE" style={{ width: 40, height: 40, objectFit: 'contain' }} className="lg:w-[46px] lg:h-[46px]" />
            <span className="font-bold text-lg lg:text-xl tracking-tight hidden sm:inline" style={{ color: '#00AEEF' }}>REFUGE</span>
          </button>

          {/* Nav centré */}
          <nav className="flex items-center justify-center gap-0.5 lg:gap-1">
            {NAV_ITEMS.map(item => {
              const active = isActive(item.path)
              const badge = item.path === '/notifications' ? unreadAlertes : item.path === '/conversations' ? unreadMessages : 0
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
                  {badge > 0 && (
                    <span className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white" style={{ background: '#FF3B30' }}>
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Droite : toggle thème + auth */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Toggle clair/sombre */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{
                color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.50)',
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'),
              }}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

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
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
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
                    <p className="text-[11px] mt-0.5 capitalize" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}>{user?.role}</p>
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
                    {/* Section "Mes espaces" — uniquement si plusieurs rôles */}
                    {espacesRoles.length > 1 && (
                      <>
                        <div className="px-4 pt-3 pb-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)' }}>
                            Mes espaces
                          </p>
                        </div>
                        {espacesRoles.map(role => {
                          const { label, path } = ROLE_ROUTES[role]
                          const isCurrent = activeRole === role
                          return (
                            <button
                              key={role}
                              onClick={() => { navigate(path); setMenuOpen(false) }}
                              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium text-left transition-all"
                              style={{ color: isCurrent ? '#4B6BFF' : (isDark ? 'rgba(255,255,255,0.80)' : '#1D1D1F') }}
                              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
                            >
                              <span>{label}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(75,107,255,0.12)', color: '#4B6BFF' }}>
                                  Actif
                                </span>
                              )}
                            </button>
                          )
                        })}
                        <div style={{ borderTop: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)') }} />
                      </>
                    )}

                    {/* Liens profil standard */}
                    {[
                      { label: 'Mon profil',    path: '/profil' },
                      { label: 'Mes visites',   path: '/mes-visites' },
                      { label: 'Messages',      path: '/conversations' },
                      { label: 'Favoris',       path: '/favoris' },
                      { label: 'Notifications', path: '/notifications' },
                    ].map(item => (
                      <button key={item.path} onClick={() => { navigate(item.path); setMenuOpen(false) }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-all"
                        style={menuItemStyle}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
                      >
                        {item.label}
                      </button>
                    ))}

                    <div style={{ borderTop: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)') }} />

                    {/* Logout avec icône */}
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-left transition-all"
                      style={{ color: '#FF3B30' }}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,59,48,0.08)'}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
                    >
                      <LogOutIcon />
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
