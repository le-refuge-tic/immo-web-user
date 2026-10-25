import type { Visite } from '../../../types/api'
import { dateEffectiveVisite, type VisiteDatable } from '../../../utils/dateVisite'

/** Champs de date lus pour juger l'état d'une visite. */
type VisiteDatee = Pick<Visite, 'statut'> & VisiteDatable

// Même règle que côté mobile : une visite non traitée (confirmée ou en attente
// de réponse) est considérée "échouée" 2h après la date programmée.
export function isEchoueeVisite(v: VisiteDatee): boolean {
  if (v.statut === 'echouee') return true
  if (v.statut === 'effectuee' || v.statut === 'annulee') return false
  const raw = dateEffectiveVisite(v)
  if (!raw) return false
  return Date.now() > new Date(raw).getTime() + 2 * 60 * 60 * 1000
}

export function isDatePasseeVisite(v: VisiteDatable): boolean {
  const raw = dateEffectiveVisite(v)
  if (!raw) return false
  return Date.now() > new Date(raw).getTime()
}

export function fmtDate(raw: string | undefined | null) {
  if (!raw) return '--'
  try {
    const dt = new Date(raw)
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} à ${String(dt.getHours()).padStart(2, '0')}h${String(dt.getMinutes()).padStart(2, '0')}`
  } catch { return raw }
}
