import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const HIDE_CHROME_PATHS = ['/nouveau-bien']

export default function ScrollFloatButtons({ scrollRef }: { scrollRef: React.RefObject<HTMLDivElement | null> }) {
  const location = useLocation()
  const [atTop, setAtTop]       = useState(true)
  const [atBottom, setAtBottom] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const check = () => {
      setAtTop(el.scrollTop < 60)
      setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 60)
    }
    check()
    el.addEventListener('scroll', check, { passive: true })
    return () => el.removeEventListener('scroll', check)
  }, [scrollRef])

  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (HIDE_CHROME_PATHS.includes(location.pathname)) return null

  const scrollTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  const scrollBot = () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })

  const btnStyle: React.CSSProperties = isDark ? {
    width: 40, height: 40,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(30,30,46,0.90)',
    backdropFilter: 'blur(32px) saturate(160%)',
    WebkitBackdropFilter: 'blur(32px) saturate(160%)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.40)',
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.2s',
    color: 'rgba(255,255,255,0.70)',
  } : {
    width: 40, height: 40,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(32px) saturate(160%)',
    WebkitBackdropFilter: 'blur(32px) saturate(160%)',
    border: '1px solid rgba(255,255,255,0.92)',
    boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,1), 0 4px 16px rgba(0,0,0,0.10)',
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.2s',
    color: 'rgba(0,0,0,0.55)',
  }

  return (
    <div className="hidden md:flex fixed bottom-6 right-6 z-40 flex-col gap-2" aria-label="Navigation rapide">
      <button
        onClick={scrollTop}
        aria-label="Remonter en haut"
        style={{ ...btnStyle, opacity: atTop ? 0 : 1, pointerEvents: atTop ? 'none' : 'auto' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <button
        onClick={scrollBot}
        aria-label="Aller en bas"
        style={{ ...btnStyle, opacity: atBottom ? 0 : 1, pointerEvents: atBottom ? 'none' : 'auto' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  )
}
