import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}` } })

export const rolesApi = {
  activer: (role: string) =>
    axios.post(`${BASE}/users/me/roles/activate`, { role }, auth()).then(r => r.data),

  desactiver: (role: string) =>
    axios.delete(`${BASE}/users/me/roles/${role}`, auth()).then(r => r.data),
}
