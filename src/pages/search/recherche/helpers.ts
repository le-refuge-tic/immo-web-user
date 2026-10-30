import type { Bien } from '../../../types/api'
import type { BienLocalisable } from '../../../types/recherche'
import { prixParHeure } from '../../../utils/salleFete'
import { BUDGET_TOLERANCE, BUDGET_TOLERANCE_HEURE } from './options'

export function norm(s: string) {
  return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export function matchLoc(bien: BienLocalisable, query: string) {
  if (!query) return true
  const q = norm(query)
  const fields = [
    bien.localisation?.ville,
    bien.localisation?.quartier,
    bien.localisation?.commune,
    bien.localisation?.adresse,
  ].filter((f): f is string => !!f).map(f => norm(f))
  return fields.some(f => f.includes(q))
}

type BienPrixComparable = Pick<Bien, 'prix' | 'type' | 'details_salle_fete'>

/**
 * Prix comparé au budget et utilisé pour le tri. Pour une recherche de salles de fêtes,
 * c'est le prix ramené à l'heure (45 000 FCFA pour 8 h = 5 625 / h) : le prix affiché
 * dépend des heures couvertes et ne se compare pas d'une salle à l'autre.
 * Dans tous les autres cas, c'est le prix affiché.
 */
export function prixPourBudget(bien: BienPrixComparable, type = ''): number {
  if (type === 'salle_fete' && bien.type === 'salle_fete' && bien.details_salle_fete) {
    return prixParHeure(bien.details_salle_fete)
  }
  return Number(bien.prix)
}

/** Écart toléré pour proposer un bien « budget voisin » : plus fin pour un prix à l'heure. */
export const toleranceBudget = (type = '') => (type === 'salle_fete' ? BUDGET_TOLERANCE_HEURE : BUDGET_TOLERANCE)

export function inBudgetRange(bien: BienPrixComparable, prixMin: string, prixMax: string, type = '') {
  const p = prixPourBudget(bien, type)
  if (prixMin && p < Number(prixMin)) return false
  if (prixMax && p > Number(prixMax)) return false
  return true
}

export function isBudgetVoisin(bien: BienPrixComparable, prixMin: string, prixMax: string, type = '') {
  const p = prixPourBudget(bien, type)
  const tolerance = toleranceBudget(type)
  if (prixMin && p < Number(prixMin) && p >= Number(prixMin) - tolerance) return true
  if (prixMax && p > Number(prixMax) && p <= Number(prixMax) + tolerance) return true
  return false
}

/** Tri par prix croissant ou décroissant (nouvelle liste ; la liste d'origine n'est pas modifiée). */
export function trierParPrix<T extends BienPrixComparable>(biens: T[], sens: 'prix_asc' | 'prix_desc', type = ''): T[] {
  const signe = sens === 'prix_asc' ? 1 : -1
  return [...biens].sort((a, b) => signe * (prixPourBudget(a, type) - prixPourBudget(b, type)))
}

export function fmtFcfa(v: string) {
  const n = Number(v.replace(/\D/g, ''))
  if (!n) return ''
  return n.toLocaleString('fr-FR')
}
