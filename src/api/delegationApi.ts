import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}` } })

export const delegationApi = {
  // Propriétaire : proposer une délégation à un démarcheur
  proposer: (body: {
    demarcheur_id: number
    bien_id?: number
    date_fin?: string
    permissions?: string[]
    taux_commission_demarcheur?: number
  }) => axios.post(`${BASE}/delegations`, body, auth()).then(r => r.data),

  // Propriétaire : mes délégations émises
  emises: () =>
    axios.get(`${BASE}/delegations/emises`, auth()).then(r => r.data),

  // Propriétaire : révoquer une délégation active
  revoquer: (id: number, motif?: string) =>
    axios.delete(`${BASE}/delegations/${id}`, { ...auth(), data: { motif } }).then(r => r.data),

  // Démarcheur : mes délégations reçues
  recues: () =>
    axios.get(`${BASE}/delegations/recues`, auth()).then(r => r.data),

  // Démarcheur : accepter ou refuser une délégation en attente
  repondre: (id: number, accepter: boolean, motif?: string) =>
    axios.patch(`${BASE}/delegations/${id}/repondre`, { accepter, motif }, auth()).then(r => r.data),

  // Recherche d'un démarcheur par téléphone/nom, pour le sélecteur de délégation.
  // Nécessite l'endpoint backend GET /users/demarcheurs?search= (voir prompt backend).
  rechercherDemarcheur: (search: string) =>
    axios.get(`${BASE}/users/demarcheurs`, { ...auth(), params: { search } }).then(r => r.data),
}
