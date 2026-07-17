import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}` } })

export const feedbackApi = {
  soumettreVisite: (body: { visite_id: number; bien_id: number; note: number; commentaire?: string }) =>
    axios.post(`${BASE}/feedbacks/visite`, body, auth()).then(r => r.data),

  mesFeedbacks: () =>
    axios.get(`${BASE}/feedbacks/mes-feedbacks`, auth()).then(r => r.data),
}
