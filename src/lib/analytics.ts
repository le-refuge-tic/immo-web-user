/**
 * Mesure d'audience Umami (sans cookie) soumise au consentement.
 * Rien n'est chargé tant que VITE_UMAMI_WEBSITE_ID est vide ou que la personne
 * n'a pas accepté. Aucune donnée personnelle n'est envoyée dans les événements.
 */
const STORAGE_KEY = 'rg_consent'
const DUREE_CONSENTEMENT_MS = 182 * 24 * 60 * 60 * 1000 // ~6 mois
export const CONSENT_EVENT = 'rg-consent-change'
export const OPEN_CONSENT_EVENT = 'rg-consent-open'

type Consent = { analytics: boolean; date: number }

declare global {
  interface Window { umami?: { track: (name: string, data?: Record<string, string | number | boolean>) => void } }
}

export function readConsent(): Consent | null {
  try {
    const c = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Consent | null
    if (!c || typeof c.analytics !== 'boolean' || Date.now() - c.date > DUREE_CONSENTEMENT_MS) return null
    return c
  } catch { return null }
}

export function saveConsent(analytics: boolean) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics, date: Date.now() })) } catch { /* stockage indisponible */ }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT))
  if (analytics) loadAnalytics()
}

/** Rouvre le bandeau (lien « Gérer les cookies »). */
export const openConsentSettings = () => window.dispatchEvent(new CustomEvent(OPEN_CONSENT_EVENT))

export const analyticsConfigured = () => Boolean(import.meta.env.VITE_UMAMI_WEBSITE_ID)

export function loadAnalytics() {
  const id = import.meta.env.VITE_UMAMI_WEBSITE_ID
  if (!id || !readConsent()?.analytics || document.getElementById('umami-script')) return
  const s = document.createElement('script')
  s.id = 'umami-script'
  s.defer = true
  s.src = import.meta.env.VITE_UMAMI_SRC || 'https://cloud.umami.is/script.js'
  s.dataset.websiteId = id
  s.dataset.doNotTrack = 'true' // respecte le réglage « Ne pas suivre » du navigateur
  document.head.appendChild(s)
}

/** Événements du parcours. Ne jamais y mettre de nom, téléphone ou identifiant. */
export type AnalyticsEvent =
  | 'recherche' | 'vue_annonce' | 'favori_ajoute' | 'visite_demandee'
  | 'visite_payee' | 'inscription' | 'annonce_publiee'

export function track(event: AnalyticsEvent, data?: Record<string, string | number | boolean>) {
  try { window.umami?.track(event, data) } catch { /* la mesure ne doit jamais casser l'app */ }
}
