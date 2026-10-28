/**
 * Les comptes de l'équipe Refuge (admin, super admin, commercial) n'ont pas de
 * session sur le site utilisateur : ils passent par l'admin web. Le backend les
 * refuse déjà (`espace: 'public'`) ; ce contrôle couvre aussi une session
 * staff déjà présente dans le navigateur.
 */
const ROLES_STAFF = ['admin', 'super_admin', 'commercial']

export const MESSAGE_COMPTE_STAFF =
  "Ce compte appartient à l'équipe Refuge : connectez-vous depuis l'espace administration."

export function estCompteStaff(user: { role?: string; role_principal?: string } | null | undefined): boolean {
  if (!user) return false
  return ROLES_STAFF.includes(user.role ?? '') || ROLES_STAFF.includes(user.role_principal ?? '')
}

export class CompteStaffRefuse extends Error {
  constructor() {
    super(MESSAGE_COMPTE_STAFF)
    this.name = 'CompteStaffRefuse'
  }
}
