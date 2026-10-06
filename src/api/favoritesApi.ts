import axios from 'axios'
import type { Bien, FavoriToggleResponse, ListResponse } from '../types/api'
import { BASE, auth } from './apiBase'

export const favoritesApi = {
  list: (signal?: AbortSignal) =>
    axios.get<ListResponse<Bien>>(`${BASE}/biens/favoris`, { ...auth(), signal }).then(r => r.data),

  /** Ajoute ou retire le bien des favoris (toggle) ; renvoie l'état résultant. */
  toggle: (bienId: number) =>
    axios.post(`${BASE}/biens/${bienId}/favori`, {}, auth()).then(r => r.data as FavoriToggleResponse),
}
