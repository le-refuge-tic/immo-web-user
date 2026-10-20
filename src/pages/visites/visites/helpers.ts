// Même règle que côté mobile : une visite non traitée (confirmée ou en attente
// de réponse) est considérée "échouée" 2h après la date programmée.
export function isEchoueeVisite(v: any): boolean {
  if (v.statut === 'echouee') return true
  if (v.statut === 'effectuee' || v.statut === 'annulee') return false
  const raw = v.date_contre_proposee || v.date_souhaitee
  if (!raw) return false
  return Date.now() > new Date(raw).getTime() + 2 * 60 * 60 * 1000
}

export function isDatePasseeVisite(v: any): boolean {
  const raw = v.date_contre_proposee || v.date_souhaitee
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
