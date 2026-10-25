import axios from 'axios'
import { BASE, auth } from './apiBase'
import type { ListResponse } from '../types/api'
import type { DelegationRecue, DemarcheurResume } from '../types/demarcheur'
import type { DelegationEmise } from '../types/proprietaire'

export const delegationApi = {
  // Propriétaire : proposer une délégation à un démarcheur
  proposer: (body: {
    demarcheur_id: number
    bien_id?: number
    date_fin?: string
    permissions?: string[]
    taux_commission_demarcheur?: number
  }) => axios.post<DelegationEmise>(`${BASE}/delegations`, body, auth()).then(r => r.data),

  // Propriétaire : mes délégations émises
  emises: () =>
    axios.get<ListResponse<DelegationEmise>>(`${BASE}/delegations/emises`, auth()).then(r => r.data),

  // Propriétaire : révoquer une délégation active
  revoquer: (id: number, motif?: string) =>
    axios.delete<DelegationEmise>(`${BASE}/delegations/${id}`, { ...auth(), data: { motif } }).then(r => r.data),

  // Démarcheur : mes délégations reçues
  recues: () =>
    axios.get<ListResponse<DelegationRecue>>(`${BASE}/delegations/recues`, auth()).then(r => r.data),

  // Démarcheur : accepter ou refuser une délégation en attente
  repondre: (id: number, accepter: boolean, motif?: string) =>
    axios.patch<DelegationEmise>(`${BASE}/delegations/${id}/repondre`, { accepter, motif }, auth()).then(r => r.data),

  // Recherche d'un démarcheur par téléphone/nom, pour le sélecteur de délégation.
  // Nécessite l'endpoint backend GET /users/demarcheurs?search= (voir prompt backend).
  rechercherDemarcheur: (search: string) =>
    axios.get<ListResponse<DemarcheurResume>>(`${BASE}/users/demarcheurs`, { ...auth(), params: { search } }).then(r => r.data),
}
