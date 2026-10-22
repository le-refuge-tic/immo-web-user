import type { Visite } from '../types/api'

/** Champs de date d'une visite lus pour déterminer la date retenue. */
export type VisiteDatable = Pick<Visite, 'date_contre_proposee' | 'date_souhaitee'> & {
  creneau?: { date_debut?: string | null } | null
}

/**
 * Date retenue d'une visite, même règle que le backend
 * (visites.service.ts : `date_contre_proposee ?? date_souhaitee ?? creneau.date_debut`) :
 * - contre-proposition du gestionnaire (conservée une fois acceptée, la visite passe en `confirmee`) ;
 * - sinon date souhaitée par le client ;
 * - sinon début du créneau (ancien flux). Le champ `creneau.debut` n'existe pas.
 * Renvoie `null` quand aucune date n'est disponible.
 */
export function dateEffectiveVisite(v: VisiteDatable): string | null {
  return v.date_contre_proposee || v.date_souhaitee || v.creneau?.date_debut || null
}

/**
 * Date de visite affichée sur un reçu : règle du backend (contre-proposition, sinon date souhaitée),
 * avec repli sur `date_confirmee` (champ calculé par le reçu, identique) pour les anciens reçus.
 */
export function dateVisiteRecu(v: {
  date_contre_proposee?: string | null
  date_souhaitee?: string | null
  date_confirmee?: string | null
} | null | undefined): string | null {
  if (!v) return null
  return dateEffectiveVisite(v) || v.date_confirmee || null
}

/** Minutes avant la visite (négatif si passée) ; `null` sans date exploitable. */
export function minutesAvantVisite(v: VisiteDatable, now: number): number | null {
  const raw = dateEffectiveVisite(v)
  if (!raw) return null
  const t = new Date(raw).getTime()
  if (Number.isNaN(t)) return null
  return Math.round((t - now) / 60000)
}
