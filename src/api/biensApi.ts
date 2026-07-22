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

  create: (body: any) =>
    axios.post(`${BASE}/biens`, body, auth()).then(r => r.data),

  update: (id: number, body: any) =>
    axios.patch(`${BASE}/biens/${id}`, body, auth()).then(r => r.data),

  updateStatut: (id: number, statut: string) =>
    axios.patch(`${BASE}/biens/${id}/statut`, { statut }, auth()).then(r => r.data),

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
}
