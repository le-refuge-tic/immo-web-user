import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationsContext'
import BienDetailPage from './BienDetailPage'
import logoUrl from '../../assets/REFUGE-LOGO.png'

const BLUE = '#4B6BFF'

type Tab = 'tableau' | 'biens' | 'reservations' | 'messages' | 'loyers' | 'portefeuille' | 'transactions' | 'roles' | 'profil'

const NAV_ITEMS: { key: Tab; label: string }[] = [
  { key: 'tableau',      label: 'Tableau' },
  { key: 'biens',        label: 'Mes biens' },
  { key: 'reservations', label: 'Réservations' },
  { key: 'loyers',       label: 'Loyers' },
  { key: 'messages',     label: 'Messages' },
  { key: 'portefeuille', label: 'Portefeuille' },
  { key: 'profil',       label: 'Profil' },
]

const TABS_MOBILE: { key: Tab; label: string }[] = [
  { key: 'tableau',       label: 'Tableau' },
  { key: 'biens',         label: 'Mes biens' },
  { key: 'reservations',  label: 'Réservations' },
  { key: 'loyers',        label: 'Loyers' },
  { key: 'portefeuille',  label: 'Portefeuille' },
  { key: 'profil',        label: 'Profil' },
]

export default function ProprietaireBienWrapper() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { unreadMessages, unreadAlertes } = useNotifications()
  const fromDashboard = !!(location.state as any)?.fromDashboard
  const [isScrolled, setIsScrolled] = useState(fromDashboard)
  const [menuOpen, setMenuOpen] = useState(false)

  // Animation pill → pleine largeur à l'arrivée depuis le dashboard
  useEffect(() => {
    if (!fromDashboard) return
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsScrolled(false))
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()

  const goToTab = (tab: Tab) => {
    navigate('/proprietaire', { state: { tab, fromDetail: true } })
  }

  return (
    <div className="proprio-root proprio-light flex flex-col h-dvh overflow-hidden"
      style={{ background: 'var(--p-deep)' }}>

      {/* ── Navbar (même comportement que le dashboard) ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 pointer-events-none${isScrolled ? ' px-2' : ''}`}>
        <nav
          className="mx-auto pointer-events-auto border backdrop-blur-xl transition-all duration-300"
          style={{
            background: isScrolled ? 'var(--p-surface-glass)' : 'var(--p-surface)',
            borderColor: 'var(--p-border)',
            borderBottomWidth: '1px',
            borderTopWidth: isScrolled ? '1px' : '0px',
            borderLeftWidth: isScrolled ? '1px' : '0px',
            borderRightWidth: isScrolled ? '1px' : '0px',
            borderRadius: isScrolled ? '1rem' : '0px',
            marginTop: isScrolled ? '8px' : '0px',
            maxWidth: isScrolled ? '72rem' : '100%',
            paddingLeft: isScrolled ? '1rem' : '0.75rem',
            paddingRight: isScrolled ? '1rem' : '0.75rem',
            boxShadow: isScrolled ? '0 8px 32px rgba(0,0,0,0.14)' : '0 1px 0 rgba(75,107,255,0.08)',
          }}
        >
          <div className="flex items-center gap-3 py-3">

            {/* Logo */}
            <button onClick={() => navigate('/proprietaire')} className="flex items-center gap-2 flex-shrink-0">
              <img src={logoUrl} alt="REFUGE" className="w-8 h-8 rounded-[8px] object-contain" />
              <span className="hidden sm:block font-black text-[13px] tracking-tight" style={{ color: BLUE }}>REFUGE</span>
            </button>

            {/* Retour Mes biens */}
            <button
              onClick={() => navigate('/proprietaire', { state: { tab: 'biens', fromDetail: true } })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors"
              style={{ borderColor: 'var(--p-border)', background: 'var(--p-card)', color: 'var(--p-muted)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              Mes biens
            </button>

            {/* Tabs desktop */}
            <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
              {NAV_ITEMS.map(item => {
                const active = item.key === 'biens'
                const badge = item.key === 'messages' ? unreadMessages : 0
                return (
                  <button key={item.key}
                    onClick={() => goToTab(item.key)}
                    className="relative whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.1em] px-3 py-2 rounded-lg"
                    style={{
                      ...(active ? { color: BLUE, background: BLUE + '14' } : { color: 'var(--p-muted)' }),
                      minHeight: 36,
                      transition: 'color 0.2s ease, background 0.2s ease',
                    }}>
                    {item.label}
                    {badge > 0 && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: '#FF3B30' }} />}
                  </button>
                )
              })}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Alertes */}
              <button onClick={() => navigate('/notifications')}
                className="relative w-8 h-8 rounded-lg flex items-center justify-center border transition-colors"
                style={{ borderColor: 'var(--p-border)', background: 'var(--p-card)', color: 'var(--p-muted)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadAlertes > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: '#FF3B30' }} />}
              </button>

              {/* Avatar → profil */}
              <button onClick={() => goToTab('profil')}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 border transition-colors"
                style={{ borderColor: 'var(--p-border)', background: 'var(--p-card)' }}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: BLUE }}>
                  {initials || '?'}
                </div>
                <span className="hidden lg:block text-[13px] font-semibold truncate max-w-[96px]"
                  style={{ color: 'var(--p-text)' }}>
                  {user?.prenom || ''}
                </span>
              </button>

              {/* Déconnexion — desktop */}
              <button onClick={() => { logout(); navigate('/login') }}
                className="hidden xl:flex w-8 h-8 rounded-lg items-center justify-center border transition-colors"
                style={{ borderColor: 'var(--p-border)', background: 'var(--p-card)', color: '#EF4444' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>

              {/* Hamburger — mobile (< md) */}
              <button onClick={() => setMenuOpen(o => !o)}
                className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center border"
                style={{ borderColor: 'var(--p-border)', background: 'var(--p-card)', color: 'var(--p-muted)' }}>
                <div style={{ width: 18, height: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <span style={{ display: 'block', height: 2, borderRadius: 2, background: 'currentColor', transformOrigin: 'center', transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)', transform: menuOpen ? 'translateY(6px) rotate(45deg)' : 'translateY(0px) rotate(0deg)' }} />
                  <span style={{ display: 'block', height: 2, borderRadius: 2, background: 'currentColor', transition: 'opacity 0.25s ease, transform 0.35s cubic-bezier(0.4,0,0.2,1)', opacity: menuOpen ? 0 : 1, transform: menuOpen ? 'scaleX(0)' : 'scaleX(1)' }} />
                  <span style={{ display: 'block', height: 2, borderRadius: 2, background: 'currentColor', transformOrigin: 'center', transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)', transform: menuOpen ? 'translateY(-6px) rotate(-45deg)' : 'translateY(0px) rotate(0deg)' }} />
                </div>
              </button>
            </div>
          </div>

          {/* Dropdown mobile — toujours monté, animé */}
          <div className="md:hidden overflow-hidden"
            style={{
              maxHeight: menuOpen ? '480px' : 0,
              transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
            }}>
            <div className="border-t pb-4 pt-3"
              style={{
                borderColor: 'var(--p-border)',
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? 'translateY(0)' : 'translateY(-6px)',
                transition: 'opacity 0.25s ease 0.05s, transform 0.28s cubic-bezier(0.4,0,0.2,1) 0.05s',
              }}>
              <div className="grid grid-cols-4 gap-1">
                {TABS_MOBILE.map(item => {
                  const active = item.key === 'biens'
                  return (
                    <button key={item.key}
                      onClick={() => { goToTab(item.key); setMenuOpen(false) }}
                      className="flex flex-col items-center gap-1 py-3 rounded-xl text-[11px] font-medium transition-all"
                      style={active ? { color: BLUE, background: BLUE + '14', fontWeight: 700 } : { color: 'var(--p-muted)' }}>
                      <span className="truncate w-full text-center px-1">{item.label}</span>
                    </button>
                  )
                })}
                <button onClick={() => { logout(); navigate('/login') }}
                  className="flex flex-col items-center gap-1 py-3 rounded-xl text-[11px] font-medium"
                  style={{ color: '#EF4444' }}>
                  <span>Quitter</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* ── Contenu (décalé sous la navbar fixe de 4rem) ── */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{ paddingTop: '4rem' }}>
        <div
          className="flex-1 overflow-y-auto"
          onScroll={e => setIsScrolled(e.currentTarget.scrollTop > 40)}
        >
          <BienDetailPage showOwnBack={false} />
        </div>
      </div>
    </div>
  )
}
