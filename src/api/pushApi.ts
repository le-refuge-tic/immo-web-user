import axios from 'axios'
import type { MessageResponse } from '../types/auth'
import { BASE, auth } from './apiBase'

export const pushApi = {
  vapidPublicKey: () =>
    axios.get<{ publicKey: string }>(`${BASE}/push/vapid-public-key`).then(r => r.data.publicKey),

  subscribe: (subscription: PushSubscriptionJSON) =>
    axios.post<MessageResponse>(`${BASE}/push/subscribe`, subscription, auth()).then(r => r.data),

  /** `headers` : jeton capturé avant la déconnexion (les jetons sont effacés juste après). */
  unsubscribe: (endpoint: string, headers = auth().headers) =>
    axios.delete<MessageResponse>(`${BASE}/push/unsubscribe`, { headers, data: { endpoint } }).then(r => r.data),
}
