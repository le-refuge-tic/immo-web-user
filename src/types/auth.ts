/**
 * Corps de requêtes d'authentification et de profil (FE-A-003), dérivés de
 * immo-backend/src/auth/dto/register.dto.ts.
 */
import type { User } from './api'

/** Corps de `POST /auth/register`. */
export interface RegisterBody {
  role: string
  civilite?: string
  nom: string
  prenom: string
  telephone?: string
  email?: string
  password: string
  numero_whatsapp?: string
  /** Champ piège anti-robot (honeypot) : doit rester vide. */
  site_web?: string
}

/** Corps de `PATCH /users/me` : champs de profil modifiables. */
export type ProfilUpdateBody = Partial<
  Pick<User, 'civilite' | 'nom' | 'prenom' | 'pseudonyme' | 'email' | 'numero_whatsapp'>
>
