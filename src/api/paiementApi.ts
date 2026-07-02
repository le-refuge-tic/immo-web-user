import axios from 'axios'

const BASE = 'https://immo-backend-pw5z.onrender.com/api/v1'

const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}` },
})

export const paiementApi = {
  payerVisite: (visiteId: number, body: any) =>
    axios.post(`${BASE}/paiements/visite/${visiteId}`, body, auth()).then(r => r.data),

  payerLoyer: (body: any) =>
    axios.post(`${BASE}/paiements/loyer`, body, auth()).then(r => r.data),

  getRecu: (paiementId: number) =>
    axios.get(`${BASE}/paiements/${paiementId}/recu`, auth()).then(r => r.data),
}
