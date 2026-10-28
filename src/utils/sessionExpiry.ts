/**
 * FE-B-002 — Session expirée : au lieu d'un retour muet à la connexion, on
 * mémorise la page en cours (retour automatique après reconnexion) et on
 * signale l'expiration à l'écran de connexion.
 */
export const POST_LOGIN_REDIRECT_KEY = 'post_login_redirect'
const SESSION_EXPIRED_KEY = 'session_expired'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const PAGES_CONNEXION = ['/login', '/register', '/mot-de-passe-oublie']

/**
 * Chemin interne uniquement : refuse `//hote`, `/\\hote`, toute URL absolue et les caractères de contrôle
 * (le navigateur retire tabulations et retours à la ligne en résolvant l'URL : `/<tab>/hote` deviendrait `//hote`).
 */
export function estDestinationInterne(path: string): boolean {
  // eslint-disable-next-line no-control-regex
  return /^\/(?![/\\])[^\u0000-\u001f\u007f]*$/.test(path)
}

export function markSessionExpired(pathWithSearch: string, storage?: StorageLike): void {
  try {
    const target = storage ?? sessionStorage
    const pathname = pathWithSearch.split(/[?#]/)[0]
    // Déjà sur un écran de connexion : rien à signaler ni à mémoriser.
    if (PAGES_CONNEXION.includes(pathname)) return
    target.setItem(SESSION_EXPIRED_KEY, '1')
    // La page où la session a expiré est la plus récente intention de l'utilisateur :
    // elle remplace une destination plus ancienne (ex. réservation abandonnée avant connexion).
    if (estDestinationInterne(pathWithSearch)) target.setItem(POST_LOGIN_REDIRECT_KEY, pathWithSearch)
  } catch {
    // Stockage indisponible : la déconnexion doit quand même aboutir.
  }
}

export function isSessionExpired(storage: StorageLike = sessionStorage): boolean {
  return storage.getItem(SESSION_EXPIRED_KEY) === '1'
}

/** À appeler une fois le message affiché : il n'apparaît qu'à la première arrivée. */
export function clearSessionExpired(storage: StorageLike = sessionStorage): void {
  storage.removeItem(SESSION_EXPIRED_KEY)
}
