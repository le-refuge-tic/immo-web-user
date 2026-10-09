import axios from 'axios'
import type { Bien, BienResponse, ListResponse, Photo } from '../types/api'
import { tokenStore } from '../utils/tokenStore'
import { BASE, auth } from './apiBase'
import { compressImage } from '../utils/compressImage'

const API_MAX_LIMIT = 100

/** Corps d'une création / modification de bien (champs variables selon le type). */
export type BienPayload = Record<string, unknown>

/** Filtres de `GET /biens` (transaction, type, ville, prix, pagination…). */
export interface BiensListParams {
  transaction?: string
  type?: string
  limit?: number
  page?: number
  [filtre: string]: string | number | boolean | undefined
}

/** Demande de liaison à un bien en gestion (en attente de validation admin). */
export interface DemandeGestion {
  id: number
  bien_id?: number
  locataire_id?: number
  statut?: string
  notes_admin?: string
  created_at?: string
  bien?: Bien
}

export const biensApi = {
  // L'API refuse (400) tout `limit` > 100 : on plafonne ici pour que la recherche ne casse jamais.
  list: (params?: BiensListParams) =>
    axios.get<ListResponse<Bien>>(`${BASE}/biens`, {
      params: params?.limit && params.limit > API_MAX_LIMIT ? { ...params, limit: API_MAX_LIMIT } : params,
    }).then(r => r.data),

  /** NB (FE-E-005) : le client ne doit dépendre d'aucun champ `user.*` (telephone, numero_retrait, cip_url...) de cette réponse publique ; seul `user_id` est utilisé. */
  byId: (id: number) =>
    axios.get<BienResponse>(`${BASE}/biens/${id}`, auth()).then(r => r.data),

  mesBiens: () =>
    axios.get<ListResponse<Bien>>(`${BASE}/biens/mes-biens`, auth()).then(r => r.data),

  /** Biens ajoutés en gestion (sans annonce publique), avec le locataire lié s'il y en a un. */
  mesBiensGestion: () =>
    axios.get<ListResponse<Bien>>(`${BASE}/biens/mes-biens-gestion`, auth()).then(r => r.data),

  create: (body: BienPayload) =>
    axios.post<BienResponse>(`${BASE}/biens`, body, auth()).then(r => r.data),

  /** Crée un bien en gestion (pas d'annonce publique) : approuvé d'office, avec un code d'invitation. */
  createEnGestion: (body: BienPayload) =>
    axios.post<BienResponse>(`${BASE}/biens`, { ...body, en_gestion: true }, auth()).then(r => r.data),

  /** Régénère le code d'invitation d'un bien en gestion. */
  regenererCode: (id: number) =>
    axios.post(`${BASE}/biens/${id}/regenerer-code`, {}, auth()).then(r => r.data as { code_invitation: string }),

  /** Locataire : rejoint un bien en gestion via le code d'invitation partagé par le propriétaire. */
  rejoindre: (code: string) =>
    axios.post<BienResponse>(`${BASE}/biens/rejoindre`, { code }, auth()).then(r => r.data),

  /** Mes demandes de liaison à un bien en gestion (en attente de validation admin). */
  mesDemandesGestion: () =>
    axios.get<ListResponse<DemandeGestion>>(`${BASE}/biens/mes-demandes-gestion`, auth()).then(r => r.data),

  update: (id: number, body: BienPayload) =>
    axios.patch<BienResponse>(`${BASE}/biens/${id}`, body, auth()).then(r => r.data),

  updateStatut: (id: number, statut: string) =>
    axios.patch<BienResponse>(`${BASE}/biens/${id}/statut`, { statut }, auth()).then(r => r.data),

  /** Visites confirmées/à venir pour ce bien — public, sans noms (créneaux uniquement). */
  visitesPlanifiees: (id: number) =>
    axios.get(`${BASE}/biens/${id}/visites-planifiees`).then(r => r.data),

  /** Enregistre une vue (1 user = 1 vue) et retourne le compteur mis à jour. */
  incrementerVue: (id: number) =>
    axios.post(`${BASE}/biens/${id}/vue`, {}, auth()).then(r => r.data),

  delete: (id: number) =>
    axios.delete(`${BASE}/biens/${id}`, auth()).then(r => r.data),

  uploadPhoto: async (bienId: number, file: File) => {
    const form = new FormData()
    form.append('photo', await compressImage(file))
    return axios.post<Photo>(`${BASE}/biens/${bienId}/photos`, form, {
      headers: {
        Authorization: `Bearer ${tokenStore.getToken()}`,
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data)
  },

  uploadVideo: (bienId: number, file: File) => {
    const form = new FormData()
    form.append('video', file)
    return axios.post(`${BASE}/biens/${bienId}/video`, form, {
      headers: {
        Authorization: `Bearer ${tokenStore.getToken()}`,
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data)
  },
}
