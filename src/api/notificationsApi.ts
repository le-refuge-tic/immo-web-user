import axios from 'axios'
import type { ListResponse, Notification, NotificationsCount } from '../types/api'
import { BASE, auth } from './apiBase'

export const notificationsApi = {
  list: (signal?: AbortSignal) =>
    axios.get<ListResponse<Notification>>(`${BASE}/alertes`, { ...auth(), signal }).then(r => r.data),

  /** `role` : compteur limité à l'espace de ce rôle (même filtre que sa liste). */
  count: (role?: string) =>
    axios.get<NotificationsCount>(`${BASE}/alertes/count`, { ...auth(), params: role ? { role } : undefined }).then(r => r.data),

  markRead: (id: number) =>
    axios.patch(`${BASE}/alertes/${id}/lire`, {}, auth()).then(r => r.data),

  /** `role` : ne marque lues que les alertes de cet espace. */
  markAllRead: (role?: string) =>
    axios.patch(`${BASE}/alertes/lire-tout`, {}, { ...auth(), params: role ? { role } : undefined }).then(r => r.data),
}
