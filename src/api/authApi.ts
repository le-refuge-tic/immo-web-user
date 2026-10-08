import axios from 'axios'
import { tokenStore } from '../utils/tokenStore'
import { BASE, auth } from './apiBase'

export const authApi = {
  loginPhone: (telephone: string, password: string) =>
    axios.post(`${BASE}/auth/login/phone`, { telephone, password }).then(r => r.data),

  loginEmail: (email: string, password: string) =>
    axios.post(`${BASE}/auth/login`, { email, password }).then(r => r.data),

  register: (body: any) =>
    axios.post(`${BASE}/auth/register`, body).then(r => r.data),

  logout: (refresh_token: string) =>
    axios.post(`${BASE}/auth/logout`, { refresh_token }, auth()).then(r => r.data),

  refresh: (refresh_token: string, user_id: number) =>
    axios.post(`${BASE}/auth/refresh`, { refresh_token, user_id }).then(r => r.data),

  // 2FA obligatoire à chaque connexion (loginPhone/loginEmail renvoient
  // désormais { requires_otp, session_token } au lieu des tokens directs).
  verifyOtp: (session_token: string, code: string) =>
    axios.post(`${BASE}/auth/otp/verify`, { session_token, code }).then(r => r.data),

  // Mot de passe oublié — étape 1 : envoi d'un code par SMS.
  forgotPassword: (telephone: string) =>
    axios.post(`${BASE}/auth/forgot-password`, { telephone }).then(r => r.data),

  // Mot de passe oublié — étape 2 : vérifier le code (sans le consommer).
  verifyResetCode: (telephone: string, code: string) =>
    axios.post(`${BASE}/auth/reset-password/verify`, { telephone, code }).then(r => r.data),

  // Mot de passe oublié — étape 3 : vérifier le code et définir le nouveau mot de passe.
  resetPassword: (telephone: string, code: string, nouveau_mot_de_passe: string) =>
    axios.post(`${BASE}/auth/reset-password`, { telephone, code, nouveau_mot_de_passe }).then(r => r.data),
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
