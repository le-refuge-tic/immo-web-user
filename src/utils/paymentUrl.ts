/**
 * Garde pour les URL de paiement renvoyées par l'API (FE-E-008) :
 * https uniquement, hôte dans une liste fermée (FedaPay prod + sandbox).
 */
const ALLOWED_PAYMENT_DOMAINS = ['fedapay.com']

export function isSafePaymentUrl(raw: unknown): raw is string {
  if (typeof raw !== 'string') return false
  let url: URL
  try { url = new URL(raw) } catch { return false }
  if (url.protocol !== 'https:' || url.username || url.password) return false
  const host = url.hostname.toLowerCase()
  return ALLOWED_PAYMENT_DOMAINS.some(d => host === d || host.endsWith(`.${d}`))
}

/** Ouvre l'URL dans un nouvel onglet seulement si elle est sûre. Retourne false sinon. */
export function openPaymentUrl(raw: unknown): boolean {
  if (!isSafePaymentUrl(raw)) return false
  window.open(raw, '_blank', 'noopener')
  return true
}
