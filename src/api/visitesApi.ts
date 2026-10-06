import axios from 'axios'
import type { Creneau, FeedbackVisiteBody, ListResponse, Visite } from '../types/api'
import { BASE, auth } from './apiBase'

export interface ReserverVisiteBody { bien_id: number; date_souhaitee?: string; creneau_id?: number }
/** Forme envoyée par les écrans (routes créneaux désactivées côté backend : le DTO attend date_debut/date_fin). */
export interface CreerCreneauBody { bien_id: number; debut: string; duree_minutes: number }

export const visitesApi = {
  mesVisites: (signal?: AbortSignal) =>
    axios.get<ListResponse<Visite>>(`${BASE}/visites`, { ...auth(), signal }).then(r => r.data),

  creneaux: (bienId: number) =>
    axios.get<ListResponse<Creneau>>(`${BASE}/visites/creneaux/${bienId}`, auth()).then(r => r.data),

  reserver: (body: ReserverVisiteBody) =>
    axios.post<Visite>(`${BASE}/visites`, body, auth()).then(r => r.data),

  annuler: (id: number) =>
    axios.patch<Visite>(`${BASE}/visites/${id}/annuler`, {}, auth()).then(r => r.data),

  // propriétaire/demarcheur
  mesCreneaux: () =>
    axios.get<ListResponse<Creneau>>(`${BASE}/visites/mes-creneaux`, auth()).then(r => r.data),

  creerCreneau: (body: CreerCreneauBody) =>
    axios.post<Creneau>(`${BASE}/visites/creneaux`, body, auth()).then(r => r.data),

  supprimerCreneau: (id: number) =>
    axios.delete(`${BASE}/visites/creneaux/${id}`, auth()).then(r => r.data),

  reservationsRecues: () =>
    axios.get<ListResponse<Visite>>(`${BASE}/visites`, auth()).then(r => r.data),

  confirmerVisite: (id: number) =>
    axios.patch<Visite>(`${BASE}/visites/${id}/confirmer`, {}, auth()).then(r => r.data),

  refuserVisite: (id: number) =>
    axios.patch<Visite>(`${BASE}/visites/${id}/refuser`, {}, auth()).then(r => r.data),

  accepterContreProposition: (id: number) =>
    axios.patch<Visite>(`${BASE}/visites/${id}/accepter`, {}, auth()).then(r => r.data),

  contreProposer: (id: number, dateProposee: string) =>
    axios.patch<Visite>(`${BASE}/visites/${id}/contre-proposer`, { date_proposee: dateProposee }, auth()).then(r => r.data),

  /** Client propose une autre date en retour, quand la contre-proposition du gestionnaire ne convient pas. */
  reProposer: (id: number, dateProposee: string) =>
    axios.patch<Visite>(`${BASE}/visites/${id}/re-proposer`, { date_proposee: dateProposee }, auth()).then(r => r.data),

  marquerEffectuee: (id: number) =>
    axios.patch<Visite>(`${BASE}/visites/${id}/effectuee`, {}, auth()).then(r => r.data),

  deciderIntegration: (id: number, integre: boolean) =>
    axios.patch<Visite>(`${BASE}/visites/${id}/integration`, { decision: integre ? 'accepte' : 'refuse' }, auth()).then(r => r.data),

  reserverVisite: (bienId: number, dateSouhaitee: string) =>
    axios.post<Visite>(`${BASE}/visites`, { bien_id: bienId, date_souhaitee: dateSouhaitee }, auth()).then(r => r.data),

  donnerFeedback: (id: number, body: FeedbackVisiteBody) =>
    axios.patch<Visite>(`${BASE}/visites/${id}/feedback`, body, auth()).then(r => r.data),

  /** Visites confirmées d'un bien — gestionnaire uniquement (compte + dates, sans noms). */
  visitesConfirmeesParBien: (bienId: number) =>
    axios.get(`${BASE}/visites/bien/${bienId}/confirmees`, auth()).then(r => r.data),
}
