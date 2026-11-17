/**
 * Lot 13 — règles des rôles côté site, alignées sur le backend et l'app mobile :
 * - seuls prospect et propriétaire s'activent soi-même (`ROLES_AUTO_ACTIVABLES` du backend) ;
 * - un propriétaire a toujours accès à l'espace prospect (le backend l'ajoute à l'activation) ;
 * - locataire ne s'obtient qu'en rejoignant un logement via le code d'invitation ;
 * - le rôle démarcheur est abandonné (décision du 17/11) : il n'apparaît plus et un compte
 *   qui l'a encore actif est basculé sur son rôle principal (sans modification en base).
 */

export const ROLE_ABANDONNE = 'demarcheur'
export const ROLES_ACTIVABLES: readonly string[] = ['prospect', 'proprietaire']
export const ROLE_PAR_DEFAUT = 'prospect'

/** Espace (route) de chaque rôle ; prospect navigue sur le site public. */
export const ESPACE_PAR_ROLE: Record<string, string> = {
  prospect: '/',
  proprietaire: '/proprietaire',
  locataire: '/locataire',
}

/** Rôles actifs sans le rôle abandonné. */
export const rolesUtilisables = (roles: readonly string[]): string[] => roles.filter(r => r !== ROLE_ABANDONNE)

type ComptePourRoles = { role_principal?: string | null; role?: string | null; roles_actifs?: string[] | null }

/**
 * Rôle de repli d'un compte : son rôle principal, sauf s'il s'agit du démarcheur ; alors
 * propriétaire s'il l'a, sinon prospect.
 */
export function roleDeRepli(u: ComptePourRoles | null | undefined): string {
  if (!u) return ''
  const principal = u.role_principal || u.role || ''
  if (principal && principal !== ROLE_ABANDONNE) return principal
  const actifs = rolesUtilisables(u.roles_actifs ?? [])
  return actifs.includes('proprietaire') ? 'proprietaire' : ROLE_PAR_DEFAUT
}

export type EtatRole = 'actif' | 'activable' | 'sur_invitation'

/** Ce qu'on peut faire d'un rôle dans l'écran « Mes rôles ». */
export function etatRole(cle: string, actifs: readonly string[]): EtatRole {
  if (actifs.includes(cle)) return 'actif'
  return ROLES_ACTIVABLES.includes(cle) ? 'activable' : 'sur_invitation'
}

/** Le backend limite à 3 rôles actifs simultanés. */
export const MAX_ROLES_ACTIFS = 3
