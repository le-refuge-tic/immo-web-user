import axios from 'axios'
import { BASE, auth } from './apiBase'

export const favoritesApi = {
  list: () =>
    axios.get(`${BASE}/biens/favoris`, auth()).then(r => r.data),

  /** Ajoute ou retire le bien des favoris (toggle) ; renvoie l'état résultant. */
  toggle: (bienId: number) =>
    axios.post(`${BASE}/biens/${bienId}/favori`, {}, auth()).then(r => r.data as { isFavori: boolean }),
}
