import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

/**
 * Sans timeout, une requête lente (ex: réveil à froid du serveur) laisse
 * un bouton en chargement indéfiniment — l'utilisateur croit l'app plantée
 * alors qu'elle attend juste une réponse qui ne viendra jamais assez vite.
 * 30s laisse le temps à un cold start tout en garantissant un retour.
 */
axios.defaults.timeout = 30000

let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('rg_refresh')
  if (!refreshToken) return null
  try {
    const { data } = await axios.post(`${BASE}/auth/refresh`, { refresh_token: refreshToken })
    localStorage.setItem('rg_token', data.access_token)
    if (data.refresh_token) localStorage.setItem('rg_refresh', data.refresh_token)
    return data.access_token as string
  } catch {
    return null
  }
}

function forceLogout() {
  localStorage.removeItem('rg_user')
  localStorage.removeItem('rg_token')
  localStorage.removeItem('rg_refresh')
  if (location.pathname !== '/login') location.href = '/login'
}

/**
 * Le token d'accès expire après 1h. Sans ceci, toute requête faite après
 * expiration échoue avec "Unauthorized" — même en pleine saisie d'un
 * formulaire — sans que l'utilisateur puisse s'en douter ni se rattraper.
 * On rafraîchit une fois via le refresh_token et on rejoue la requête.
 */
axios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const isAuthRoute = typeof original?.url === 'string' && original.url.includes('/auth/')
    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
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
