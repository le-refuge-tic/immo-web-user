import { useRef, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import TopNav from './TopNav'
import BottomNav from './BottomNav'
import PushPrompt from './PushPrompt'
import ScrollFloatButtons from './ScrollFloatButtons'
import { useScrolled } from '../context/ScrollContext'
import { useTheme } from '../context/ThemeContext'

const HIDE_CHROME_PATHS = ['/nouveau-bien']
const HIDE_TOPNAV_PREFIXES: string[] = []
// Pages qui gèrent leur propre scroll interne (pas de overflow-y-auto sur le layout)
const OWN_SCROLL_PREFIXES = ['/conversations']

export default function MainLayout() {
  const location = useLocation()
  const { scrolled, setScrolled } = useScrolled()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideChrome = HIDE_CHROME_PATHS.includes(location.pathname)
  const hideTopNav = hideChrome || HIDE_TOPNAV_PREFIXES.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))
  const ownScroll  = OWN_SCROLL_PREFIXES.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrolled(e.currentTarget.scrollTop > 40)

    // Scrollbar auto-hide : ajoute la classe pendant le scroll, retire après 800ms
    const el = e.currentTarget
    el.classList.add('is-scrolling')
    if (scrollTimer.current) clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(() => el.classList.remove('is-scrolling'), 800)
  }, [setScrolled])

  return (
    <div className="flex flex-col h-dvh overflow-hidden" style={{ background: isDark ? '#0F0F14' : '#F5F5F7' }}>

      {/* Orbes pastel Liquid Glass */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="orb absolute top-[-20%] right-[-10%] w-[900px] h-[900px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(100,130,255,0.22) 0%, rgba(100,130,255,0.06) 50%, transparent 70%)' }} />
        <div className="orb-2 absolute top-[5%] left-[-20%] w-[750px] h-[750px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(160,100,255,0.18) 0%, rgba(160,100,255,0.05) 50%, transparent 70%)' }} />
        <div className="orb-3 absolute bottom-[-15%] left-[20%] w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,120,80,0.14) 0%, rgba(255,120,80,0.04) 50%, transparent 70%)' }} />
        <div className="orb absolute bottom-[15%] right-[-8%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(50,210,140,0.12) 0%, rgba(50,210,140,0.04) 50%, transparent 70%)', animationDelay: '8s' }} />
        <div className="orb-2 absolute top-[40%] left-[35%] w-[350px] h-[350px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,190,60,0.10) 0%, transparent 70%)', animationDelay: '12s' }} />
      </div>

      {!hideTopNav && <TopNav />}

      {/* Scrim sous la navbar pill — efface la transition brusque au scroll */}
      {!hideTopNav && scrolled && (
        <div
          className="fixed top-0 left-0 right-0 z-[55] pointer-events-none"
          style={{ height: 96, background: `linear-gradient(to bottom, ${isDark ? '#0F0F14' : '#F5F5F7'} 0%, transparent 100%)` }}
        />
      )}

      <div
        ref={ownScroll ? undefined : scrollRef}
        className={`flex-1 min-h-0 relative ${ownScroll ? 'overflow-hidden' : 'overflow-y-auto scrollbar-auto'} ${hideChrome ? '' : hideTopNav ? 'pb-20 md:pb-0' : ownScroll ? 'md:pt-[72px]' : 'pb-20 md:pb-0 md:pt-[72px]'}`}
        onScroll={ownScroll ? undefined : handleScroll}
      >
        <Outlet />
      </div>

      {!hideChrome && (
        <div className="md:hidden relative z-50">
          <BottomNav />
        </div>
      )}

      {/* Boutons flottants haut/bas — desktop uniquement */}
      {!hideChrome && <ScrollFloatButtons scrollRef={scrollRef} />}

      {/* Téléchargement de l'app Android (APK) — bouton flottant discret */}
      {!hideChrome && (
        <a
          href="/base.apk"
          download
          className="fixed z-50 bottom-24 md:bottom-6 left-4 flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-lg text-sm font-semibold transition-transform hover:scale-105"
          style={{
            background: isDark ? 'rgba(30,30,40,0.85)' : 'rgba(255,255,255,0.9)',
            color: '#4B6BFF',
            border: '1px solid rgba(100,130,255,0.3)',
            backdropFilter: 'blur(12px)',
          }}
          title="Télécharger l'application Android"
        >
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="hidden sm:inline">Télécharger l'app</span>
        </a>
      )}

      <PushPrompt />
    </div>
  )
}
