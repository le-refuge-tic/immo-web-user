import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type NavItem = {
  path: string
  label: string
  icon: (active: boolean) => React.ReactNode
  requireAuth?: boolean
}

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const HeartIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
)

const ChatIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const BellIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

const PersonIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

export default function BottomNav() {
  const { isLoggedIn } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const items: NavItem[] = [
    { path: '/', label: 'Accueil', icon: (a) => <HomeIcon active={a} /> },
    { path: '/favoris', label: 'Favoris', icon: (a) => <HeartIcon active={a} /> },
    ...(isLoggedIn ? [{ path: '/conversations', label: 'Messages', icon: (a: boolean) => <ChatIcon active={a} />, requireAuth: true }] : []),
    { path: '/notifications', label: 'Alertes', icon: (a) => <BellIcon active={a} /> },
    ...(isLoggedIn ? [{ path: '/profil', label: 'Profil', icon: (a: boolean) => <PersonIcon active={a} />, requireAuth: true }] : []),
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-nav z-50 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-grey'
              }`}
            >
              {item.icon(active)}
              {active && (
                <span className="text-xs font-bold whitespace-nowrap">{item.label}</span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
