import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'
import logoUrl from '../assets/REFUGE-LOGO.png'

const NAV_ITEMS = [
  { path: '/',              label: 'Accueil',  authRequired: false },
  { path: '/favoris',       label: 'Favoris',  authRequired: true  },
  { path: '/notifications', label: 'Alertes',  authRequired: true  },
  { path: '/conversations', label: 'Messages', authRequired: true  },
  { path: '/profil',        label: 'Profil',   authRequired: true  },
]

export default function TopNav() {
  const { isLoggedIn, user, logout } = useAuth()
  const { unreadAlertes, unreadMessages } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleNav = (item: typeof NAV_ITEMS[0]) => {
    if (item.authRequired && !isLoggedIn) navigate('/login')
    else navigate(item.path)
    setMenuOpen(false)
  }

  const initials = user ? `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase() : ''

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header
      className="hidden md:flex fixed top-0 left-0 right-0 z-[60] h-16 items-center anim-slide-down"
      style={{
        background: 'rgba(245,245,247,0.78)',
        backdropFilter: 'blur(48px) saturate(180%)',
        WebkitBackdropFilter: 'blur(48px) saturate(180%)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        boxShadow: 'inset 0 -0.5px 0 rgba(0,0,0,0.04), 0 2px 20px rgba(0,0,0,0.06)',
      }}
    >
      <div className="w-full px-6 md:px-16 grid grid-cols-[auto_1fr_auto] items-center gap-6">

        {/* Logo */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 flex-shrink-0">
          <img src={logoUrl} alt="REFUGE" style={{ width: 46, height: 46, objectFit: 'contain' }} />
          <span className="font-bold text-xl tracking-tight" style={{ color: '#00AEEF' }}>REFUGE</span>
        </button>

        {/* Nav centré */}
        <nav className="flex items-center justify-center gap-1">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.path)
            const badge = item.path === '/notifications' ? unreadAlertes : item.path === '/conversations' ? unreadMessages : 0
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${!active ? 'nav-link' : ''}`}
                style={{
                  color:       active ? '#4B6BFF' : 'rgba(0,0,0,0.55)',
                  background:  active ? 'rgba(75,107,255,0.10)' : 'transparent',
                  border:      active ? '1px solid rgba(75,107,255,0.22)' : '1px solid transparent',
                  boxShadow:   active ? 'inset 0 1px 0 rgba(255,255,255,0.8)' : 'none',
                  backdropFilter: active ? 'blur(20px)' : 'none',
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

        {/* Auth */}
        {!isLoggedIn ? (
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-semibold rounded-xl transition-all"
              style={{
                color: '#1D1D1F',
                background: 'rgba(255,255,255,0.70)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,0,0,0.10)',
                boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 2px 8px rgba(0,0,0,0.06)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.90)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.70)'}
            >
              Se connecter
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 text-sm font-semibold rounded-xl text-white transition-all btn-glow"
              style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)', boxShadow: '0 4px 16px rgba(75,107,255,0.35)' }}
            >
              S'inscrire
            </button>
          </div>
        ) : (
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl transition-all"
              style={{
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(32px) saturate(160%)',
                WebkitBackdropFilter: 'blur(32px) saturate(160%)',
                border: '1px solid rgba(255,255,255,0.95)',
                boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,1), inset 0 -0.5px 0 rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.08)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.92)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'inset 0 2px 0 rgba(255,255,255,1), 0 6px 20px rgba(0,0,0,0.10)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.75)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'inset 0 1.5px 0 rgba(255,255,255,1), inset 0 -0.5px 0 rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.08)'
              }}
            >
              {user?.photo_profil ? (
                <img src={user.photo_profil} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
                  {initials}
                </div>
              )}
              <div className="text-left">
                <p className="text-sm font-semibold leading-none" style={{ color: '#1D1D1F' }}>{user?.prenom} {user?.nom}</p>
                <p className="text-[11px] mt-0.5 capitalize" style={{ color: 'rgba(0,0,0,0.4)' }}>{user?.role}</p>
              </div>
              <svg className="w-4 h-4 ml-1" style={{ color: 'rgba(0,0,0,0.35)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-2.5 w-56 rounded-2xl overflow-hidden z-50 anim-scale-in"
                style={{
                  background: 'rgba(255,255,255,0.82)',
                  backdropFilter: 'blur(56px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(56px) saturate(180%)',
                  border: '1px solid rgba(255,255,255,0.95)',
                  boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,1), 0 20px 60px rgba(0,0,0,0.14)',
                }}
              >
                {[
                  { label: 'Mon profil',    path: '/profil' },
                  { label: 'Mes visites',   path: '/mes-visites' },
                  { label: 'Messages',      path: '/conversations' },
                  { label: 'Favoris',       path: '/favoris' },
                  { label: 'Notifications', path: '/notifications' },
                ].map(item => (
                  <button key={item.path} onClick={() => { navigate(item.path); setMenuOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-all"
                    style={{ color: '#1D1D1F' }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.04)'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
                  >
                    {item.label}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }} />
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-left transition-all"
                  style={{ color: '#FF3B30' }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,59,48,0.06)'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
                >
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
