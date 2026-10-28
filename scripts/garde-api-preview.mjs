// Garde de build : une preview Vercel ne doit jamais être construite contre l'API de production
// (elle écrirait dans la vraie base : comptes, annonces, paiements). Fonction pure, utilisée par
// vite.config.ts et testée.

/** Hôtes des API de production. Variable PROD_API_HOSTS (séparés par des virgules) pour en ajouter. */
export const HOTES_API_PRODUCTION = ['immo-backend-uxr4.onrender.com']

/**
 * Retourne un message d'erreur si le build est une preview Vercel (VERCEL_ENV=preview) dont
 * VITE_API_URL vise une API de production, sinon null. `autorise` lève la garde (cas voulu).
 */
export function apiProdEnPreview({ apiUrl, vercelEnv, hotesSupplementaires = [], autorise = false }) {
  if (vercelEnv !== 'preview' || autorise || !apiUrl) return null
  let hote
  try {
    hote = new URL(apiUrl).host.toLowerCase()
  } catch {
    return null
  }
  const prod = [...HOTES_API_PRODUCTION, ...hotesSupplementaires].map(h => h.trim().toLowerCase()).filter(Boolean)
  if (!prod.includes(hote)) return null
  return (
    `Build de preview refusé : VITE_API_URL vise l'API de production (${hote}). ` +
    `Une preview écrirait dans la vraie base. Dans Vercel > Settings > Environment Variables, ` +
    `donnez à VITE_API_URL l'URL du staging pour l'environnement Preview (toutes les branches). ` +
    `Pour passer outre volontairement : VITE_AUTORISER_API_PROD_EN_PREVIEW=true.`
  )
}
