/**
 * Corps de requêtes d'authentification et de profil (FE-A-003), dérivés de
 * immo-backend/src/auth/dto/register.dto.ts.
 */
import type { User } from './api'
import type { LoginPayload, SessionUser } from './session'

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

// ─── Réponses (FE-A-003), dérivées de immo-backend/src/auth/auth.service.ts ──

/** Réponse « action » sans corps utile : l'API renvoie au mieux un message. */
export interface MessageResponse { message?: string }

/** Jeton d'appareil de confiance, renvoyé après un OTP réussi (mémorisé par `deviceTrust`). */
export interface DeviceTokenField { device_token?: string }

/** Connexion réussie (jetons + utilisateur), éventuellement avec un jeton d'appareil. */
export type LoginSuccess = LoginPayload & DeviceTokenField

/** Connexion en attente d'un code SMS (2FA) : à compléter par `POST /auth/otp/verify`. */
export interface OtpRequise {
  requires_otp: true
  session_token: string
  expires_in?: number
}

/** Réponse de `POST /auth/login` et `/auth/login/phone` : connexion directe ou OTP requis. */
export type LoginResponse = LoginSuccess | OtpRequise

/** Rétrécit une réponse de connexion à « code SMS requis » (le reste est une connexion réussie). */
export function estOtpRequise(r: LoginResponse): r is OtpRequise {
  return 'requires_otp' in r && r.requires_otp === true && Boolean(r.session_token)
}

/** Réponse de `POST /auth/register` : session ouverte (le champ `token` n'existe pas côté serveur). */
export type RegisterResponse = LoginSuccess & { token?: string }

/** Réponse de `POST /auth/reset-password/verify`. */
export interface VerifyResetCodeResponse { valide: boolean }

/** Réponse de `POST /auth/password/send-otp`. */
export interface PasswordOtpResponse { requires_otp: boolean; session_token?: string }

/** Réponse de `POST /auth/password/change` : nouveaux jetons pour cet appareil. */
export type ChangePasswordResponse = MessageResponse & Partial<LoginSuccess>

/** Réponse de `POST /auth/phone/send-otp`. */
export interface PhoneOtpResponse { session_token: string }

/** Réponse de `POST /auth/phone/verify`. */
export type VerifyPhoneResponse = MessageResponse & DeviceTokenField

/** Réponse de `POST /auth/refresh` (le serveur ne renvoie que les jetons, pas l'utilisateur). */
export interface RefreshResponse {
  access_token: string
  refresh_token?: string
  user?: SessionUser
}

/** Réponse de `POST /users/me/photo`. */
export interface UploadAvatarResponse { url: string; photo_profil: string }

/** Réponse de `POST /users/me/cip` et `/ifu`. */
export interface UploadDocResponse { url: string }

/** Réponse de `PATCH /users/me` : l'entité mise à jour (`user` est lu par EditProfileModal mais absent du backend). */
export type ProfilUpdateResponse = User & { user?: User }

/** Réponse de `GET /users/me` : profil du compte + compteurs (le serveur n'expose pas cip_url, ifu_url ni numero_retrait). */
export type UserMe = User & {
  /** Lu par certains écrans (`me.user || me`) mais jamais renvoyé par le backend (défaut de lecture). */
  user?: User
  doit_changer_mot_de_passe?: boolean
  created_at?: string
  _count?: { biens: number; visites: number }
}
