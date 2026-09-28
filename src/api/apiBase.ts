import { tokenStore } from '../utils/tokenStore'

export const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

export const auth = () => ({ headers: { Authorization: `Bearer ${tokenStore.getToken()}` } })
