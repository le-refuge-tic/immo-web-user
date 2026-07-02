import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}` },
})

export const notificationsApi = {
  list: () =>
    axios.get(`${BASE}/notifications`, auth()).then(r => r.data),

  markRead: (id: number) =>
    axios.patch(`${BASE}/notifications/${id}/lire`, {}, auth()).then(r => r.data),

  markAllRead: () =>
    axios.patch(`${BASE}/notifications/tout-lire`, {}, auth()).then(r => r.data),
}
