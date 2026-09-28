import axios from 'axios'
import { BASE, auth } from './apiBase'

export const pushApi = {
  vapidPublicKey: () =>
    axios.get(`${BASE}/push/vapid-public-key`).then(r => r.data.publicKey as string),

  subscribe: (subscription: PushSubscriptionJSON) =>
    axios.post(`${BASE}/push/subscribe`, subscription, auth()).then(r => r.data),

  unsubscribe: (endpoint: string) =>
    axios.delete(`${BASE}/push/unsubscribe`, { ...auth(), data: { endpoint } }).then(r => r.data),
}
