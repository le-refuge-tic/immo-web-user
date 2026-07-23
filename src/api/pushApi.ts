import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}` } })

export const pushApi = {
  vapidPublicKey: () =>
    axios.get(`${BASE}/push/vapid-public-key`).then(r => r.data.publicKey as string),

  subscribe: (subscription: PushSubscriptionJSON) =>
    axios.post(`${BASE}/push/subscribe`, subscription, auth()).then(r => r.data),

  unsubscribe: (endpoint: string) =>
    axios.delete(`${BASE}/push/unsubscribe`, { ...auth(), data: { endpoint } }).then(r => r.data),
}
