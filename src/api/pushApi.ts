import axios from 'axios'
import { BASE, auth } from './apiBase'

export const pushApi = {
  vapidPublicKey: () =>
    axios.get(`${BASE}/push/vapid-public-key`).then(r => r.data.publicKey as string),

  subscribe: (subscription: PushSubscriptionJSON) =>
    axios.post(`${BASE}/push/subscribe`, subscription, auth()).then(r => r.data),

  /** `headers` : jeton capturé avant la déconnexion (les jetons sont effacés juste après). */
  unsubscribe: (endpoint: string, headers = auth().headers) =>
    axios.delete(`${BASE}/push/unsubscribe`, { headers, data: { endpoint } }).then(r => r.data),
}
