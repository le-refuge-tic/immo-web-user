import axios from 'axios'
import { tokenStore } from '../utils/tokenStore'
import { deviceTrust } from '../utils/deviceTrust'
import { BASE, auth } from './apiBase'
import type { RegisterBody } from '../types/auth'

export const authApi = {
  // device_token : appareil déjà validé par OTP (30 jours) → le serveur peut
  // délivrer directement les jetons sans redemander de code.
  loginPhone: (telephone: string, password: string) =>
    axios.post(`${BASE}/auth/login/phone`, { telephone, password, device_token: deviceTrust.get() }).then(r => r.data),

  loginEmail: (email: string, password: string) =>
    axios.post(`${BASE}/auth/login`, { email, password, device_token: deviceTrust.get() }).then(r => r.data),

  register: (body: RegisterBody) =>
    axios.post(`${BASE}/auth/register`, body).then(r => r.data),

  logout: (refresh_token: string) =>
    axios.post(`${BASE}/auth/logout`, { refresh_token }, auth()).then(r => r.data),

  // 2FA : OTP demandé sur un nouvel appareil, puis au plus tous les 30 jours
  // (loginPhone/loginEmail renvoient alors { requires_otp, session_token }).
  // La réponse peut contenir un device_token, mémorisé pour les connexions suivantes.
  verifyOtp: (session_token: string, code: string) =>
    axios.post(`${BASE}/auth/otp/verify`, { session_token, code }).then(r => {
      deviceTrust.remember(r.data)
      return r.data
    }),

  // Mot de passe oublié — étape 1 : envoi d'un code par SMS.
  forgotPassword: (telephone: string) =>
    axios.post(`${BASE}/auth/forgot-password`, { telephone }).then(r => r.data),

  // Mot de passe oublié — étape 2 : vérifier le code (sans le consommer).
  verifyResetCode: (telephone: string, code: string) =>
    axios.post(`${BASE}/auth/reset-password/verify`, { telephone, code }).then(r => r.data),

  // Mot de passe oublié — étape 3 : vérifier le code et définir le nouveau mot de passe.
  resetPassword: (telephone: string, code: string, nouveau_mot_de_passe: string) =>
    axios.post(`${BASE}/auth/reset-password`, { telephone, code, nouveau_mot_de_passe }).then(r => r.data),

  // Lien « Annuler ce changement » envoyé à l'ancien numéro (valable 7 jours).
  // Appelé seulement sur clic explicite : un aperçu de lien (GET) ne doit rien annuler.
  cancelChange: (token: string) =>
    axios.post(`${BASE}/auth/changes/cancel`, { token }).then(r => r.data),
}

/**
 * Révocation serveur de la session (FE-E-003). Best effort : ne lève jamais,
 * délai court, et lit les jetons de façon synchrone pour pouvoir être appelée
 * juste avant leur effacement local.
 */
export function revokeSession(): void {
  const refresh = tokenStore.getRefresh()
  if (!refresh) return
  axios
    .post(`${BASE}/auth/logout`, { refresh_token: refresh }, { ...auth(), timeout: 5000 })
    .catch(() => {})
}
