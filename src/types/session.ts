/** Utilisateur de la session, tel que stocké et renvoyé par les routes d'authentification. */
export interface SessionUser {
  id: number
  nom: string
  prenom: string
  email: string | null
  telephone: string | null
  role: string
  roles_actifs?: string[]
  role_principal?: string
  photo_profil: string | null
  score_credibilite?: number
  nb_etoiles?: number
  penalite_pourcentage?: number
}

/** Réponse d'une connexion réussie (mot de passe ou OTP) passée à `AuthContext.login`. */
export interface LoginPayload {
  user: SessionUser
  access_token: string
  refresh_token: string
}
