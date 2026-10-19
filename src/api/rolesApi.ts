import axios from 'axios'
import { refreshAccessToken } from './httpInterceptor'
import { BASE, auth } from './apiBase'

export const rolesApi = {
  activer: async (role: string) => {
    const data = await axios.post(`${BASE}/users/me/roles/activate`, { role }, auth()).then(r => r.data)
    // Le token en cours embarque l'ancien roles_actifs — sans ce refresh,
    // les routes protégées par le rôle qu'on vient d'activer répondent 403.
    await refreshAccessToken()
    return data
  },

  desactiver: async (role: string) => {
    const data = await axios.delete(`${BASE}/users/me/roles/${role}`, auth()).then(r => r.data)
    await refreshAccessToken()
    return data
  },
}
