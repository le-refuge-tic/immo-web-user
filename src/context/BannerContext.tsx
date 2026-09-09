import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from './ThemeContext'

export interface BannerData {
  id: number
  title: string
  message: string
  /** Route vers laquelle naviguer au tap (optionnel). */
  to?: string
  /** Avatar : initiale + dégradé, ou icône. */
  initial?: string
  gradient?: string
  variant?: 'message' | 'notif'
}

type BannerInput = Omit<BannerData, 'id'>

interface BannerCtx {
  showBanner: (b: BannerInput) => void
}

const BannerContext = createContext<BannerCtx>({ showBanner: () => {} })

const DISPLAY_MS = 3000
const EXIT_MS = 280

export function BannerProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const queueRef = useRef<BannerData[]>([])
  const idRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [current, setCurrent] = useState<BannerData | null>(null)
  const [exiting, setExiting] = useState(false)

  // Gestes swipe
  const [dragY, setDragY] = useState(0)
  const dragYRef = useRef(0)          // valeur à jour lue par onPointerUp (le state est async)
  const startY = useRef<number | null>(null)

  const dismiss = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    setExiting(true)
    setTimeout(() => {
      setExiting(false)
      dragYRef.current = 0
      setDragY(0)
      setCurrent(null)
    }, EXIT_MS)
  }, [])

  // Affiche le prochain de la file quand plus rien à l'écran
  useEffect(() => {
    if (current || exiting) return
    const next = queueRef.current.shift()
    if (next) setCurrent(next)
  }, [current, exiting])

  // Timer d'auto-dismiss
  useEffect(() => {
    if (!current) return
    timerRef.current = setTimeout(dismiss, DISPLAY_MS)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [current, dismiss])

  const showBanner = useCallback((b: BannerInput) => {
    idRef.current += 1
    queueRef.current.push({ ...b, id: idRef.current })
    // déclenche le rendu si rien en cours
    setCurrent(c => c ?? queueRef.current.shift() ?? null)
  }, [])

  const onTap = () => {
    if (current?.to) navigate(current.to)
    dismiss()
  }

  // Swipe vers le haut pour fermer
  const onPointerDown = (e: React.PointerEvent) => { startY.current = e.clientY; if (timerRef.current) clearTimeout(timerRef.current) }
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current == null) return
    const dy = e.clientY - startY.current
    if (dy < 0) { dragYRef.current = dy; setDragY(dy) }
  }
  const onPointerUp = () => {
    if (dragYRef.current < -40) dismiss()
    else { dragYRef.current = 0; setDragY(0); if (current) timerRef.current = setTimeout(dismiss, DISPLAY_MS) }
    startY.current = null
  }

  const bg     = isDark ? 'rgba(30,33,48,0.92)' : 'rgba(255,255,255,0.92)'
  const border = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'
  const tp     = isDark ? '#E8E9F0' : '#111827'
  const ts     = isDark ? 'rgba(232,233,240,0.62)' : '#6B7280'

  return (
    <BannerContext.Provider value={{ showBanner }}>
      {children}
      {current && (
        <div className="fixed top-0 left-0 right-0 z-[300] flex justify-center px-3 pointer-events-none safe-top">
          <div
            role="alert"
            onClick={onTap}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className={`pointer-events-auto w-full max-w-md mt-2 flex items-center gap-3 px-3.5 py-3 rounded-2xl cursor-pointer select-none ${exiting ? 'banner-exit' : 'banner-enter'}`}
            style={{
              background: bg,
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: `1px solid ${border}`,
              boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 40px rgba(0,0,0,0.15)',
              transform: dragY ? `translateY(${dragY}px)` : undefined,
              transition: dragY ? 'none' : undefined,
            }}
          >
            {/* Avatar / icône */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: current.gradient || 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
              {current.variant === 'notif' ? (
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              ) : (
                <span className="text-white font-bold text-sm">{current.initial || '•'}</span>
              )}
            </div>
            {/* Texte */}
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-bold truncate" style={{ color: tp }}>{current.title}</p>
              <p className="text-[12.5px] truncate" style={{ color: ts }}>{current.message}</p>
            </div>
            {/* Poignée de swipe */}
            <div className="w-8 h-1 rounded-full flex-shrink-0 self-start mt-0.5" style={{ background: border }} />
          </div>
        </div>
      )}
    </BannerContext.Provider>
  )
}

export const useBanner = () => useContext(BannerContext)
