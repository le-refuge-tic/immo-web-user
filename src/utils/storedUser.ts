/**
 * Minimisation des données persistées (FE-E-006) : seul le strict nécessaire
 * à l'affichage et au routage est écrit dans localStorage. Les coordonnées
 * (téléphone, email, numéros, URL de pièces d'identité...) restent en mémoire.
 */
const STORED_KEYS = ['id', 'prenom', 'nom', 'role', 'role_principal', 'roles_actifs', 'photo_profil'] as const

export function toStoredUser<T extends object>(user: T): Partial<T> {
  const src = user as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const k of STORED_KEYS) if (k in src) out[k] = src[k]
  return out as Partial<T>
}

export function readStoredUser<T>(): T | null {
  try { return JSON.parse(localStorage.getItem('rg_user') || 'null') }
  catch { return null }
}

export function writeStoredUser(user: object): void {
  localStorage.setItem('rg_user', JSON.stringify(toStoredUser(user)))
}

/**
 * BUG-05 du cahier des rôles : un rafraîchissement du jeton peut changer les rôles enregistrés
 * hors de React (intercepteur axios). Cet événement prévient AuthContext, qui les reprend.
 */
export const STORED_USER_SYNC_EVENT = 'rg:stored-user-sync'

export function notifyStoredUserChanged(): void {
  try { window.dispatchEvent(new Event(STORED_USER_SYNC_EVENT)) } catch { /* hors navigateur */ }
}
