import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}` },
})

export const chatApi = {
  conversations: () =>
    axios.get(`${BASE}/chat/conversations`, auth()).then(r => r.data),

  messages: (convId: number, params?: any) =>
    axios.get(`${BASE}/chat/conversations/${convId}/messages`, { ...auth(), params }).then(r => r.data),

  envoyer: (convId: number, contenu: string) =>
    axios.post(`${BASE}/chat/conversations/${convId}/messages`, { contenu }, auth()).then(r => r.data),
}
