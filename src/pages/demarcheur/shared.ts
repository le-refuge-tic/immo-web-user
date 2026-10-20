// Constantes et helpers partagés de l'espace démarcheur.
export const PURPLE      = '#9B59B6'
export const DARK_PURPLE = '#4A0E8F'
export const MID_PURPLE  = '#7B2FBE'

export type Tab = 'tableau' | 'biens' | 'reservations' | 'notifications' | 'portefeuille' | 'profil' | 'delegations'

export const DELEG_STATUT: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente',  color: 'var(--tx-amber)' },
  active:     { label: 'Active',      color: 'var(--tx-green)' },
  revoquee:   { label: 'Révoquée',    color: 'var(--tx-red)' },
  expiree:    { label: 'Expirée',     color: '#6B7280' },
  refusee:    { label: 'Refusée',     color: 'var(--tx-red)' },
}

export function fmtPrix(p: any) {
  const n = Number(p); return `${n.toLocaleString('fr-FR')} FCFA`
}
/** Libellé « Sem. du 8 sept. » à partir du début de semaine (lundi). */
export function fmtSemaine(raw: string) {
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw.slice(0, 10)
  return `Sem. du ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
}
export function statutBien(s: string) {
  if (s === 'approuve')    return { label: 'Publié ✓',    color: '#4CAF50' }
  if (s === 'rejete')      return { label: 'Rejeté ✗',    color: '#F44336' }
  if (s === 'conditionnel') return { label: 'Conditionnel', color: 'var(--tx-amber)' }
  return { label: 'En attente', color: 'var(--tx-amber)' }
}
export function statutVisite(s: string) {
  if (s === 'confirmee')       return { label: 'Confirmée',       color: '#4CAF50' }
  if (s === 'annulee')         return { label: 'Annulée',         color: '#F44336' }
  if (s === 'effectuee')       return { label: 'Effectuée',       color: PURPLE }
  if (s === 'contre_proposee') return { label: 'Contre-proposée', color: 'var(--tx-amber)' }
  return { label: 'En attente', color: 'var(--tx-amber)' }
}

export const isCommercial = (u: any) =>
  u?.role_principal === 'commercial' ||
  (Array.isArray(u?.roles_actifs) && u.roles_actifs.includes('commercial'))
