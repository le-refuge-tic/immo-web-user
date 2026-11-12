// ─── Tab: Loyers ──────────────────────────────────────────────────────────────
// Statut d'un loyer — couvre les 4 valeurs réelles du backend (`en_attente`,
// `en_retard`, `paye`, `impaye`). `impaye` correspond à un loyer escaladé à
// l'administration (`escalade_admin`) : distingué du simple retard.
export function loyerStatut(s: string): { label: string; color: string } {
  if (s === 'paye')      return { label: 'Payé',       color: 'var(--tx-green)' }
  if (s === 'en_retard') return { label: 'En retard',  color: 'var(--tx-red)' }
  if (s === 'impaye')    return { label: 'Impayé',     color: '#C62828' }
  return { label: 'En attente', color: 'var(--tx-amber)' }
}
/** `color` : texte ; `fill` : pastille pleine sous texte blanc (FE-C-004, FE-B-024). */
export const CONTRAT_STATUT: Record<string, { label: string; color: string; fill: string }> = {
  actif:   { label: 'Actif',   color: 'var(--tx-green)', fill: 'var(--c-fill-success)' },
  resilie: { label: 'Résilié', color: 'var(--p-muted)', fill: 'var(--p-muted)' },
  expire:  { label: 'Expiré',  color: 'var(--tx-red)', fill: 'var(--c-fill-error)' },
}
export function moisLabel(d: string | number | Date | null | undefined) {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  const s = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
export function dateLabel(d: string | number | Date | null | undefined) {
  if (!d) return '—'
  const date = new Date(d)
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
