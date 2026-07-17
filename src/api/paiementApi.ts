import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}` } })

export const paiementApi = {
  // Paiement visite (frais)
  initierVisite: (body: { visite_id: number; telephone: string }) =>
    axios.post(`${BASE}/paiements/visite`, body, auth()).then(r => r.data),

  statutVisite: (refId: string) =>
    axios.get(`${BASE}/paiements/visite/${refId}/statut`, auth()).then(r => r.data),

  recuVisite: (refId: string) =>
    axios.get(`${BASE}/paiements/visite/${refId}/recu`, auth()).then(r => r.data),

  // Paiement intégration (avance + caution)
  initierIntegration: (body: { bien_id: number; telephone: string }) =>
    axios.post(`${BASE}/paiements/integration`, body, auth()).then(r => r.data),

  statutIntegration: (refId: string) =>
    axios.get(`${BASE}/paiements/integration/${refId}/statut`, auth()).then(r => r.data),

  recuIntegration: (refId: string) =>
    axios.get(`${BASE}/paiements/integration/${refId}/recu`, auth()).then(r => r.data),

  // Paiement loyer
  initierLoyer: (body: { contrat_id: number; mois_ids: number[]; telephone: string }) =>
    axios.post(`${BASE}/paiements/loyer`, body, auth()).then(r => r.data),

  statutLoyer: (refId: string) =>
    axios.get(`${BASE}/paiements/loyer/${refId}/statut`, auth()).then(r => r.data),
}
