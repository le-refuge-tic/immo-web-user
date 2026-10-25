/**
 * FE-B-004 — Règles du nom et du prénom, alignées sur le serveur
 * (immo-backend/src/auth/dto/register.dto.ts : @Length(2, 100)).
 */
export const NAME_MIN_LENGTH = 2
export const NAME_MAX_LENGTH = 100

/** Message d'erreur du champ, ou `null` s'il est valide. Les espaces autour sont ignorés. */
export function nameError(label: string, value: string): string | null {
  const length = value.trim().length
  if (length === 0) return `Renseignez votre ${label.toLowerCase()}.`
  if (length < NAME_MIN_LENGTH) return `Votre ${label.toLowerCase()} doit comporter au moins ${NAME_MIN_LENGTH} caractères.`
  if (length > NAME_MAX_LENGTH) return `Votre ${label.toLowerCase()} ne peut pas dépasser ${NAME_MAX_LENGTH} caractères.`
  return null
}
