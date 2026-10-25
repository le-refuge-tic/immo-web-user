/**
 * Types de l'espace démarcheur (FE-A-003) : profil affiché dans le tableau de
 * bord et délégations reçues (`GET /delegations/recues`). Déduits des champs
 * lus par les écrans et de `immo-backend/src/delegation`.
 */
import type { Bien, User } from './api'

/**
 * Profil du démarcheur affiché par le tableau de bord et l'onglet Profil :
 * soit la réponse de `GET /users/me`, soit l'utilisateur du contexte d'auth
 * (rôles typés en `string` pour accepter les deux).
 */
export interface ProfilDemarcheur {
  id?: number
  prenom?: string
  nom?: string
  email?: string | null
  telephone?: string | null
  role_principal?: string
  roles_actifs?: string[]
  score_credibilite?: number
  nb_etoiles?: number
  /** Nombre de biens, quand l'API le renseigne (onglet Profil). */
  nb_biens?: number
}

/** Délégation de gestion reçue d'un propriétaire. */
export interface DelegationRecue {
  id: number
  statut: string
  proprietaire?: User | null
  /** Absent = délégation sur tous les biens du propriétaire. */
  bien?: Bien | null
}

/** Résultat de `GET /users/demarcheurs?search=` : annuaire sans coordonnées. */
export type DemarcheurResume = Pick<User, 'id' | 'nom' | 'prenom'>
