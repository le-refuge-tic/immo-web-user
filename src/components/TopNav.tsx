import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { path: '/',              label: 'Accueil',    authRequired: false },
  { path: '/favoris',       label: 'Favoris',    authRequired: false },
  { path: '/notifications', label: 'Alertes',    authRequired: false },
  { path: '/conversations', label: 'Messages',   authRequired: true  },
  { path: '/profil',        label: 'Profil',     authRequired: true  },
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
    if (item.authRequired && !isLoggedIn) {
      navigate('/login')
    } else {
      navigate(item.path)
    }
    setMenuOpen(false)
  }

  const initials = user ? `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase() : ''

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className="hidden md:flex sticky top-0 z-50 bg-white border-b border-divider h-16 items-center">
      <div className="w-full max-w-7xl mx-auto px-6 flex items-center gap-8">

        {/* Logo */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: '#4B6BFF' }}>
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: '#4B6BFF' }}>REFUGE</span>
        </button>

        {/* Nav links — toujours tous les 5, sans filtre auth */}
        <nav className="flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  color:      active ? '#4B6BFF' : '#6B7280',
                  background: active ? 'rgba(75,107,255,0.08)' : 'transparent',
                }}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Auth : boutons si non connecté, avatar dropdown si connecté */}
        {!isLoggedIn ? (
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-divider text-text-dark hover:border-primary hover:text-primary transition-colors"
            >
              Se connecter
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 text-sm font-semibold rounded-lg text-white"
              style={{ background: '#4B6BFF' }}
            >
              S'inscrire
            </button>
          </div>
        ) : (
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-divider hover:border-primary/40 transition-colors"
            >
              {user?.photo_profil ? (
                <img src={user.photo_profil} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#4B6BFF' }}>
                  {initials}
                </div>
              )}
              <div className="text-left">
                <p className="text-sm font-semibold text-text-dark leading-none">{user?.prenom} {user?.nom}</p>
                <p className="text-[11px] text-text-grey mt-0.5 capitalize">{user?.role}</p>
              </div>
              <svg className="w-4 h-4 text-text-grey ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-divider overflow-hidden z-50">
                {[
                  { label: 'Mon profil',     path: '/profil' },
                  { label: 'Mes visites',    path: '/mes-visites' },
                  { label: 'Messages',       path: '/conversations' },
                  { label: 'Favoris',        path: '/favoris' },
                  { label: 'Notifications',  path: '/notifications' },
                ].map(item => (
                  <button key={item.path} onClick={() => { navigate(item.path); setMenuOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-dark hover:bg-surface-g transition-colors text-left">
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-divider" />
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-left" style={{ color: '#EF4444' }}>
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
