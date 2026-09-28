import axios from 'axios'
import { tokenStore } from '../utils/tokenStore'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

const auth = () => ({
  headers: { Authorization: `Bearer ${tokenStore.getToken()}` },
})

export const favoritesApi = {
  list: () =>
    axios.get(`${BASE}/biens/favoris`, auth()).then(r => r.data),

  /** Ajoute ou retire le bien des favoris (toggle) ; renvoie l'état résultant. */
  toggle: (bienId: number) =>
    axios.post(`${BASE}/biens/${bienId}/favori`, {}, auth()).then(r => r.data as { isFavori: boolean }),
}
