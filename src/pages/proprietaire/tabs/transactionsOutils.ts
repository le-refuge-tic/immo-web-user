import { BLUE_TX } from './outils'

// ─── Tab: Historique des transactions ──────────────────────────────────────────
export function categorieTransaction(description: string | null | undefined): { label: string; color: string } {
  const d = (description || '').toLowerCase()
  if (d.startsWith('loyer')) return { label: 'Loyer', color: BLUE_TX }
  if (d.startsWith('frais de visite')) return { label: 'Visite', color: 'var(--c-purple-dark)' }
  if (d.startsWith('intégration') || d.startsWith('integration')) return { label: 'Intégration', color: 'var(--tx-amber)' }
  return { label: 'Autre', color: 'var(--c-grey)' }
}
