// ─── Tab: Profil ──────────────────────────────────────────────────────────────
// ─── Tab: Gérer mes rôles ───────────────────────────────────────────────────────
// Icônes rendues en CSS mask (data-URI SVG) plutôt qu'en <svg stroke> inline :
// la couleur vient alors de `background` sur le conteneur (currentColor via
// `color`), ce qui permet le dégradé plein-couleur des puces de rôle actif.
export function svgMaskUrl(inner: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>${inner}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}
