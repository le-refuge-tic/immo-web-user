import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}` },
})

export const biensApi = {
  list: (params?: any) =>
    axios.get(`${BASE}/biens`, { params }).then(r => r.data),

  byId: (id: number) =>
    axios.get(`${BASE}/biens/${id}`, auth()).then(r => r.data),

  mesBiens: () =>
    axios.get(`${BASE}/biens/mes-biens`, auth()).then(r => r.data),

  /** Biens ajoutés en gestion (sans annonce publique), avec le locataire lié s'il y en a un. */
  mesBiensGestion: () =>
    axios.get(`${BASE}/biens/mes-biens-gestion`, auth()).then(r => r.data),

  create: (body: any) =>
    axios.post(`${BASE}/biens`, body, auth()).then(r => r.data),

  /** Crée un bien en gestion (pas d'annonce publique) : approuvé d'office, avec un code d'invitation. */
  createEnGestion: (body: any) =>
    axios.post(`${BASE}/biens`, { ...body, en_gestion: true }, auth()).then(r => r.data),

  /** Régénère le code d'invitation d'un bien en gestion. */
  regenererCode: (id: number) =>
    axios.post(`${BASE}/biens/${id}/regenerer-code`, {}, auth()).then(r => r.data as { code_invitation: string }),

  /** Locataire : rejoint un bien en gestion via le code d'invitation partagé par le propriétaire. */
  rejoindre: (code: string) =>
    axios.post(`${BASE}/biens/rejoindre`, { code }, auth()).then(r => r.data),

  /** Mes demandes de liaison à un bien en gestion (en attente de validation admin). */
  mesDemandesGestion: () =>
    axios.get(`${BASE}/biens/mes-demandes-gestion`, auth()).then(r => r.data),

  update: (id: number, body: any) =>
    axios.patch(`${BASE}/biens/${id}`, body, auth()).then(r => r.data),

  updateStatut: (id: number, statut: string) =>
    axios.patch(`${BASE}/biens/${id}/statut`, { statut }, auth()).then(r => r.data),

  /** Visites confirmées/à venir pour ce bien — public, sans noms (créneaux uniquement). */
  visitesPlanifiees: (id: number) =>
    axios.get(`${BASE}/biens/${id}/visites-planifiees`).then(r => r.data),

  /** Enregistre une vue (1 user = 1 vue) et retourne le compteur mis à jour. */
  incrementerVue: (id: number) =>
    axios.post(`${BASE}/biens/${id}/vue`, {}, auth()).then(r => r.data),

  delete: (id: number) =>
    axios.delete(`${BASE}/biens/${id}`, auth()).then(r => r.data),

  uploadPhoto: (bienId: number, file: File) => {
    const form = new FormData()
    form.append('photo', file)
    return axios.post(`${BASE}/biens/${bienId}/photos`, form, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}`,
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data)
  },

  uploadVideo: (bienId: number, file: File) => {
    const form = new FormData()
    form.append('video', file)
    return axios.post(`${BASE}/biens/${bienId}/video`, form, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}`,
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data)
  },
}
