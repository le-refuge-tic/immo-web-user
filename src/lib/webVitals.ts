import { track } from './analytics'

/**
 * Mesure réelle des Core Web Vitals (LCP, INP, CLS), envoyée à Umami avec le
 * reste de la mesure d'audience : `track` n'émet rien sans consentement.
 * Le paquet est chargé hors du chemin critique, une fois la page inactive.
 */
export function reportWebVitals(): void {
  const start = () => {
    void import('web-vitals').then(({ onLCP, onINP, onCLS }) => {
      const report = (metric: { name: string; value: number; rating: string }) =>
        track('web_vital', {
          name: metric.name,
          // CLS est un ratio (×1000 pour garder trois décimales utiles) ; LCP et INP sont en ms
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          rating: metric.rating,
        })
      onLCP(report)
      onINP(report)
      onCLS(report)
    })
  }
  if ('requestIdleCallback' in window) window.requestIdleCallback(start)
  else setTimeout(start, 2000)
}
