import type { VisiteReservation } from '../../../types/proprietaire'

// ─── Tab: Réservations ────────────────────────────────────────────────────────
export function isEchouee(v: VisiteReservation): boolean {
  if (v.statut === 'effectuee' || v.statut === 'annulee') return false
  const raw = v.date_contre_proposee || v.date_souhaitee
  if (!raw) return false
  return new Date(raw).getTime() < Date.now()
}

/** Date de la visite déjà passée (sans le délai de grâce de isEchouee) — désactive Confirmer. */
export function isDatePassee(v: VisiteReservation): boolean {
  const raw = v.date_contre_proposee || v.date_souhaitee
  if (!raw) return false
  return new Date(raw).getTime() < Date.now()
}

/** Minutes avant la visite (peut être négatif si déjà passée) — équivalent de
 *  minutesAvantVisite côté mobile, utilisé pour le compte à rebours WhatsApp
 *  et le bandeau d'urgence. */
export function minutesAvant(v: VisiteReservation, now: number): number | null {
  const raw = v.date_confirmee || v.date_contre_proposee || v.date_souhaitee
  if (!raw) return null
  return Math.round((new Date(raw).getTime() - now) / 60000)
}
/** Visite imminente à traiter d'urgence (< 125 min, comme _buildAlerteUrgente mobile). */
export function isUrgente(v: VisiteReservation, now: number): boolean {
  if (v.statut !== 'en_attente' && v.statut !== 'confirmee') return false
  const m = minutesAvant(v, now)
  return m != null && m >= 0 && m <= 125
}

