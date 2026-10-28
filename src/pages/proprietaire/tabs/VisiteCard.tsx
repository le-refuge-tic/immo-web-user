import type { VisiteReservation } from '../../../types/proprietaire'
import { dateEffectiveVisite, minutesAvantVisite } from '../../../utils/dateVisite'

// ─── Tab: Réservations ────────────────────────────────────────────────────────
export function isEchouee(v: VisiteReservation): boolean {
  if (v.statut === 'effectuee' || v.statut === 'annulee') return false
  const raw = dateEffectiveVisite(v)
  if (!raw) return false
  return new Date(raw).getTime() < Date.now()
}

/** Date de la visite déjà passée (sans le délai de grâce de isEchouee) — désactive Confirmer. */
export function isDatePassee(v: VisiteReservation): boolean {
  const raw = dateEffectiveVisite(v)
  if (!raw) return false
  return new Date(raw).getTime() < Date.now()
}

/** Minutes avant la visite (peut être négatif si déjà passée) — équivalent de
 *  minutesAvantVisite côté mobile, utilisé pour le compte à rebours WhatsApp
 *  et le bandeau d'urgence. */
export function minutesAvant(v: VisiteReservation, now: number): number | null {
  // Date retenue = contre-proposition, sinon date souhaitée, sinon début du créneau
  // (`date_confirmee` n'est pas un champ de l'entité Visite du backend).
  return minutesAvantVisite(v, now)
}
/** Visite imminente à traiter d'urgence (< 125 min, comme _buildAlerteUrgente mobile). */
export function isUrgente(v: VisiteReservation, now: number): boolean {
  if (v.statut !== 'en_attente' && v.statut !== 'confirmee') return false
  const m = minutesAvant(v, now)
  return m != null && m >= 0 && m <= 125
}

