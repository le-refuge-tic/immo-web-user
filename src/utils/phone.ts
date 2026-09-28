const BENIN_PREFIX = '+229'

/**
 * Accepted formats for Bénin mobile numbers:
 *  - 10 digits starting with 01  (new ECOWAS format: 0196XXXXXX)
 *  - 8 digits (legacy: 96XXXXXX)
 *  - 11 digits starting with 229 (international without +)
 *  - with country code prefix +229 already stripped
 */
export function validateBeninPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '')
  return (
    (digits.length === 10 && digits.startsWith('01')) ||
    digits.length === 8 ||
    (digits.length === 11 && digits.startsWith('229'))
  )
}

/** Normalise a phone input to E.164 (+229XXXXXXXX). */
export function normaliseBeninPhone(raw: string, countryCode = BENIN_PREFIX): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('229')) return `+${digits}`
  return `${countryCode}${digits}`
}

export const PHONE_FORMAT_HINT = 'Format : 0196XXXXXX (10 ch.) ou 96XXXXXX (8 ch.)'
