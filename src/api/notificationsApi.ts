import axios from 'axios'
import type { ListResponse, Notification, NotificationsCount } from '../types/api'
import { BASE, auth } from './apiBase'

export const notificationsApi = {
  list: (signal?: AbortSignal) =>
    axios.get<ListResponse<Notification>>(`${BASE}/alertes`, { ...auth(), signal }).then(r => r.data),

  count: () =>
    axios.get<NotificationsCount>(`${BASE}/alertes/count`, auth()).then(r => r.data),

  markRead: (id: number) =>
    axios.patch(`${BASE}/alertes/${id}/lire`, {}, auth()).then(r => r.data),

  markAllRead: () =>
    axios.patch(`${BASE}/alertes/lire-tout`, {}, auth()).then(r => r.data),
}
