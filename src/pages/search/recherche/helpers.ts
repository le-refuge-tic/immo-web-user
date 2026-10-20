import { BUDGET_TOLERANCE } from './options'

export function norm(s: string) {
  return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export function matchLoc(bien: any, query: string) {
  if (!query) return true
  const q = norm(query)
  const fields = [
    bien.localisation?.ville,
    bien.localisation?.quartier,
    bien.localisation?.commune,
    bien.localisation?.adresse,
  ].filter(Boolean).map((f: string) => norm(f))
  return fields.some(f => f.includes(q))
}

export function inBudgetRange(bien: any, prixMin: string, prixMax: string) {
  const p = Number(bien.prix)
  if (prixMin && p < Number(prixMin)) return false
  if (prixMax && p > Number(prixMax)) return false
  return true
}

export function isBudgetVoisin(bien: any, prixMin: string, prixMax: string) {
  const p = Number(bien.prix)
  if (prixMin && p < Number(prixMin) && p >= Number(prixMin) - BUDGET_TOLERANCE) return true
  if (prixMax && p > Number(prixMax) && p <= Number(prixMax) + BUDGET_TOLERANCE) return true
  return false
}

export function fmtFcfa(v: string) {
  const n = Number(v.replace(/\D/g, ''))
  if (!n) return ''
  return n.toLocaleString('fr-FR')
}
