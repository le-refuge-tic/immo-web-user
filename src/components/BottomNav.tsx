import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'
import { useTheme } from '../context/ThemeContext'

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)
const BookmarkIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
)
const BellIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)
const ChatIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)
const PersonIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
// 5 entrées, même ordre que l'app mobile. « Mes visites » est accessible
// depuis le Profil (l'onglet Profil reste actif sur /mes-visites).
const NAV_ITEMS = [
  { path: '/',              label: 'Accueil',  icon: HomeIcon,     authRequired: false, also: [] as string[] },
  { path: '/favoris',       label: 'Favoris',  icon: BookmarkIcon, authRequired: true,  also: [] },
  { path: '/conversations', label: 'Messages', icon: ChatIcon,     authRequired: true,  also: [] },
  { path: '/notifications', label: 'Alertes',  icon: BellIcon,     authRequired: true,  also: [] },
  { path: '/profil',        label: 'Profil',   icon: PersonIcon,   authRequired: true,  also: ['/mes-visites', '/mes-roles', '/portefeuille'] },
]

export default function BottomNav() {
  const { isLoggedIn } = useAuth()
  const { unreadAlertes, unreadMessages } = useNotifications()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.path === '/') return location.pathname === '/'
    return [item.path, ...item.also].some(p => location.pathname.startsWith(p))
  }

  const handleNav = (item: typeof NAV_ITEMS[0]) => {
    if (item.authRequired && !isLoggedIn) {
      sessionStorage.setItem('post_login_redirect', item.path)
      navigate('/login')
    } else navigate(item.path)
  }

  const inactiveColor = isDark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.55)'

  return (
    <nav
      aria-label="Navigation principale mobile"
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{
        background: isDark ? 'rgba(20,22,30,0.95)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderTop: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2 md:hidden">
        {NAV_ITEMS.map(item => {
          const active = isActive(item)
          const Icon = item.icon
          const badge = item.path === '/conversations' ? unreadMessages : item.path === '/notifications' ? unreadAlertes : 0
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item)}
              aria-label={item.label + (badge > 0 ? `, ${badge} non lu${badge > 1 ? 's' : ''}` : '')}
              aria-current={active ? 'page' : undefined}
              className="relative flex flex-col items-center gap-0.5 px-2 py-2 min-w-[56px] rounded-2xl transition-all duration-200 btn-press"
              style={{
                background: active ? 'rgba(75,107,255,0.12)' : 'transparent',
                border: active ? '1px solid rgba(75,107,255,0.20)' : '1px solid transparent',
              }}
            >
              <span className="relative" style={{ color: active ? '#4B6BFF' : inactiveColor }}>
                <Icon active={active} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 flex items-center justify-center min-w-[15px] h-[15px] px-[3px] rounded-full text-micro font-bold text-white" style={{ background: '#FF3B30' }}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span className="text-micro font-semibold" style={{ color: active ? (isDark ? '#9DB0FF' : '#3A5AEE') : isDark ? 'rgba(255,255,255,0.7)' : '#5E5E63' }}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
