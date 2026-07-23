import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}` },
})

export const visitesApi = {
  mesVisites: () =>
    axios.get(`${BASE}/visites`, auth()).then(r => r.data),

  creneaux: (bienId: number) =>
    axios.get(`${BASE}/visites/creneaux/${bienId}`, auth()).then(r => r.data),

  reserver: (body: any) =>
    axios.post(`${BASE}/visites`, body, auth()).then(r => r.data),

  annuler: (id: number) =>
    axios.patch(`${BASE}/visites/${id}/annuler`, {}, auth()).then(r => r.data),

  // propriétaire/demarcheur
  mesCreneaux: () =>
    axios.get(`${BASE}/visites/mes-creneaux`, auth()).then(r => r.data),

  creerCreneau: (body: any) =>
    axios.post(`${BASE}/visites/creneaux`, body, auth()).then(r => r.data),

  supprimerCreneau: (id: number) =>
    axios.delete(`${BASE}/visites/creneaux/${id}`, auth()).then(r => r.data),

  reservationsRecues: () =>
    axios.get(`${BASE}/visites`, auth()).then(r => r.data),

  confirmerVisite: (id: number) =>
    axios.patch(`${BASE}/visites/${id}/confirmer`, {}, auth()).then(r => r.data),

  refuserVisite: (id: number) =>
    axios.patch(`${BASE}/visites/${id}/refuser`, {}, auth()).then(r => r.data),

  accepterContreProposition: (id: number) =>
    axios.patch(`${BASE}/visites/${id}/accepter`, {}, auth()).then(r => r.data),

  marquerEffectuee: (id: number) =>
    axios.patch(`${BASE}/visites/${id}/effectuee`, {}, auth()).then(r => r.data),

  deciderIntegration: (id: number, integre: boolean) =>
    axios.patch(`${BASE}/visites/${id}/integration`, { integre }, auth()).then(r => r.data),

  reserverVisite: (bienId: number, dateSouhaitee: string) =>
    axios.post(`${BASE}/visites`, { bien_id: bienId, date_souhaitee: dateSouhaitee }, auth()).then(r => r.data),

  donnerFeedback: (id: number, body: { note: number; tags?: string[]; texte?: string }) =>
    axios.patch(`${BASE}/visites/${id}/feedback`, body, auth()).then(r => r.data),
}
