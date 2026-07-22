import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}` },
})

export const chatApi = {
  conversations: () =>
    axios.get(`${BASE}/chat/conversations`, auth()).then(r => r.data),

  creerConversation: (bienId: number) =>
    axios.post(`${BASE}/chat/conversations`, { bienId }, auth()).then(r => r.data),

  search: (q: string) =>
    axios.get(`${BASE}/chat/search`, { ...auth(), params: { q } }).then(r => r.data),

  messages: (convId: number, params?: any) =>
    axios.get(`${BASE}/chat/conversations/${convId}/messages`, { ...auth(), params }).then(r => r.data),

  envoyer: (convId: number, contenu: string, replyToId?: number, replyToContenu?: string) =>
    axios.post(`${BASE}/chat/conversations/${convId}/messages`,
      { contenu, reply_to_id: replyToId, reply_to_contenu: replyToContenu }, auth()).then(r => r.data),

  marquerLus: (convId: number) =>
    axios.post(`${BASE}/chat/conversations/${convId}/lus`, {}, auth()).then(r => r.data),

  togglePin: (convId: number, msgId: number | null) =>
    axios.post(`${BASE}/chat/conversations/${convId}/pin`, { msgId }, auth()).then(r => r.data),

  modifierMessage: (msgId: number, contenu: string) =>
    axios.patch(`${BASE}/chat/messages/${msgId}`, { contenu }, auth()).then(r => r.data),

  supprimerMessage: (msgId: number) =>
    axios.delete(`${BASE}/chat/messages/${msgId}`, auth()).then(r => r.data),

  proposerCreneau: (convId: number, proposedAt: string) =>
    axios.post(`${BASE}/chat/conversations/${convId}/slot`, { proposed_at: proposedAt }, auth()).then(r => r.data),

  repondreProposition: (messageId: number, response: 'accepted' | 'declined' | 'countered', proposedAt?: string) =>
    axios.patch(`${BASE}/chat/slots/${messageId}`, { response, proposed_at: proposedAt }, auth()).then(r => r.data),
}
