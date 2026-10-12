import axios from 'axios'
import { tokenStore } from '../utils/tokenStore'
import { deviceTrust } from '../utils/deviceTrust'
import { BASE, auth } from './apiBase'
import { compressImage } from '../utils/compressImage'

export const userApi = {
  me: () =>
    axios.get(`${BASE}/users/me`, auth()).then(r => r.data),

  updateProfil: (body: any) =>
    axios.patch(`${BASE}/users/me`, body, auth()).then(r => r.data),

  /**
   * Changement de mot de passe, étape 1 : vérifie le mot de passe actuel et
   * envoie un code SMS au numéro du compte (`requires_otp: false` pour le
   * changement imposé d'un mot de passe provisoire).
   */
  sendPasswordOtp: (current_password: string) =>
    axios.post(`${BASE}/auth/password/send-otp`, { current_password }, auth())
      .then(r => r.data as { requires_otp: boolean; session_token?: string }),

  /**
   * Étape 2. Le serveur ferme toutes les autres sessions et renvoie de
   * nouveaux jetons pour cet appareil : on les enregistre aussitôt, sinon la
   * session courante tomberait au prochain rafraîchissement.
   */
  changePassword: (body: { current_password: string; new_password: string; session_token?: string; code?: string }) =>
    axios.post(`${BASE}/auth/password/change`, body, auth()).then(r => {
      if (r.data?.access_token) tokenStore.setToken(r.data.access_token)
      if (r.data?.refresh_token) tokenStore.setRefresh(r.data.refresh_token)
      deviceTrust.remember(r.data)
      return r.data
    }),

  /**
   * Changement de numéro, étape 1 : envoie un code SMS AU NOUVEAU numéro.
   * `mot_de_passe_actuel` est exigé par l'API dès que le compte a déjà un
   * numéro — le téléphone sert au 2FA et à la réinitialisation du mot de passe.
   */
  sendPhoneOtp: (telephone: string, mot_de_passe_actuel?: string) =>
    axios.post(`${BASE}/auth/phone/send-otp`, { telephone, mot_de_passe_actuel }, auth())
      .then(r => r.data as { session_token: string }),

  /** Étape 2 : valide le code et enregistre le numéro. */
  verifyPhoneOtp: (session_token: string, code: string, telephone: string) =>
    axios.post(`${BASE}/auth/phone/verify`, { session_token, code, telephone }, auth())
      .then(r => {
        // Cet appareil vient de prouver qu'il détient le numéro : il devient
        // de confiance (les autres appareils repasseront par un OTP).
        deviceTrust.remember(r.data)
        return r.data
      }),

  uploadAvatar: async (file: File) => {
    const form = new FormData()
    form.append('photo', await compressImage(file, 800))
    return axios.post(`${BASE}/users/me/photo`, form, {
      headers: {
        Authorization: `Bearer ${tokenStore.getToken()}`,
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data)
  },

  uploadCip: (file: File) => {
    const form = new FormData()
    form.append('cip', file)
    return axios.post(`${BASE}/users/me/cip`, form, {
      headers: {
        Authorization: `Bearer ${tokenStore.getToken()}`,
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data)
  },

  uploadIfu: (file: File) => {
    const form = new FormData()
    form.append('ifu', file)
    return axios.post(`${BASE}/users/me/ifu`, form, {
      headers: {
        Authorization: `Bearer ${tokenStore.getToken()}`,
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data)
  },

  loyersStats: () =>
    axios.get(`${BASE}/users/me/loyers`, auth()).then(r => r.data),

  retrait: (body: any) =>
    axios.post(`${BASE}/users/me/retrait`, body, auth()).then(r => r.data),

  historiqueTransactions: () =>
    axios.get(`${BASE}/users/me/transactions`, auth()).then(r => r.data),
}
