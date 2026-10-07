import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationsContext'
import { biensApi } from '../../api/biensApi'
import { visitesApi } from '../../api/visitesApi'
import { userApi } from '../../api/userApi'
import { loyersApi } from '../../api/loyersApi'
import logoUrl from '../../assets/REFUGE-LOGO.png'
import villaImg from '../../assets/login/villa.jpg'
import PropertyStatsCard from '../../components/PropertyStatsCard'
import { AnimatedGroup } from '../../components/ui/animated-group'
import { motion, AnimatePresence } from 'framer-motion'
import { usePageTitle } from '../../utils/usePageTitle'
import { IcPayments, IcChevron, IcMessagesNav } from './tabs/icons'
import { IcHome, IcCal, IcClock, IcWallet, IcPlus, IcStar, IcShield, IcPin, IcLogout, BLUE, ROLE_LABELS, ROLE_ROUTES, TABS, NAV_ITEMS, typeLabel, bienLabel, bienComposition, fmtPrix, statutBien, buildRevenueSeries, buildCountSeries, LiveIndicator } from './tabs/shared'
import type { Tab } from './tabs/shared'
import { MesBiensTab } from './tabs/MesBiensTab'
import { NotificationsTab } from './tabs/NotificationsTab'
import { MessagesTab } from './tabs/MessagesTab'
import { ReservationsTab } from './tabs/ReservationsTab'
import { LoyersTab } from './tabs/LoyersTab'
import { CreneauxTab } from './tabs/CreneauxTab'
import { PortefeuilleTab } from './tabs/PortefeuilleTab'
import { TransactionsTab } from './tabs/TransactionsTab'
import { RolesTab } from './tabs/RolesTab'
import { ProfilTab } from './tabs/ProfilTab'

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ProprietaireDashboard() {
  usePageTitle('Espace propriétaire')
  const { user: authUser, logout, rolesActifs, activeRole, setActiveRole } = useAuth()
  const { unreadMessages, unreadAlertes, refresh: refreshNotifications } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const [isDark, setIsDark] = useState(false)
  const fromDetail = !!(location.state as any)?.fromDetail
  const [isScrolled, setIsScrolled] = useState(fromDetail)
  const [menuOpen, setMenuOpen] = useState(false)
  const tabMounted = useRef(false)
  const [rolesMenuOpen, setRolesMenuOpen] = useState<'sidebar' | 'topbar' | null>(null)
  // Le trigger et le panneau du menu ne se touchent pas (marge de quelques px
  // entre les deux) : sans délai, quitter le trigger pour aller vers le
  // panneau traverse un instant une zone hors des deux éléments et ferme le
  // menu avant même de l'atteindre. On referme donc après un court délai,
  // annulé si le pointeur ré-entre sur le trigger OU le panneau entre-temps.
  const rolesMenuCloseTimer = useRef<number | null>(null)
  const openRolesMenu = (which: 'sidebar' | 'topbar') => {
    if (rolesMenuCloseTimer.current != null) { clearTimeout(rolesMenuCloseTimer.current); rolesMenuCloseTimer.current = null }
    setRolesMenuOpen(which)
  }
  const scheduleCloseRolesMenu = () => {
    if (rolesMenuCloseTimer.current != null) clearTimeout(rolesMenuCloseTimer.current)
    rolesMenuCloseTimer.current = window.setTimeout(() => setRolesMenuOpen(null), 250)
  }
  useEffect(() => () => { if (rolesMenuCloseTimer.current != null) clearTimeout(rolesMenuCloseTimer.current) }, [])
  // Le flyout sidebar utilise position:fixed avec des coordonnées calculées
  // au survol — la <nav> du menu est overflow-y-auto, ce qui rend son
  // overflow-x implicitement non "visible" (spec CSS) et couperait un
  // absolute positionné "left-full" en dehors de sa boîte.
  const goToRoleSpace = (role: string) => {
    setActiveRole(role)
    navigate(ROLE_ROUTES[role] || '/')
  }
  const [tab, setTab] = useState<Tab>((location.state as any)?.tab ?? 'tableau')
  const [messagesInitConvId, setMessagesInitConvId] = useState<number | null>((location.state as any)?.convId ?? null)
  const [messagesInitDraft, setMessagesInitDraft] = useState<string | null>(null)
  const openTab = (t: Tab, convId?: number, draftMessage?: string) => {
    if (t === 'messages') {
      if (convId != null) setMessagesInitConvId(convId)
      if (draftMessage != null) setMessagesInitDraft(draftMessage)
    }
    setTab(t)
  }
  // Ignore le premier montage : isScrolled est déjà à la bonne valeur initiale
  // (pill si on vient du détail, false sinon). Les changements de tab suivants
  // remettent bien à zéro.
  useEffect(() => {
    if (!tabMounted.current) { tabMounted.current = true; return }
    setIsScrolled(false)
    setMenuOpen(false)
    if (tab !== 'messages') { setMessagesInitConvId(null); setMessagesInitDraft(null) }
  }, [tab])

  // Animation pill → pleine largeur à l'arrivée depuis la page détail
  useEffect(() => {
    if (!fromDetail) return
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsScrolled(false))
    })
    return () => cancelAnimationFrame(id)
  }, [])
  const carousel2Ref = useRef<HTMLDivElement>(null)
  const [carousel2Paused, setCarousel2Paused] = useState(false)
  const [carousel2Idx, setCarousel2Idx] = useState(0)

  const [user, setUser] = useState<any>(null)
  const [biens, setBiens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loyersDash, setLoyersDash] = useState<any>(null)
  const [visites, setVisites] = useState<any[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [chartPeriod, setChartPeriod] = useState<3 | 6 | 12>(6)
  const [hoveredOverviewEl, setHoveredOverviewEl] = useState<string | null>(null)

  const loadData = async (silent = false) => {
    if (silent) setRefreshing(true)
    try {
      const [u, b, l, v] = await Promise.allSettled([
        userApi.me(), biensApi.mesBiens(), loyersApi.dashboard(), visitesApi.reservationsRecues(),
      ])
      if (u.status === 'fulfilled') setUser(u.value?.user || u.value)
      if (b.status === 'fulfilled') setBiens(Array.isArray(b.value) ? b.value : b.value.data || [])
      if (l.status === 'fulfilled') setLoyersDash(l.value)
      if (v.status === 'fulfilled') setVisites(Array.isArray(v.value) ? v.value : v.value.data || [])
      setLastUpdated(new Date())
    } catch (_) {}
    setLoading(false)
    setRefreshing(false)
  }

  // Tableau de bord "temps réel" : première charge immédiate, puis on
  // rafraîchit silencieusement toutes les 30s (et quand l'onglet redevient
  // visible) tant qu'on reste sur l'onglet Tableau — pas de spinner plein
  // écran pour ces rafraîchissements, juste l'horodatage qui bouge.
  useEffect(() => { loadData() }, [])
  useEffect(() => {
    if (tab !== 'tableau') return
    const id = setInterval(() => loadData(true), 30000)
    const onVisible = () => { if (document.visibilityState === 'visible') loadData(true) }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible) }
  }, [tab])

  useEffect(() => {
    if (carousel2Paused || biens.length === 0) return
    const id = setInterval(() => {
      const el = carousel2Ref.current
      if (!el || carousel2Paused) return
      const count = Math.min(5, biens.length)
      const cardW = el.scrollWidth / count
      const maxScroll = el.scrollWidth - el.clientWidth
      const isAtEnd = el.scrollLeft + cardW >= maxScroll - 1
      const next = isAtEnd ? 0 : el.scrollLeft + cardW
      el.scrollTo({ left: next, behavior: 'smooth' })
      setCarousel2Idx(isAtEnd ? 0 : Math.round(next / cardW))
    }, 3500)
    return () => clearInterval(id)
  }, [carousel2Paused, biens.length])

  const me = user || authUser
  const initials = `${me?.prenom?.[0] || ''}${me?.nom?.[0] || ''}`.toUpperCase()
  const score = me?.score_credibilite ?? 100
  const approuves = biens.filter(b => b.statut_moderation === 'approuve').length
  const enAttente = biens.filter(b => b.statut_moderation === 'en_attente').length
  const rejetes   = biens.filter(b => b.statut_moderation === 'rejete').length
  const reservationsEnAttente = visites.filter(v => v.statut === 'en_attente').length
  const totalVues = biens.reduce((s, b) => s + (b.nb_consultations || 0), 0)

  const biensParType = (() => {
    const counts: Record<string, number> = {}
    for (const b of biens) counts[b.type] = (counts[b.type] || 0) + 1
    return Object.entries(counts)
      .map(([type, n]) => ({ label: typeLabel(type), value: n }))
      .sort((a, b) => b.value - a.value)
  })()

  // Séries "carte KPI" — toujours 6 mois, indépendantes du sélecteur de
  // période du graphique (qui ne doit affecter que le grand graphique).
  const revenusSeries6 = buildRevenueSeries(loyersDash?.contrats || [])
  const revenusMoisActuel = revenusSeries6[revenusSeries6.length - 1]?.value ?? 0
  const revenusMoisPrecedent = revenusSeries6[revenusSeries6.length - 2]?.value ?? 0
  const revenusTrendPct = revenusMoisPrecedent > 0
    ? Math.round(((revenusMoisActuel - revenusMoisPrecedent) / revenusMoisPrecedent) * 100)
    : (revenusMoisActuel > 0 ? 100 : 0)
  const hasRevenus = revenusSeries6.some(m => m.value > 0)

  const visitesSeries6 = buildCountSeries(visites, v => v.date_souhaitee)
  const visitesMoisActuel = visitesSeries6[visitesSeries6.length - 1]?.value ?? 0
  const visitesMoisPrecedent = visitesSeries6[visitesSeries6.length - 2]?.value ?? 0
  const visitesTrendPct = visitesMoisPrecedent > 0
    ? Math.round(((visitesMoisActuel - visitesMoisPrecedent) / visitesMoisPrecedent) * 100)
    : (visitesMoisActuel > 0 ? 100 : 0)

  // Séries des grands graphiques — respectent le sélecteur 3M/6M/12M
  // (comme le 7D/30D/90D du template).
  const revenusSeries = buildRevenueSeries(loyersDash?.contrats || [], chartPeriod)
  const visitesSeries = buildCountSeries(visites, v => v.date_souhaitee, chartPeriod)
  const hasVisites = visitesSeries6.some(m => m.value > 0)

  // Alerte loyers — réutilise les données déjà chargées (loyersDash), sans
  // appel réseau supplémentaire ; masquée si rien à signaler.
  const loyersDashList = (loyersDash?.contrats || []).flatMap((c: any) => c.loyers || [])
  const loyersEnRetardCount = loyersDash?.stats?.loyers_en_retard ?? loyersDashList.filter((l: any) => l.statut === 'en_retard').length
  const loyersImpayesCount = loyersDashList.filter((l: any) => l.statut === 'impaye').length

  const biensOccupes = biens.filter(b => b.statut === 'occupe').length
  const tauxOccupation = biens.length > 0 ? Math.round((biensOccupes / biens.length) * 100) : 0
  const biensApprouves = biens.filter(b => b.statut_moderation === 'approuve').length
  const biensEnAttente = biens.filter(b => b.statut_moderation === 'en_attente').length
  const biensRejetes   = biens.filter(b => b.statut_moderation === 'rejete').length

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div className={`proprio-root${isDark ? '' : ' proprio-light'} flex flex-col h-full`}
      style={{ background: 'var(--p-deep)' }}>

      {/* ── Navbar animée (HeroHeader pattern) ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 pointer-events-none transition-[padding] duration-300${isScrolled ? ' px-2' : ''}`}>
        <nav
          className="mx-auto pointer-events-auto border backdrop-blur-xl transition-all duration-300"
          style={{
            background: isScrolled ? 'var(--p-surface-glass)' : 'var(--p-surface)',
            borderColor: 'var(--p-border)',
            borderBottomWidth: isScrolled ? '1px' : '1px',
            borderTopWidth: isScrolled ? '1px' : '0px',
            borderLeftWidth: isScrolled ? '1px' : '0px',
            borderRightWidth: isScrolled ? '1px' : '0px',
            borderRadius: isScrolled ? '1rem' : '0px',
            marginTop: isScrolled ? '8px' : '0px',
            maxWidth: isScrolled ? '72rem' : '100%',
            paddingLeft: isScrolled ? '1rem' : '0.75rem',
            paddingRight: isScrolled ? '1rem' : '0.75rem',
            boxShadow: isScrolled ? '0 8px 32px rgba(0,0,0,0.14)' : '0 1px 0 rgba(212,168,71,0.15)',
          }}>
          <div className="flex items-center gap-3 py-3">

            {/* Logo */}
            <button onClick={() => { setTab('tableau'); setIsScrolled(false) }} className="flex items-center gap-2 flex-shrink-0">
              <img loading="lazy" src={logoUrl} alt="REFUGE" className="w-8 h-8 rounded-[8px] object-contain" />
              <span className="hidden sm:block font-black text-[13px] tracking-tight" style={{ color: BLUE }}>REFUGE</span>
            </button>

            {/* Nav tabs — desktop */}
            <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
              {NAV_ITEMS.map(item => {
                const active = tab === item.key
                const badge = item.key === 'messages' ? unreadMessages : item.key === 'reservations' ? reservationsEnAttente : 0
                return (
                  <button key={item.key}
                    onClick={() => { setTab(item.key); setIsScrolled(false); if (item.key === 'messages') refreshNotifications() }}
                    className="relative whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.1em] px-3 py-2 rounded-lg"
                    style={{
                      ...(active ? { color: BLUE, background: BLUE + '14' } : { color: 'var(--p-muted)' }),
                      minHeight: '36px',
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
              {/* Theme toggle */}
              <button onClick={() => setIsDark(d => !d)} title={isDark ? 'Mode clair' : 'Mode sombre'} aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
                className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors"
                style={{ borderColor: 'var(--p-border)', background: 'var(--p-card)', color: BLUE, minWidth: '32px', minHeight: '32px' }}>
                {isDark
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-9h-1M4.34 12H3.34m14.66-6.34-.7.7M6.7 17.3l-.7.7m12.02.02-.7-.7M6.7 6.7 6 6m6 3a3 3 0 110 6 3 3 0 010-6z"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                }
              </button>
              {/* Alertes — onglet notifications interne à l'espace propriétaire */}
              <button onClick={() => setTab('notifications')} title="Notifications"
                className="relative w-8 h-8 rounded-lg flex items-center justify-center border transition-colors"
                style={{ borderColor: tab === 'notifications' ? BLUE : 'var(--p-border)', background: 'var(--p-card)', color: tab === 'notifications' ? BLUE : 'var(--p-muted)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadAlertes > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: '#FF3B30' }} />}
              </button>
              {/* Profile + roles flyout */}
              <div className="relative" onMouseEnter={() => openRolesMenu('topbar')} onMouseLeave={scheduleCloseRolesMenu}>
                <button onClick={() => setTab('profil')}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 border transition-colors"
                  style={{ borderColor: 'var(--p-border)', background: 'var(--p-card)' }}>
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: BLUE }}>
                    {loading ? '…' : initials}
                  </div>
                  <span className="hidden lg:block text-[13px] font-semibold truncate max-w-[96px]" style={{ color: 'var(--p-text)' }}>
                    {loading ? '…' : me?.prenom || ''}
                  </span>
                </button>
                {rolesMenuOpen === 'topbar' && rolesActifs.length > 1 && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border py-1.5 z-30"
                    style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
                    onMouseEnter={() => openRolesMenu('topbar')} onMouseLeave={scheduleCloseRolesMenu}>
                    <p className="px-3.5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-muted)' }}>Mes espaces</p>
                    {rolesActifs.map(r => (
                      <button key={r} onClick={() => goToRoleSpace(r)}
                        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm text-left transition-colors"
                        style={{ color: r === activeRole ? BLUE : 'var(--p-text)', fontWeight: r === activeRole ? 700 : 500 }}>
                        {ROLE_LABELS[r] || r}
                        {r === activeRole && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: BLUE + '22', color: BLUE }}>Actuel</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Logout — desktop */}
              <button onClick={() => { logout(); navigate('/login') }} title="Déconnexion"
                className="hidden xl:flex w-8 h-8 rounded-lg items-center justify-center border transition-colors"
                style={{ borderColor: 'var(--p-border)', background: 'var(--p-card)', color: 'var(--tx-red)' }}>
                <IcLogout />
              </button>
              {/* Hamburger — mobile */}
              <button onClick={() => setMenuOpen(o => !o)}
                className="xl:hidden w-8 h-8 rounded-lg flex items-center justify-center border"
                style={{ borderColor: 'var(--p-border)', background: 'var(--p-card)', color: 'var(--p-muted)' }}>
                <div style={{ width: 18, height: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <motion.span animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }} transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }} style={{ display: 'block', height: 2, borderRadius: 2, background: 'currentColor', transformOrigin: 'center' }} />
                  <motion.span animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }} transition={{ duration: 0.22, ease: 'easeInOut' }} style={{ display: 'block', height: 2, borderRadius: 2, background: 'currentColor' }} />
                  <motion.span animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }} transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }} style={{ display: 'block', height: 2, borderRadius: 2, background: 'currentColor', transformOrigin: 'center' }} />
                </div>
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          <AnimatePresence initial={false}>
            {menuOpen && (
              <motion.div
                className="xl:hidden overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="border-t pb-4 pt-3" style={{ borderColor: 'var(--p-border)' }}>
                  <div className="grid grid-cols-4 gap-1">
                    {NAV_ITEMS.map(item => {
                      const active = tab === item.key
                      return (
                        <button key={item.key}
                          onClick={() => { setTab(item.key); setMenuOpen(false); setIsScrolled(false); if (item.key === 'messages') refreshNotifications() }}
                          className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-[11px] font-medium transition-all"
                          style={active ? { color: BLUE, background: BLUE + '14', fontWeight: 700 } : { color: 'var(--p-muted)' }}>
                          {item.icon}
                          <span className="truncate w-full text-center px-1">{item.label}</span>
                        </button>
                      )
                    })}
                    <button onClick={() => { logout(); navigate('/login') }}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-[11px] font-medium"
                      style={{ color: 'var(--tx-red)' }}>
                      <IcLogout />
                      <span>Quitter</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{ paddingTop: '4rem' }}>
        <div className="flex-1 overflow-hidden flex flex-col">
        {tab === 'tableau' && (
          <div className="flex-1 overflow-y-auto overflow-x-hidden" onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 50)}>
            {/* ── Hero photo ── */}
            <div className="relative overflow-hidden" style={{ minHeight: '380px' }}>
              <img loading="lazy" src={villaImg} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center 30%' }} />
              {/* Dégradé sombre — lisibilité texte + fondu vers le fond */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(6,13,26,0.45) 0%, rgba(6,13,26,0.72) 50%, #060D1A 100%)' }} />
              {/* Accent gold ambiant en haut-gauche */}
              <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: BLUE }} />

              <div className="relative px-5 md:px-8 xl:px-10 pt-10 pb-12">
                {/* Eyebrow */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px w-6" style={{ background: '#fff' }} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.32em]" style={{ color: '#fff' }}>Espace propriétaire</p>
                </div>

                <h1 className="text-[32px] md:text-[40px] font-black tracking-tight leading-[1.1] text-white">
                  Bonjour{me?.prenom ? `,` : ''}<br />
                  {me?.prenom && <span style={{ color: '#fff' }}>{me.prenom}</span>}
                  {!me?.prenom && <span style={{ color: '#fff' }}>Propriétaire</span>}
                </h1>
                <p className="text-[12px] mt-2.5 text-white/50 font-medium">
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>

                {/* Mini stats pills glassmorphic */}
                <div className="flex gap-3 mt-7 overflow-x-auto scrollbar-hide pb-0.5">
                  {[
                    { icon: <IcHome />, value: `${biens.length}`, label: 'Biens', color: BLUE },
                    { icon: <IcStar />, value: `${me?.nb_etoiles ?? 0}`, label: 'Étoiles', color: 'var(--tx-amber)' },
                    { icon: <IcShield />, value: `${score}`, label: 'Score', color: 'var(--tx-green)' },
                    { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><circle cx="12" cy="12" r="3"/></svg>, value: `${totalVues}`, label: 'Vues', color: '#A78BFA' },
                  ].map(s => (
                    <div key={s.label} className="flex-shrink-0 flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3"
                      style={{ background: 'rgba(6,13,26,0.55)', border: `1px solid ${BLUE}28`, backdropFilter: 'blur(16px)', minWidth: '68px', minHeight: '44px' }}>
                      <span style={{ color: s.color }}>{s.icon}</span>
                      <p className="font-black text-[18px] leading-none text-white">{s.value}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Contenu sous le hero ── */}
            <div className="px-5 md:px-8 xl:px-10 py-6">
              <AnimatedGroup
                preset="blur-slide"
                stagger={0.08}
                variants={{
                  container: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } },
                  item: { hidden: { opacity: 0, scale: 0.92, y: 16 }, visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } },
                }}>

              {/* Alert loyers */}
              {(loyersImpayesCount > 0 || loyersEnRetardCount > 0) && (
                <button onClick={() => setTab('loyers')} aria-label="Voir les loyers en retard"
                  className="w-full flex items-center gap-3 rounded-2xl mb-5 p-4 border text-left cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_4px_16px_rgba(244,67,54,0.12)]"
                  style={{ background: '#F4433608', borderColor: '#F4433628', minHeight: '56px' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F4433618' }}>
                    <span style={{ color: '#F44336' }}><IcClock /></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: 'var(--p-text)' }}>
                      {loyersImpayesCount > 0 && `${loyersImpayesCount} loyer${loyersImpayesCount > 1 ? 's' : ''} impayé${loyersImpayesCount > 1 ? 's' : ''}`}
                      {loyersImpayesCount > 0 && loyersEnRetardCount > 0 && ' · '}
                      {loyersEnRetardCount > 0 && `${loyersEnRetardCount} en retard`}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--p-muted)' }}>Nécessite votre attention</p>
                  </div>
                  <span style={{ color: 'var(--p-muted)' }}><IcChevron /></span>
                </button>
              )}

              {/* ── Actions rapides — chips scrollables ── */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--p-muted)' }}>Actions rapides</p>
                <LiveIndicator label={lastUpdatedLabel} refreshing={refreshing} />
              </div>
              <div className="flex gap-2.5 mb-7 overflow-x-auto scrollbar-hide pb-1">
                {[
                  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>, color: BLUE, label: 'Nouveau bien', action: () => navigate('/nouveau-bien') },
                  { icon: <IcCal />, color: 'var(--tx-blue)', label: 'Réservations', badge: reservationsEnAttente, action: () => setTab('reservations') },
                  { icon: <IcPayments />, color: 'var(--tx-green)', label: 'Loyers', badge: loyersImpayesCount + loyersEnRetardCount, action: () => setTab('loyers') },
                  { icon: <IcClock />, color: '#0EA5E9', label: 'Créneaux', action: () => setTab('creneaux') },
                  { icon: <IcMessagesNav />, color: '#FF6B35', label: 'Messages', badge: unreadMessages, action: () => { setTab('messages'); refreshNotifications() } },
                  { icon: <IcWallet />, color: '#A78BFA', label: 'Portefeuille', action: () => setTab('portefeuille') },
                ].map(q => (
                  <button key={q.label} onClick={q.action} aria-label={q.label}
                    className="relative flex-shrink-0 flex items-center gap-2.5 rounded-full px-4 py-2.5 transition-all duration-200"
                    style={{ background: hoveredOverviewEl === `chip-${q.label}` ? q.color + '22' : q.color + '12', border: `1.5px solid ${q.color}30`, minHeight: '44px', boxShadow: hoveredOverviewEl === `chip-${q.label}` ? `0 4px 16px ${q.color}25` : 'none' }}
                    onMouseEnter={() => setHoveredOverviewEl(`chip-${q.label}`)}
                    onMouseLeave={() => setHoveredOverviewEl(null)}>
                    <span style={{ color: q.color }}>{q.icon}</span>
                    <span className="text-[12px] font-semibold whitespace-nowrap" style={{ color: 'var(--p-text)' }}>{q.label}</span>
                    {(q.badge ?? 0) > 0 && (
                      <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black text-white" style={{ background: '#FF3B30' }}>
                        {(q.badge ?? 0) > 9 ? '9+' : q.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ── Carte portefeuille biens — PropertyStatsCard ── */}
              <div className="sticky top-0 z-10 flex items-center justify-between py-2 mb-2 -mx-1 px-1" style={{ background: 'var(--p-deep)' }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--p-muted)' }}>Mes biens</p>
                <span className="text-[13px] font-black" style={{ color: BLUE }}>{biens.length}</span>
              </div>
              <div className="mb-5 mx-auto w-full px-2" style={{ maxWidth: '72rem' }}>
                <PropertyStatsCard
                  title="Mes biens"   
                  total={biens.length}
                  dark={isDark}
                  stats={[
                    { label: 'Total',       value: biens.length,   color: BLUE      },
                    { label: 'Publiés',     value: biensApprouves, color: 'var(--tx-green)' },
                    { label: 'En attente',  value: biensEnAttente, color: 'var(--tx-amber)' },
                    { label: 'Rejetés',     value: biensRejetes,   color: 'var(--tx-red)' },
                  ]}
                />
              </div>

              {/* Activité — visites + occupation */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-20 mb-7">
                {[
                  {
                    label: 'Visites ce mois',
                    value: `${visitesMoisActuel}`,
                    sub: hasVisites && visitesTrendPct !== undefined
                      ? `${visitesTrendPct >= 0 ? '↑' : '↓'} ${Math.abs(visitesTrendPct)}% vs mois dernier`
                      : 'ce mois',
                    subColor: hasVisites && visitesTrendPct !== undefined
                      ? (visitesTrendPct >= 0 ? '#15803D' : '#DC2626')
                      : undefined,
                    color: '#7B2FBE',
                    icon: <IcCal />,
                  },
                  {
                    label: "Taux d'occupation",
                    value: `${tauxOccupation}%`,
                    sub: `${biensOccupes} / ${biens.length} biens`,
                    color: 'var(--tx-green)',
                    icon: <IcHome />,
                  },
                ].map(card => (
                  <div key={card.label}>
                    <div className="flex flex-col items-center text-center rounded-2xl px-5 py-4 sm:px-8 sm:py-5 flex-shrink-0 w-[42vw] sm:w-auto"
                      style={{
                        background: 'var(--p-card)',
                        border: '1px solid var(--p-border)',
                        boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)',
                      }}>
                      <span className="flex items-center justify-center w-10 h-10 rounded-full mb-2.5 flex-shrink-0"
                        style={{ background: card.color + '18', color: card.color }}>
                        {card.icon}
                      </span>
                      <p className="font-black text-[26px] leading-none mb-1" style={{ color: card.color }}>
                        {card.value}
                      </p>
                      <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--p-muted)' }}>
                        {card.label}
                      </p>
                      {card.sub && (
                        <p className="text-[10px]" style={{ color: card.subColor ?? 'var(--p-muted)' }}>
                          {card.sub}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── 5 derniers biens en carousel ── */}
              {biens.length > 0 && (() => {
                const recentBiens = [...biens]
                  .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                  .slice(0, 5)
                return (
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--p-muted)' }}>Mes biens récents</p>
                      <button onClick={() => setTab('biens')} className="text-xs font-bold" style={{ color: BLUE }}>Voir tout →</button>
                    </div>
                    <div
                      ref={carousel2Ref}
                      className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
                      onMouseEnter={() => setCarousel2Paused(true)}
                      onMouseLeave={() => setCarousel2Paused(false)}
                    >
                      {recentBiens.map(b => {
                        const { label: sLabel, color: sColor } = statutBien(b.statut_moderation || 'en_attente')
                        const loc = b.localisation
                        const adresse = loc ? `${loc.quartier ? loc.quartier + ', ' : ''}${loc.ville || ''}` : '—'
                        const cover = b.photos?.find((p: any) => p.is_cover) || b.photos?.[0]
                        const compo = bienComposition(b)
                        return (
                          <div
                            key={b.id}
                            className="flex-shrink-0 snap-start group rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(75,107,255,0.14)] w-[85%] md:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]"
                            style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}
                            onClick={() => navigate(`/proprietaire/biens/${b.id}`, { state: { fromDashboard: true } })}
                          >
                            <div className="relative overflow-hidden" style={{ height: 160 }}>
                              {cover?.url
                                ? <img loading="lazy" src={cover.url} alt={bienLabel(b)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                : <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, #1a2a4a, ${BLUE}30)` }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={1.2} className="w-10 h-10 opacity-40"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                                  </div>
                              }
                              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)' }} />
                              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: sColor }}>{sLabel}</span>
                              <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(0,0,0,0.50)', color: '#fff' }}>
                                {b.transaction === 'location' ? 'À louer' : 'À vendre'}
                              </span>
                              <div className="absolute bottom-3 left-3 right-3">
                                <p className="text-white font-black text-[15px] leading-none drop-shadow">
                                  {fmtPrix(b.prix)}{b.transaction === 'location' && <span className="text-[11px] font-normal text-white/70"> /mois</span>}
                                </p>
                              </div>
                            </div>
                            <div className="p-3">
                              <p className="font-bold text-[14px] leading-tight mb-1.5 truncate" style={{ color: 'var(--p-text)' }}>{bienLabel(b)}</p>
                              <div className="flex items-center gap-1 mb-2">
                                <span style={{ color: 'var(--p-muted)' }}><IcPin /></span>
                                <span className="text-xs truncate" style={{ color: 'var(--p-muted)' }}>{adresse}</span>
                              </div>
                              {compo && (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--p-border)', color: 'var(--p-muted)' }}>{compo}</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {recentBiens.length > 3 && (
                      <div className="flex justify-center gap-2 mt-4">
                        {recentBiens.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              const el = carousel2Ref.current
                              if (!el) return
                              const cardW = el.scrollWidth / recentBiens.length
                              el.scrollTo({ left: cardW * i, behavior: 'smooth' })
                              setCarousel2Idx(i)
                            }}
                            style={{ width: carousel2Idx === i ? 20 : 8, height: 8, borderRadius: 4, background: carousel2Idx === i ? '#4B6BFF' : 'rgba(75,107,255,0.25)', transition: 'all 0.3s ease', border: 'none', cursor: 'pointer', padding: 0 }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}

              </AnimatedGroup>
              <div className="h-24 xl:h-8" />
            </div>
          </div>
        )}
        {tab === 'biens'        && <MesBiensTab onScrolled={setIsScrolled} />}
        {tab === 'reservations' && <ReservationsTab biens={biens} onScrolled={setIsScrolled} onOpenMessages={(convId, draft) => openTab('messages', convId, draft)} />}
        {tab === 'messages'      && <MessagesTab initialConvId={messagesInitConvId} initialDraft={messagesInitDraft} />}
        {tab === 'notifications' && <NotificationsTab onOpenTab={openTab} />}
        {tab === 'loyers'        && <LoyersTab onScrolled={setIsScrolled} />}
        {tab === 'creneaux'      && <CreneauxTab />}
        {tab === 'portefeuille' && <PortefeuilleTab onOpenTransactions={() => setTab('transactions')} />}
        {tab === 'transactions' && <TransactionsTab />}
        {tab === 'roles'        && <RolesTab />}
        {tab === 'profil'       && <ProfilTab user={me} biens={biens} visites={visites} onOpenTransactions={() => setTab('transactions')} onOpenRoles={() => setTab('roles')} onScrolled={setIsScrolled} />}
      </div>

      </div>

      {/* FAB */}
      {(tab === 'tableau' || tab === 'biens') && (
        <div className="xl:hidden fixed bottom-20 right-4 md:bottom-24 md:right-8 z-20">
          <button onClick={() => navigate('/nouveau-bien')}
            className="flex items-center gap-2 px-5 py-3.5 rounded-full font-bold shadow-lg active:scale-95 md:hover:-translate-y-0.5 transition-transform"
            style={{ background: 'linear-gradient(135deg, #4B6BFF, #3A5AEE)', color: '#fff', boxShadow: '0 4px 15px rgba(75,107,255,0.45)' }}>
            <IcPlus /> Nouveau bien
          </button>
        </div>
      )}

      {/* Bottom Nav — fixed, mobile & tablet */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div style={{ background: 'var(--p-surface)', borderTop: '1px solid var(--p-border)', boxShadow: '0 -4px 24px rgba(0,0,0,0.30)' }}>
          <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
            {TABS.map(t => {
              const active = tab === t.key
              const badge = t.key === 'messages' ? unreadMessages : 0
              return (
                <button key={t.key} onClick={() => { setTab(t.key); if (t.key === 'messages') refreshNotifications() }}
                  className="relative flex items-center gap-1.5 px-2 py-2 rounded-[14px] transition-all"
                  style={active ? { background: BLUE + '14' } : {}}>
                  <span className="relative" style={{ color: active ? BLUE : 'var(--p-muted)' }}>
                    {t.icon}
                    {badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-bold text-white" style={{ background: '#FF3B30' }}>
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </span>
                  {active && <span className="text-xs font-bold" style={{ color: BLUE }}>{t.label}</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
