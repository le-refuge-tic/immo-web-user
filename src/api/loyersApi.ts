import axios from 'axios'
import { tokenStore } from '../utils/tokenStore'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const auth = () => ({ headers: { Authorization: `Bearer ${tokenStore.getToken()}` } })

export const loyersApi = {
  monLogement: () =>
    axios.get(`${BASE}/loyers/mon-logement`, auth()).then(r => r.data),

  dashboard: () =>
    axios.get(`${BASE}/loyers/dashboard`, auth()).then(r => r.data),

  calendrier: (contratId: number) =>
    axios.get(`${BASE}/loyers/contrats/${contratId}/calendrier`, auth()).then(r => r.data),

  activerGestionApp: (contratId: number) =>
    axios.patch(`${BASE}/loyers/contrats/${contratId}/gestion-app`, {}, auth()).then(r => r.data),
}
