/**
 * Applique une opacité à une couleur CSS (hex, `var(--jeton)`, rgb…) : remplace la concaténation
 * `${couleur}20`, qui ne fonctionne qu'avec un hex. `alphaHex` est l'opacité sur deux chiffres
 * hexadécimaux (`'20'` = 12,5 %).
 */
export function withAlpha(color: string, alphaHex: string): string {
  const percent = Math.round((parseInt(alphaHex, 16) / 255) * 10000) / 100
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}
