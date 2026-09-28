import axios from 'axios'
import { tokenStore } from '../utils/tokenStore'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

const auth = () => ({
  headers: { Authorization: `Bearer ${tokenStore.getToken()}` },
})

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
