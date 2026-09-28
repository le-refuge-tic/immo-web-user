import axios from 'axios'
import { BASE, auth } from './apiBase'

export const notificationsApi = {
  list: () =>
    axios.get(`${BASE}/alertes`, auth()).then(r => r.data),

  count: () =>
    axios.get(`${BASE}/alertes/count`, auth()).then(r => r.data),

  markRead: (id: number) =>
    axios.patch(`${BASE}/alertes/${id}/lire`, {}, auth()).then(r => r.data),

  markAllRead: () =>
    axios.patch(`${BASE}/alertes/lire-tout`, {}, auth()).then(r => r.data),
}
