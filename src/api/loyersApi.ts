import axios from 'axios'
import { BASE, auth } from './apiBase'
import type { MessageResponse } from '../types/auth'
import type { Loyer, MonLogement } from '../types/locataire'
import type { LoyersDashboard } from '../types/proprietaire'

export const loyersApi = {
  monLogement: () =>
    axios.get<MonLogement>(`${BASE}/loyers/mon-logement`, auth()).then(r => r.data),

  dashboard: () =>
    axios.get<LoyersDashboard>(`${BASE}/loyers/dashboard`, auth()).then(r => r.data),

  calendrier: (contratId: number) =>
    axios.get<Loyer[]>(`${BASE}/loyers/contrats/${contratId}/calendrier`, auth()).then(r => r.data),

  activerGestionApp: (contratId: number) =>
    axios.patch<MessageResponse>(`${BASE}/loyers/contrats/${contratId}/gestion-app`, {}, auth()).then(r => r.data),
}
