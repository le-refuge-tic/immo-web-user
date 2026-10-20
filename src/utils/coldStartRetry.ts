/**
 * Le backend (Render free tier) se met en veille après inactivité et met
 * jusqu'à ~50s à redémarrer. Pendant ce redémarrage, le proxy Render peut
 * répondre par une erreur réseau ou un 502/503/504 avant que le conteneur
 * ne soit prêt — la même requête rejouée quelques secondes plus tard réussit.
 * Sans ceci, l'utilisateur voit un message trompeur ("Identifiants incorrects")
 * et doit relancer l'action lui-même (d'où le besoin d'« actualiser 2 fois »).
 */
export function isColdStartError(err: unknown): boolean {
  if (!err) return false
  const { response } = err as { response?: { status?: number } }
  if (!response) return true // erreur réseau / timeout, pas de réponse du serveur
  return [502, 503, 504].includes(response.status as number)
}

export async function withColdStartRetry<T>(
  fn: () => Promise<T>,
  onRetry?: (attempt: number) => void,
  maxAttempts = 3,
): Promise<T> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err: unknown) {
      lastErr = err
      if (attempt === maxAttempts || !isColdStartError(err)) throw err
      onRetry?.(attempt)
      await new Promise(r => setTimeout(r, 2500))
    }
  }
  throw lastErr
}
