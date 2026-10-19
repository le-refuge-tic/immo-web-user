import { useEffect, useState } from 'react'
import { CONSENT_EVENT, OPEN_CONSENT_EVENT, readConsent, saveConsent, loadAnalytics } from '../lib/analytics'

/**
 * Bandeau de consentement. Les boutons Refuser et Accepter ont le même poids
 * visuel ; le choix est gardé 6 mois et modifiable via « Gérer les cookies ».
 */
export default function CookieBanner() {
  const [open, setOpen] = useState(() => readConsent() === null)

  useEffect(() => {
    loadAnalytics()
    const reopen = () => setOpen(true)
    const close = () => setOpen(false)
    window.addEventListener(OPEN_CONSENT_EVENT, reopen)
    window.addEventListener(CONSENT_EVENT, close)
    return () => {
      window.removeEventListener(OPEN_CONSENT_EVENT, reopen)
      window.removeEventListener(CONSENT_EVENT, close)
    }
  }, [])

  if (!open) return null
  const choix = readConsent()

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
      className="fixed z-[90] left-3 right-3 bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] md:bottom-6 md:left-auto md:right-6 md:max-w-sm glass-strong rounded-2xl p-4 shadow-xl"
    >
      <p id="cookie-title" className="text-sm font-bold text-text-dark">Cookies et mesure d’audience</p>
      <p id="cookie-desc" className="text-xs text-text-grey mt-1.5 leading-relaxed">
        Nous utilisons uniquement les cookies nécessaires au fonctionnement du site. Avec votre accord, nous mesurons aussi
        la fréquentation de façon anonyme, sans cookie publicitaire.
        {choix && <> Choix actuel : <strong>{choix.analytics ? 'mesure acceptée' : 'mesure refusée'}</strong>.</>}
      </p>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button type="button" onClick={() => saveConsent(false)}
          className="py-2.5 rounded-xl text-sm font-semibold border border-divider dark:border-white/15 text-text-dark bg-white/60 dark:bg-white/5">
          Refuser
        </button>
        <button type="button" onClick={() => saveConsent(true)}
          className="py-2.5 rounded-xl text-sm font-semibold border border-divider dark:border-white/15 text-text-dark bg-white/60 dark:bg-white/5">
          Accepter
        </button>
      </div>
    </div>
  )
}
