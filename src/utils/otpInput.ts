/**
 * Saisie d'un code à usage unique réparti sur une case par chiffre : frappe,
 * collage ou remplissage automatique (SMS) à partir de la case `index`.
 */
export interface OtpInputResult {
  digits: string[]
  /** Case à focaliser ensuite. */
  focusIndex: number
  /** Code complet si toutes les cases sont remplies, sinon `null`. */
  code: string | null
}

export function applyOtpInput(digits: readonly string[], index: number, raw: string, length: number): OtpInputResult {
  let chars = raw.replace(/\D/g, '')
  // Deux chiffres dans une case déjà remplie : le nouveau remplace l'ancien.
  if (chars.length === 2 && digits[index]) chars = chars.slice(-1)
  const next = [...digits]
  if (!chars) {
    next[index] = ''
    return { digits: next, focusIndex: index, code: null }
  }
  const chunk = chars.length > 1 ? chars.slice(0, length - index) : chars
  chunk.split('').forEach((c, k) => { next[index + k] = c })
  const code = next.join('')
  return {
    digits: next,
    focusIndex: Math.min(index + chunk.length, length - 1),
    code: code.length === length ? code : null,
  }
}
