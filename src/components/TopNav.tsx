import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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

  const initials = user
    ? `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase()
    : ''

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className="hidden md:flex sticky top-0 z-50 bg-white border-b border-divider h-16 items-center">
      <div className="w-full max-w-7xl mx-auto px-6 flex items-center gap-8">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 flex-shrink-0"
        >
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{ background: '#4B6BFF' }}
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: '#4B6BFF' }}>REFUGE</span>
        </button>

        {/* Nav links */}
        <nav className="flex items-center gap-1 flex-1">
          {[
            { path: '/', label: 'Accueil' },
            { path: '/search?transaction=location', label: 'Louer' },
            { path: '/search?transaction=vente', label: 'Acheter' },
            { path: '/search', label: 'Toutes les annonces' },
          ].map(link => (
            <button
              key={link.label}
              onClick={() => navigate(link.path)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                color: isActive(link.path === '/' ? link.path : link.path.split('?')[0])
                  ? '#4B6BFF'
                  : '#6B7280',
                background: isActive(link.path === '/' ? link.path : link.path.split('?')[0])
                  ? 'rgba(75,107,255,0.08)'
                  : 'transparent',
              }}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Auth */}
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
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: '#4B6BFF' }}
                >
                  {initials}
                </div>
              )}
              <div className="text-left">
                <p className="text-sm font-semibold text-text-dark leading-none">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-[11px] text-text-grey mt-0.5 capitalize">{user?.role}</p>
              </div>
              <svg className="w-4 h-4 text-text-grey ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-divider overflow-hidden z-50">
                {[
                  { label: 'Mon profil', path: '/profil', icon: 'person' },
                  { label: 'Mes visites', path: '/mes-visites', icon: 'calendar' },
                  { label: 'Messages', path: '/conversations', icon: 'chat' },
                  { label: 'Favoris', path: '/favoris', icon: 'heart' },
                ].map(item => (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMenuOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-dark hover:bg-surface-g transition-colors text-left"
                  >
                    <DropdownIcon name={item.icon} />
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-divider" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-left"
                  style={{ color: '#EF4444' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
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

function DropdownIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactElement> = {
    person: <svg className="w-4 h-4 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    calendar: <svg className="w-4 h-4 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    chat: <svg className="w-4 h-4 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
    heart: <svg className="w-4 h-4 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  }
  return icons[name] || <div className="w-4 h-4" />
}
