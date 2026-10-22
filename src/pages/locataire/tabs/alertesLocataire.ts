import type { Notification } from '../../../types/api'

/** Espace de l'onglet : le backend marque « tout lu » les alertes de ce rôle ou sans rôle. */
export const ROLE_ESPACE_LOCATAIRE = 'locataire'

/** Alerte concernée par « Tout marquer comme lu » de l'espace locataire (rôle ciblé ou sans rôle). */
export function estAlerteLocataire(n: Pick<Notification, 'target_role'>): boolean {
  return !n.target_role || n.target_role === ROLE_ESPACE_LOCATAIRE
}

/** Nouvelle liste avec l'alerte `id` lue (la liste d'origine n'est pas modifiée). */
export function marquerLue(notifs: Notification[], id: number): Notification[] {
  return notifs.map(n => (n.id === id ? { ...n, lu: true } : n))
}

/** Nouvelle liste avec lues toutes les alertes de l'espace locataire. */
export function marquerToutesLues(notifs: Notification[]): Notification[] {
  return notifs.map(n => (estAlerteLocataire(n) ? { ...n, lu: true } : n))
}

/** Nombre d'alertes non lues de l'espace locataire. */
export function compterNonLues(notifs: Notification[]): number {
  return notifs.filter(n => !n.lu && estAlerteLocataire(n)).length
}
