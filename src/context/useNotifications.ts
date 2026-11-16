import { createContext, useContext } from 'react'

export type NotifCtx = {
  /** Alertes non lues, tous rôles confondus (barre de navigation principale). */
  unreadAlertes: number
  /** Alertes non lues de l'espace actif (même filtre que la liste de cet espace). */
  unreadAlertesEspace: number
  unreadMessages: number
  refresh: () => void
  /** Décrément immédiat après une lecture, avant la confirmation serveur. */
  markAlertesRead: (n?: number) => void
}

export const NotificationsContext = createContext<NotifCtx>({
  unreadAlertes: 0,
  unreadAlertesEspace: 0,
  unreadMessages: 0,
  refresh: () => {},
  markAlertesRead: () => {},
})

export const useNotifications = () => useContext(NotificationsContext)
