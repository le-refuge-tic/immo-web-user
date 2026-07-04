import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { path: '/',              label: 'Accueil',  authRequired: false },
  { path: '/favoris',       label: 'Favoris',  authRequired: true  },
  { path: '/notifications', label: 'Alertes',  authRequired: true  },
  { path: '/conversations', label: 'Messages', authRequired: true  },
  { path: '/profil',        label: 'Profil',   authRequired: true  },
]

export default function TopNav() {
  const { isLoggedIn, user, logout } = useAuth()
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
      className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 items-center border-b anim-slide-down"
      style={{
        background: 'rgba(255,255,255,0.07)',
        borderColor: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(48px) saturate(200%)',
        WebkitBackdropFilter: 'blur(48px) saturate(200%)',
        boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.2)',
      }}
    >
      <div className="w-full px-6 md:px-16 grid grid-cols-[auto_1fr_auto] items-center gap-6">

        {/* Logo */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: '#4B6BFF' }}>
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight text-white">REFUGE</span>
        </button>

        {/* Nav centré */}
        <nav className="flex items-center justify-center gap-1">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${!active ? 'nav-link' : ''}`}
                style={{
                  color:       active ? '#ffffff' : 'rgba(255,255,255,0.6)',
                  background:  active ? 'rgba(255,255,255,0.15)' : 'transparent',
                  backdropFilter: active ? 'blur(20px)' : 'none',
                  border:      active ? '1px solid rgba(255,255,255,0.22)' : '1px solid transparent',
                  boxShadow:   active ? 'inset 0 1px 0 rgba(255,255,255,0.3)' : 'none',
                }}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Auth */}
        {!isLoggedIn ? (
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-semibold rounded-lg text-white transition-all"
              style={{
                background: 'rgba(255,255,255,0.10)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.25)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.10)'}
            >
              Se connecter
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 text-sm font-semibold rounded-lg text-black bg-white hover:bg-white/90 transition-all"
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
                background: 'rgba(255,255,255,0.13)',
                backdropFilter: 'blur(32px) saturate(180%)',
                WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.28)',
                boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.45), inset 0 -0.5px 0 rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.2)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.20)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'inset 0 2px 0 rgba(255,255,255,0.6), inset 0 -0.5px 0 rgba(0,0,0,0.1), 0 8px 28px rgba(0,0,0,0.25)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.13)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'inset 0 1.5px 0 rgba(255,255,255,0.45), inset 0 -0.5px 0 rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.2)'
              }}
            >
              {user?.photo_profil ? (
                <img src={user.photo_profil} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#4B6BFF' }}>
                  {initials}
                </div>
              )}
              <div className="text-left">
                <p className="text-sm font-semibold text-white leading-none">{user?.prenom} {user?.nom}</p>
                <p className="text-[11px] mt-0.5 capitalize" style={{ color: 'rgba(255,255,255,0.45)' }}>{user?.role}</p>
              </div>
              <svg className="w-4 h-4 ml-1" style={{ color: 'rgba(255,255,255,0.4)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-2.5 w-56 rounded-2xl overflow-hidden z-50 anim-scale-in"
                style={{
                  background: 'rgba(12,12,35,0.72)',
                  backdropFilter: 'blur(56px) saturate(200%)',
                  WebkitBackdropFilter: 'blur(56px) saturate(200%)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.1), 0 24px 64px rgba(0,0,0,0.55)',
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
                    style={{ color: 'rgba(255,255,255,0.82)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
                  >
                    {item.label}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} />
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-left transition-all"
                  style={{ color: '#FF6B6B' }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'}
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
