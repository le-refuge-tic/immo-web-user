import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import type { Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { useBanner } from './BannerContext'
import { notificationsApi } from '../api/notificationsApi'
import { chatApi } from '../api/chatApi'
import { API_ORIGIN } from '../api/apiBase'
import { tokenStore } from '../utils/tokenStore'

type NotifCtx = {
  /** Alertes non lues, tous rôles confondus (barre de navigation principale). */
  unreadAlertes: number
  /** Alertes non lues de l'espace actif (même filtre que la liste de cet espace). */
  unreadAlertesEspace: number
  unreadMessages: number
  refresh: () => void
  /** Décrément immédiat après une lecture, avant la confirmation serveur. */
  markAlertesRead: (n?: number) => void
}

const NotificationsContext = createContext<NotifCtx>({
  unreadAlertes: 0,
  unreadAlertesEspace: 0,
  unreadMessages: 0,
  refresh: () => {},
  markAlertesRead: () => {},
})

// Filet de sécurité si le WebSocket est coupé ; les mises à jour normales
// arrivent par les événements alertes:maj / messages:maj.
const POLL_MS = 30000
/** Espaces dont la liste d'alertes est filtrée par rôle. */
const ESPACES_FILTRES = new Set(['proprietaire', 'demarcheur', 'commercial', 'locataire'])
const TITRE_BADGE = /^\(\d+\+?\) /

const AVATAR_PALETTE = [
  'linear-gradient(135deg,#4B6BFF,#7B4BFF)', 'linear-gradient(135deg,#FF6B35,#FF3B7A)',
  'linear-gradient(135deg,#00C6A2,#0099CC)', 'linear-gradient(135deg,#F7B731,#F55252)',
  'linear-gradient(135deg,#A855F7,#6366F1)', 'linear-gradient(135deg,#10B981,#3B82F6)',
]

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, user, activeRole } = useAuth()
  const { showBanner } = useBanner()
  const location = useLocation()
  const [unreadAlertes, setUnreadAlertes] = useState(0)
  const [unreadAlertesEspace, setUnreadAlertesEspace] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Snapshot des non-lus par conversation, pour détecter les nouveaux messages
  const unreadByConvRef = useRef<Record<number, number>>({})
  const firstLoadRef = useRef(true)
  const locationRef = useRef(location)
  useEffect(() => { locationRef.current = location }, [location])
  const espaceRole = ESPACES_FILTRES.has(activeRole) ? activeRole : ''

  const refreshAlertes = useCallback(() => {
    notificationsApi.count().then(d => setUnreadAlertes(d?.count ?? 0)).catch(() => {})
    if (espaceRole) {
      notificationsApi.count(espaceRole).then(d => setUnreadAlertesEspace(d?.count ?? 0)).catch(() => {})
    }
  }, [espaceRole])

  const refreshMessages = useCallback(() => {
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
          const inProprietaireDashboard = path.startsWith('/proprietaire')
          showBanner({
            variant: 'message',
            title: name,
            message: preview,
            to: inProprietaireDashboard ? '/proprietaire' : `/conversations/${c.id}`,
            toState: inProprietaireDashboard ? { tab: 'messages', convId: c.id } : undefined,
            initial: (name[0] || '?').toUpperCase(),
            gradient: AVATAR_PALETTE[Math.abs(other?.id || c.id) % AVATAR_PALETTE.length],
          })
        }
      }
      unreadByConvRef.current = next
      firstLoadRef.current = false
    }).catch(() => {})
    // showBanner et user?.id sont stables pendant la session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const refresh = useCallback(() => {
    if (!isLoggedIn) return
    refreshAlertes()
    refreshMessages()
  }, [isLoggedIn, refreshAlertes, refreshMessages])

  const markAlertesRead = useCallback((n = 1) => {
    setUnreadAlertes(c => Math.max(0, c - n))
    setUnreadAlertesEspace(c => Math.max(0, c - n))
    refreshAlertes()
  }, [refreshAlertes])

  // Chargement initial, polling de secours (onglet visible uniquement),
  // rafraîchissement au retour sur l'onglet et au retour du réseau.
  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadAlertes(0); setUnreadAlertesEspace(0); setUnreadMessages(0)
      unreadByConvRef.current = {}; firstLoadRef.current = true
      return
    }
    firstLoadRef.current = true
    refresh()
    const tick = () => { if (document.visibilityState === 'visible') refresh() }
    const id = setInterval(tick, POLL_MS)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('online', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('online', tick)
    }
  }, [isLoggedIn, refresh])

  // Mises à jour immédiates poussées par l'API (nouvelle alerte, lecture sur
  // un autre appareil, nouveau message dans une conversation non ouverte).
  useEffect(() => {
    if (!isLoggedIn) return
    const token = tokenStore.getToken()
    if (!token) return
    // socket.io est chargé à la demande : il ne pèse pas sur le premier affichage.
    let socket: Socket | null = null
    let cancelled = false
    void import('socket.io-client').then(({ io }) => {
      if (cancelled) return
      socket = io(`${API_ORIGIN}/chat`, { auth: { token }, transports: ['websocket'], reconnectionDelay: 2000 })
      socket.on('alertes:maj', refreshAlertes)
      socket.on('messages:maj', refreshMessages)
      socket.on('connect', refresh)
    })
    return () => { cancelled = true; socket?.disconnect() }
  }, [isLoggedIn, refresh, refreshAlertes, refreshMessages])

  // Titre d'onglet « (3) … » : visible même quand l'onglet est en arrière-plan.
  useEffect(() => {
    const total = unreadAlertes + unreadMessages
    const apply = () => {
      const base = document.title.replace(TITRE_BADGE, '')
      const next = total > 0 ? `(${total > 99 ? '99+' : total}) ${base}` : base
      if (document.title !== next) document.title = next
    }
    apply()
    const titleEl = document.querySelector('title')
    if (!titleEl) return
    // usePageTitle réécrit le titre à chaque page : on réapplique le préfixe.
    const obs = new MutationObserver(apply)
    obs.observe(titleEl, { childList: true })
    return () => { obs.disconnect(); document.title = document.title.replace(TITRE_BADGE, '') }
  }, [unreadAlertes, unreadMessages])

  return (
    <NotificationsContext.Provider value={{ unreadAlertes, unreadAlertesEspace, unreadMessages, refresh, markAlertesRead }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext)
