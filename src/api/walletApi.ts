import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}` } })

export const walletApi = {
  me: () =>
    axios.get(`${BASE}/wallets/me`, auth()).then(r => r.data),

  transactions: () =>
    axios.get(`${BASE}/wallets/me/transactions`, auth()).then(r => r.data),

  demandeRetrait: (montant: number) =>
    axios.post(`${BASE}/wallets/me/retrait`, { montant }, auth()).then(r => r.data),
}
