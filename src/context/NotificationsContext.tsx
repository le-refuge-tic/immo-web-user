import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { useBanner } from './BannerContext'
import { notificationsApi } from '../api/notificationsApi'
import { chatApi } from '../api/chatApi'

type NotifCtx = {
  unreadAlertes: number
  unreadMessages: number
  refresh: () => void
}

const NotificationsContext = createContext<NotifCtx>({
  unreadAlertes: 0,
  unreadMessages: 0,
  refresh: () => {},
})

// 15s — aligné sur le rythme de rafraîchissement du badge "Messages" côté
// mobile (Timer.periodic 15s tant que l'écran conversations est monté).
const POLL_MS = 15000

const AVATAR_PALETTE = [
  'linear-gradient(135deg,#4B6BFF,#7B4BFF)', 'linear-gradient(135deg,#FF6B35,#FF3B7A)',
  'linear-gradient(135deg,#00C6A2,#0099CC)', 'linear-gradient(135deg,#F7B731,#F55252)',
  'linear-gradient(135deg,#A855F7,#6366F1)', 'linear-gradient(135deg,#10B981,#3B82F6)',
]

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, user } = useAuth()
  const { showBanner } = useBanner()
  const location = useLocation()
  const [unreadAlertes, setUnreadAlertes] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Snapshot des non-lus par conversation, pour détecter les nouveaux messages
  const unreadByConvRef = useRef<Record<number, number>>({})
  const firstLoadRef = useRef(true)
  const locationRef = useRef(location)
  useEffect(() => { locationRef.current = location }, [location])

  const refresh = () => {
    if (!isLoggedIn) return
    notificationsApi.count().then(d => setUnreadAlertes(d?.count ?? 0)).catch(() => {})
    chatApi.conversations().then(list => {
      const arr = Array.isArray(list) ? list : list.data || []
      setUnreadMessages(arr.reduce((sum: number, c: any) => sum + (c.nonLus || 0), 0))

      // Détection nouveaux messages → bannière in-app
      const prev = unreadByConvRef.current
      const next: Record<number, number> = {}
      const path = locationRef.current.pathname
      for (const c of arr) {
        const n = c.nonLus || 0
        next[c.id] = n
        if (firstLoadRef.current) continue
        const gained = n - (prev[c.id] || 0)
        // Flag "conversation active" : ne pas notifier si on est déjà dedans
        const isActiveConv = path === `/conversations/${c.id}`
        if (gained > 0 && !isActiveConv) {
          const other = Array.isArray(c.participants)
            ? c.participants.find((p: any) => p.id !== user?.id) || c.participants[0]
            : null
          const name = other?.prenom || other?.pseudonyme || other?.nom || 'Nouveau message'
          const preview = c.dernierMessage?.contenu === '__supprime__' ? 'Message supprimé' : (c.dernierMessage?.contenu || 'Vous avez reçu un message')
          showBanner({
            variant: 'message',
            title: name,
            message: preview,
            to: `/conversations/${c.id}`,
            initial: (name[0] || '?').toUpperCase(),
            gradient: AVATAR_PALETTE[Math.abs(other?.id || c.id) % AVATAR_PALETTE.length],
          })
        }
      }
      unreadByConvRef.current = next
      firstLoadRef.current = false
    }).catch(() => {})
  }

  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadAlertes(0); setUnreadMessages(0)
      unreadByConvRef.current = {}; firstLoadRef.current = true
      return
    }
    firstLoadRef.current = true
    refresh()
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn])

  return (
    <NotificationsContext.Provider value={{ unreadAlertes, unreadMessages, refresh }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext)
