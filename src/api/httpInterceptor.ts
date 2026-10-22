import axios from 'axios'
import { tokenStore } from '../utils/tokenStore'
import { BASE } from './apiBase'
import type { RefreshResponse } from '../types/auth'
import { revokeSession } from './authApi'
import { readStoredUser, writeStoredUser } from '../utils/storedUser'
import { markSessionExpired } from '../utils/sessionExpiry'

/**
 * Sans timeout, une requête lente (ex: réveil à froid du serveur) laisse
 * un bouton en chargement indéfiniment — l'utilisateur croit l'app plantée
 * alors qu'elle attend juste une réponse qui ne viendra jamais assez vite.
 * 30s laisse le temps à un cold start tout en garantissant un retour.
 */
axios.defaults.timeout = 30000

/**
 * Le cold start Render free tier (~50s) peut dépasser les 30s par défaut sur
 * les mutations (POST/PATCH/DELETE), causant des échecs apparents alors que
 * la requête a en fait abouti côté serveur. On leur laisse 90s.
 */
axios.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase()
  if (method && method !== 'get' && method !== 'head') config.timeout = 90000
  return config
})

let refreshing: Promise<string | null> | null = null

/**
 * Exporté pour être appelé explicitement après activation/désactivation d'un
 * rôle : le token d'accès embarque `roles_actifs` au moment de sa création et
 * n'est jamais réémis tout seul — sans ce rafraîchissement immédiat, les
 * routes protégées par le nouveau rôle répondent 403 pendant jusqu'à 1h.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.getRefresh()
  if (!refreshToken) return null
  try {
    const { data } = await axios.post<RefreshResponse>(`${BASE}/auth/refresh`, { refresh_token: refreshToken })
    tokenStore.setToken(data.access_token)
    if (data.refresh_token) tokenStore.setRefresh(data.refresh_token)
    if (data.user) {
      writeStoredUser(data.user)
    } else {
      try {
        const payload = JSON.parse(atob(data.access_token.split('.')[1]))
        if (payload.roles_actifs) {
          const u = readStoredUser<object>()
          if (u) writeStoredUser({ ...u, roles_actifs: payload.roles_actifs })
        }
      } catch {}
    }
    return data.access_token as string
  } catch {
    // Un autre onglet a pu rafraîchir juste avant avec ce même refresh token
    // (usage unique) : on reprend alors ses jetons au lieu de déconnecter.
    const actuel = tokenStore.getRefresh()
    if (actuel && actuel !== refreshToken) return tokenStore.getToken() || null
    return null
  }
}

function forceLogout() {
  revokeSession()
  localStorage.removeItem('rg_user')
  localStorage.removeItem('rg_active_role')
  tokenStore.clearTokens()
  // FE-B-002 : retour à la page en cours après reconnexion, avec un message
  // « session expirée » plutôt qu'un écran de connexion muet.
  markSessionExpired(location.pathname + location.search)
  if (location.pathname !== '/login') location.href = '/login'
}

/**
 * Le token d'accès expire après 15 min. Sans ceci, toute requête faite après
 * expiration échoue avec "Unauthorized" — même en pleine saisie d'un
 * formulaire — sans que l'utilisateur puisse s'en douter ni se rattraper.
 * On rafraîchit une fois via le refresh_token et on rejoue la requête.
 */
axios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    // Les routes /auth/ renvoient aussi 401 pour une erreur métier (mot de
    // passe ou code faux) : on ne rafraîchit que sur l'expiration du jeton,
    // que le garde JWT signale par le message générique « Unauthorized ».
    const isAuthRoute = typeof original?.url === 'string' && original.url.includes('/auth/')
    const jetonExpire = error.response?.data?.message === 'Unauthorized'
    if (error.response?.status === 401 && original && !original._retry && (!isAuthRoute || jetonExpire)) {
      original._retry = true
      if (!refreshing) refreshing = refreshAccessToken().finally(() => { refreshing = null })
      const newToken = await refreshing
      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` }
        return axios(original)
      }
      forceLogout()
    }
    return Promise.reject(error)
  },
)
