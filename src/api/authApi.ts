import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}` },
})

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
}
