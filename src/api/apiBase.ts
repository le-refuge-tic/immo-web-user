import { tokenStore } from '../utils/tokenStore'

const DEV_API_URL = 'http://localhost:3000/api/v1'

function resolveApiUrl(): string {
  const configured = import.meta.env.VITE_API_URL
  if (configured) return configured
  // En production, ne jamais retomber sur localhost : échec explicite (FE-F-006).
  if (import.meta.env.PROD) {
    throw new Error('VITE_API_URL manquante : configurez l\'URL de l\'API avant de construire/déployer.')
  }
  return DEV_API_URL
}

export const BASE: string = resolveApiUrl()

/** Origine du backend (sans /api/v1) : fichiers uploadés, WebSocket. */
export const API_ORIGIN: string = BASE.replace('/api/v1', '')

export const auth = () => ({ headers: { Authorization: `Bearer ${tokenStore.getToken()}` } })
