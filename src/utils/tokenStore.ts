const TOKEN_KEY   = 'rg_token'
const REFRESH_KEY = 'rg_refresh'

/**
 * Jetons en localStorage : la session survit à la fermeture de l'onglet (le
 * sessionStorage, utilisé auparavant, obligeait à se reconnecter — mot de
 * passe et OTP — à chaque visite, et le navigateur mobile ferme souvent les
 * onglets de lui-même). Le jeton d'accès dure 15 min et le refresh est
 * renouvelé à chaque usage ; la déconnexion le révoque côté serveur.
 */
const lire = (cle: string): string => {
  try {
    const v = localStorage.getItem(cle)
    if (v) return v
    // Migration : session ouverte avant le passage au localStorage.
    const ancien = sessionStorage.getItem(cle)
    if (ancien) {
      localStorage.setItem(cle, ancien)
      sessionStorage.removeItem(cle)
      return ancien
    }
  } catch { /* stockage indisponible (navigation privée) */ }
  return ''
}

const ecrire = (cle: string, v: string) => {
  try { localStorage.setItem(cle, v) } catch { /* stockage indisponible */ }
}

const effacer = (cle: string) => {
  try {
    localStorage.removeItem(cle)
    sessionStorage.removeItem(cle)
  } catch { /* ignore */ }
}

export const tokenStore = {
  getToken:     () => lire(TOKEN_KEY),
  setToken:     (t: string) => ecrire(TOKEN_KEY, t),
  getRefresh:   () => lire(REFRESH_KEY),
  setRefresh:   (t: string) => ecrire(REFRESH_KEY, t),
  clearTokens:  () => {
    effacer(TOKEN_KEY)
    effacer(REFRESH_KEY)
  },
}
