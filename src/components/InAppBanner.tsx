import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

export interface BannerItem {
  id: string
  title: string
  body: string
  href?: string
  avatarLetter?: string
  avatarColor?: string
}

interface Props {
  queue: BannerItem[]
  onDismiss: (id: string) => void
}

const AUTO_DISMISS_MS = 3000

export default function InAppBanner({ queue, onDismiss }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState<BannerItem | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startY = useRef<number | null>(null)

  const dismiss = useCallback((id: string) => {
    setVisible(false)
    setTimeout(() => { setCurrent(null); onDismiss(id) }, 280)
  }, [onDismiss])

  /* Afficher le premier item de la file dès qu'il arrive */
  useEffect(() => {
    if (queue.length === 0 || current) return
    const next = queue[0]
    setCurrent(next)
    requestAnimationFrame(() => setVisible(true))
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => dismiss(next.id), AUTO_DISMISS_MS)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [queue, current, dismiss])

  const handleClick = () => {
    if (!current) return
    if (current.href) navigate(current.href)
    dismiss(current.id)
  }

  /* Swipe vers le haut pour fermer */
  const onTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startY.current !== null && current) {
      const dy = e.changedTouches[0].clientY - startY.current
      if (dy < -30) dismiss(current.id)
    }
    startY.current = null
  }

  if (!current) return null

  const bg = isDark
    ? 'rgba(24,24,36,0.88)'
    : 'rgba(255,255,255,0.88)'
  const bdr = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'
  const textPrimary = isDark ? '#E8E8EF' : '#1D1D1F'
  const textMuted = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.45)'

  return (
    <div
      className="fixed left-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        transform: `translateX(-50%) translateY(${visible ? '0' : '-110%'})`,
        transition: 'transform 0.28s cubic-bezier(0.22,0.61,0.36,1)',
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="alert"
      aria-live="assertive"
    >
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left cursor-pointer"
        style={{
          background: bg,
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: `1px solid ${bdr}`,
          boxShadow: isDark
            ? '0 8px 32px rgba(0,0,0,0.45)'
            : '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: current.avatarColor ?? 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
          <span className="text-white font-bold text-sm">{current.avatarLetter ?? '💬'}</span>
        </div>

        {/* Texte */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold truncate" style={{ color: textPrimary }}>{current.title}</p>
          <p className="text-[12px] truncate" style={{ color: textMuted }}>{current.body}</p>
        </div>

        {/* Fermer */}
        <button
          onClick={e => { e.stopPropagation(); if (current) dismiss(current.id) }}
          className="w-6 h-6 flex items-center justify-center flex-shrink-0 rounded-full cursor-pointer"
          style={{ background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)', color: textMuted }}
          aria-label="Fermer">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </button>
    </div>
  )
}
