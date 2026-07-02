import axios from 'axios'

const BASE = 'https://immo-backend-pw5z.onrender.com/api/v1'

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
}
