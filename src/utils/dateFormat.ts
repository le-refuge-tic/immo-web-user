const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

/**
 * Libellé de mois lisible (« Septembre 2026 ») depuis « AAAA-MM », « AAAA-MM-JJ » ou un horodatage ISO.
 * Une valeur déjà lisible (ex. « Septembre 2026 ») est renvoyée telle quelle ; une valeur vide donne « — ».
 */
export function formatMois(raw: unknown): string {
  if (raw == null || raw === '') return '—'
  const str = String(raw)
  const m = /^(\d{4})-(\d{2})/.exec(str)
  if (!m) return str
  const idx = Number(m[2]) - 1
  if (idx < 0 || idx > 11) return str
  const label = MOIS_FR[idx]
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${m[1]}`
}

/** Date lisible en français (« 1 septembre 2026 ») ; « — » si absente ou invalide. */
export function formatDate(raw: unknown): string {
  if (!raw) return '—'
  const d = new Date(String(raw))
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
}
