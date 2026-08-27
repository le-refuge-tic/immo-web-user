import { useRef, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import TopNav from './TopNav'
import BottomNav from './BottomNav'
import PushPrompt from './PushPrompt'
import ScrollFloatButtons from './ScrollFloatButtons'
import { useScrolled } from '../context/ScrollContext'

const HIDE_CHROME_PATHS = ['/nouveau-bien']
const HIDE_TOPNAV_PREFIXES: string[] = []

export default function MainLayout() {
  const location = useLocation()
  const { scrolled, setScrolled } = useScrolled()
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideChrome = HIDE_CHROME_PATHS.includes(location.pathname)
  const hideTopNav = hideChrome || HIDE_TOPNAV_PREFIXES.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrolled(e.currentTarget.scrollTop > 40)

    // Scrollbar auto-hide : ajoute la classe pendant le scroll, retire après 800ms
    const el = e.currentTarget
    el.classList.add('is-scrolling')
    if (scrollTimer.current) clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(() => el.classList.remove('is-scrolling'), 800)
  }, [setScrolled])

  return (
    <div className="flex flex-col h-dvh overflow-hidden" style={{ background: '#F5F5F7' }}>

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
          style={{ height: 96, background: 'linear-gradient(to bottom, #F5F5F7 0%, transparent 100%)' }}
        />
      )}

      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto relative scrollbar-auto ${hideChrome ? '' : hideTopNav ? 'pb-20 md:pb-0' : 'pb-20 md:pb-0 md:pt-16'}`}
        onScroll={handleScroll}
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

      <PushPrompt />
    </div>
  )
}
