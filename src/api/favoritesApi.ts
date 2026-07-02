import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}` },
})

export const favoritesApi = {
  list: () =>
    axios.get(`${BASE}/favoris`, auth()).then(r => r.data),

  add: (bienId: number) =>
    axios.post(`${BASE}/favoris/${bienId}`, {}, auth()).then(r => r.data),

  remove: (bienId: number) =>
    axios.delete(`${BASE}/favoris/${bienId}`, auth()).then(r => r.data),
}
