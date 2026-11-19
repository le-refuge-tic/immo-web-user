// Politique de connexions (CSP connect-src) calculée à la construction : l'API, son WebSocket, la
// mesure d'audience et le suivi d'erreurs choisis par l'environnement (production, staging, preview),
// et rien d'autre. Elle s'ajoute au en-tête de vercel.json (qui garde un connect-src large) : le
// navigateur applique l'intersection des deux.
const origine = url => { try { return new URL(url).origin } catch { return null } }

export function connectSrc({ apiUrl, umamiSrc, sentryDsn }) {
  const api = origine(apiUrl)
  const sources = new Set(["'self'"])
  if (api) {
    sources.add(api)
    sources.add(api.replace(/^http/, 'ws')) // socket.io du chat et des notifications
  }
  const umami = origine(umamiSrc || 'https://cloud.umami.is/script.js')
  if (umami) sources.add(umami)
  sources.add('https://api-gateway.umami.dev')
  const sentry = origine(sentryDsn)
  if (sentry) sources.add(sentry)
  return `connect-src ${[...sources].join(' ')}`
}
