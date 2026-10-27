// Constantes et helpers partagés de l'espace démarcheur.
import type { ProfilDemarcheur } from '../../types/demarcheur'

export const PURPLE      = '#9B59B6'
export const DARK_PURPLE = '#4A0E8F'
export const MID_PURPLE  = '#7B2FBE'
/** Accent en couleur de texte : même valeur en clair, éclairci en sombre (FE-B-024). Les fonds gardent PURPLE. */
export const PURPLE_TX   = 'var(--tx-violet)'

export type Tab = 'tableau' | 'biens' | 'reservations' | 'notifications' | 'portefeuille' | 'profil' | 'delegations'

export const DELEG_STATUT: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente',  color: 'var(--tx-amber)' },
  active:     { label: 'Active',      color: 'var(--tx-green)' },
  revoquee:   { label: 'Révoquée',    color: 'var(--tx-red)' },
  expiree:    { label: 'Expirée',     color: '#6B7280' },
  refusee:    { label: 'Refusée',     color: 'var(--tx-red)' },
}

export function fmtPrix(p: number | string | null | undefined) {
  const n = Number(p); return `${n.toLocaleString('fr-FR')} FCFA`
}
/** Libellé « Sem. du 8 sept. » à partir du début de semaine (lundi). */
export function fmtSemaine(raw: string) {
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw.slice(0, 10)
  return `Sem. du ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
}
/** Statut de modération : `color` pour un texte, `fill` pour un fond plein sous texte blanc (FE-B-024). */
export function statutBien(s: string) {
  if (s === 'approuve')    return { label: 'Publié ✓',    color: 'var(--tx-green)', fill: 'var(--c-fill-success)' }
  if (s === 'rejete')      return { label: 'Rejeté ✗',    color: 'var(--tx-red)', fill: 'var(--c-fill-error)' }
  if (s === 'conditionnel') return { label: 'Conditionnel', color: 'var(--tx-amber)', fill: 'var(--c-amber-dark)' }
  return { label: 'En attente', color: 'var(--tx-amber)', fill: 'var(--c-amber-dark)' }
}
export function statutVisite(s: string) {
  if (s === 'confirmee')       return { label: 'Confirmée',       color: 'var(--tx-green)' }
  if (s === 'annulee')         return { label: 'Annulée',         color: 'var(--tx-red)' }
  if (s === 'effectuee')       return { label: 'Effectuée',       color: PURPLE }
  if (s === 'contre_proposee') return { label: 'Contre-proposée', color: 'var(--tx-amber)' }
  return { label: 'En attente', color: 'var(--tx-amber)' }
}

export const isCommercial = (u: Pick<ProfilDemarcheur, 'role_principal' | 'roles_actifs'> | null | undefined) =>
  u?.role_principal === 'commercial' ||
  (Array.isArray(u?.roles_actifs) && u.roles_actifs.includes('commercial'))
