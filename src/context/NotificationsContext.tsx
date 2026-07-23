import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
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

const POLL_MS = 30000

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth()
  const [unreadAlertes, setUnreadAlertes] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  const refresh = () => {
    if (!isLoggedIn) return
    notificationsApi.count().then(d => setUnreadAlertes(d?.count ?? 0)).catch(() => {})
    chatApi.conversations().then(list => {
      const arr = Array.isArray(list) ? list : list.data || []
      setUnreadMessages(arr.reduce((sum: number, c: any) => sum + (c.nonLus || 0), 0))
    }).catch(() => {})
  }

  useEffect(() => {
    if (!isLoggedIn) { setUnreadAlertes(0); setUnreadMessages(0); return }
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
