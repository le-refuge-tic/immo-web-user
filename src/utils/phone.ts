const BENIN_PREFIX = '+229'

/** Numéro béninois depuis le 30/11/2024 : 10 chiffres, préfixe 01 (ARCEP Bénin). */
export const BENIN_PHONE_LENGTH = 10

/** Exemple unique affiché dans tous les champs téléphone. */
export const PHONE_PLACEHOLDER = '01 97 00 00 00'

export const PHONE_FORMAT_HINT = 'Numéro invalide : saisissez 10 chiffres commençant par 01 (ex. 01 97 00 00 00).'

/** Ramène la saisie à 10 chiffres (retire l'indicatif 229 éventuel). */
export function localBeninDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return digits.length === 13 && digits.startsWith('229') ? digits.slice(3) : digits
}

/** Valide un mobile béninois : exactement 10 chiffres, préfixe 01. */
export function validateBeninPhone(raw: string): boolean {
  const local = localBeninDigits(raw)
  return local.length === BENIN_PHONE_LENGTH && local.startsWith('01')
}

/** Normalise une saisie au format international unique (+22901XXXXXXXX). */
export function normaliseBeninPhone(raw: string, countryCode = BENIN_PREFIX): string {
  return `${countryCode}${localBeninDigits(raw)}`
}

/** Affichage groupé : 0197000000 -> 01 97 00 00 00. */
export function formatBeninPhone(raw: string): string {
  const digits = localBeninDigits(raw).slice(0, BENIN_PHONE_LENGTH)
  return digits.replace(/(\d{2})(?=\d)/g, '$1 ')
}
