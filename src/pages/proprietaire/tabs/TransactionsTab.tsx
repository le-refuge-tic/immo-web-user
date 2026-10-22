import { useState, useEffect } from 'react'
import { walletApi } from '../../../api/walletApi'
import { IcTrendUp, IcTrendDown } from './icons'
import { BLUE, fmtPrix } from './shared'

import { ModalSheet } from '../../../components/ui/ModalSheet'
import { onActivateKey } from '../../../utils/keyboard'
import type { MouvementWallet } from '../../../types/proprietaire'
import { withAlpha } from '../../../utils/color'

// ─── Tab: Historique des transactions ──────────────────────────────────────────
export function categorieTransaction(description: string | null | undefined): { label: string; color: string } {
  const d = (description || '').toLowerCase()
  if (d.startsWith('loyer')) return { label: 'Loyer', color: BLUE }
  if (d.startsWith('frais de visite')) return { label: 'Visite', color: 'var(--c-purple-dark)' }
  if (d.startsWith('intégration') || d.startsWith('integration')) return { label: 'Intégration', color: 'var(--tx-amber)' }
  return { label: 'Autre', color: 'var(--c-grey)' }
}

// Statut réel du paiement à l'origine du mouvement (enrichi côté backend via
// wallets.service.ts::getMyTransactions, jointure par référence sur la table
// `transactions`). `null` = mouvement sans paiement lié (ex. retrait) : par
// construction déjà survenu, donc "Complété".
function txStatutMeta(statut: string | null | undefined): { label: string; color: string } {
  if (statut === 'en_attente') return { label: 'En attente', color: 'var(--tx-amber)' }
  if (statut === 'echoue')     return { label: 'Échoué',     color: 'var(--tx-red)' }
  if (statut === 'rembourse')  return { label: 'Remboursé',  color: 'var(--c-grey)' }
  return { label: 'Complété', color: 'var(--tx-green)' }
}
const METHODE_LABELS: Record<string, string> = { momo: 'MTN MoMo', flooz: 'Moov Flooz', celtiis: 'Celtiis Cash', fedapay: 'FedaPay' }

export function TransactionDetailModal({ t, onClose }: { t: MouvementWallet; onClose: () => void }) {
  const isCredit = t.type !== 'retrait'
  const montant = Number(t.amount ?? t.montant ?? 0)
  const cat = categorieTransaction(t.description)
  const statut = txStatutMeta(t.statut)
  const lien = t.visite_id ? `Visite #${t.visite_id}` : t.loyer_id ? `Loyer #${t.loyer_id}` : t.contrat_id ? `Contrat #${t.contrat_id}` : null
  return (
    <ModalSheet open onClose={onClose} label="Détail de la transaction" placement="center" panelClassName="w-full max-w-md" backdropOpacity={0.4}>
<div className="bg-p-surface rounded-2xl w-full border border-p-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-p-border">
          <h2 className="font-bold text-p-text">Détail de la transaction</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-p-surface text-p-muted flex-shrink-0" aria-label="Fermer">✕</button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: withAlpha(cat.color, '18') }}>
              <span style={{ color: cat.color }}>{isCredit ? <IcTrendUp /> : <IcTrendDown />}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-p-text truncate">{t.description || (isCredit ? 'Crédit' : 'Débit')}</p>
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: withAlpha(cat.color, '15'), color: cat.color }}>{cat.label}</span>
            </div>
            <p className="font-extrabold text-lg flex-shrink-0" style={{ color: isCredit ? 'var(--c-success)' : 'var(--c-danger)' }}>
              {isCredit ? '+' : '-'}{Math.abs(montant).toLocaleString('fr-FR')} F
            </p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-p-muted">Statut</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: withAlpha(statut.color, '18'), color: statut.color }}>{statut.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-p-muted">Date</span>
              <span className="font-semibold text-p-text">{new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-p-muted">Référence</span>
              <span className="font-mono text-xs text-p-text">{t.reference || '—'}</span>
            </div>
            {t.methode_paiement && (
              <div className="flex items-center justify-between">
                <span className="text-p-muted">Moyen de paiement</span>
                <span className="font-semibold text-p-text">{METHODE_LABELS[t.methode_paiement] || t.methode_paiement}</span>
              </div>
            )}
            {t.telephone_paiement && (
              <div className="flex items-center justify-between">
                <span className="text-p-muted">Numéro utilisé</span>
                <span className="font-semibold text-p-text">{t.telephone_paiement}</span>
              </div>
            )}
            {lien && (
              <div className="flex items-center justify-between">
                <span className="text-p-muted">Concerne</span>
                <span className="font-semibold text-p-text">{lien}</span>
              </div>
            )}
          </div>
        </div>
      </div>
</ModalSheet>
  )
}

export function TransactionsTab() {
  const [transactions, setTransactions] = useState<MouvementWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'tous' | 'credit' | 'debit'>('tous')
  const [catFilter, setCatFilter] = useState('Tous')
  const [detailTx, setDetailTx] = useState<MouvementWallet | null>(null)

  useEffect(() => {
    setLoading(true)
    walletApi.transactions()
      .then(t => setTransactions(Array.isArray(t) ? t : t.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const categories = ['Tous', ...Array.from(new Set(transactions.map(t => categorieTransaction(t.description).label)))]

  const filtered = transactions.filter(t => {
    const isCredit = t.type !== 'retrait'
    if (typeFilter === 'credit' && !isCredit) return false
    if (typeFilter === 'debit' && isCredit) return false
    const cat = categorieTransaction(t.description).label
    if (catFilter !== 'Tous' && cat !== catFilter) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      if (!`${t.description || ''} ${t.reference || ''}`.toLowerCase().includes(q)) return false
    }
    return true
  })

  const montantOf = (t: MouvementWallet) => Number(t.amount ?? t.montant ?? 0)
  const totalIn = transactions.filter(t => t.type !== 'retrait').reduce((s, t) => s + montantOf(t), 0)
  const totalOut = transactions.filter(t => t.type === 'retrait').reduce((s, t) => s + Math.abs(montantOf(t)), 0)
  const largest = transactions.reduce((m, t) => Math.max(m, Math.abs(montantOf(t))), 0)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Topbar de section — titre + filtres (l'entête général de l'app reste au-dessus) */}
      <div className="bg-p-surface border-b border-p-border flex items-center gap-3 px-4 md:px-6 py-3 flex-shrink-0 flex-wrap">
        <h1 className="text-[17px] font-bold uppercase tracking-wide" style={{ color: BLUE }}>Historique des transactions</h1>
        <div className="flex-1" />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          aria-label="Filtrer par catégorie"
          className="bg-p-card border border-p-border rounded-lg px-2.5 py-1.5 text-sm outline-none text-p-text">
          {categories.map(c => <option key={c} value={c}>{c === 'Tous' ? 'Toutes les catégories' : c}</option>)}
        </select>
        <div className="flex items-center rounded-lg border border-p-border p-0.5">
          {(['tous', 'credit', 'debit'] as const).map(f => (
            <button key={f} onClick={() => setTypeFilter(f)}
              className="rounded-md px-3 py-1 text-xs font-semibold transition-colors"
              style={typeFilter === f ? { background: BLUE, color: '#060D1A' } : { color: 'var(--p-muted)' }}>
              {f === 'tous' ? 'Tous' : f === 'credit' ? 'Entrées' : 'Sorties'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
      {/* Cartes de synthèse */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="flex items-center gap-3 rounded-xl card-navy p-3.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.094)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--c-green)" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17 7 7 17M17 17H7V7" /></svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-p-muted">Total entrées</p>
            <p className="text-base font-bold text-p-text truncate">{fmtPrix(totalIn)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl card-navy p-3.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.094)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--c-red)" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10v10M7 17 17 7" /></svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-p-muted">Total sorties</p>
            <p className="text-base font-bold text-p-text truncate">{fmtPrix(totalOut)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl card-navy p-3.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: withAlpha(BLUE, '18') }}>
            <span style={{ color: BLUE }}><IcTrendUp /></span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-p-muted">Plus grosse</p>
            <p className="text-base font-bold text-p-text truncate">{fmtPrix(largest)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl card-navy p-3.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#1A3355' }}>
            <span className="text-p-muted font-bold text-sm">#</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-p-muted">Nombre</p>
            <p className="text-base font-bold text-p-text truncate">{transactions.length}</p>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative mb-4">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-p-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une transaction…"
          className="w-full bg-p-card border border-p-border rounded-lg pl-8 pr-3 py-2 text-sm outline-none text-p-text placeholder:text-[#8A9BB5] focus:border-brand" />
      </div>

      {/* Tableau */}
      <div className="rounded-xl overflow-hidden card-soft">
        {loading ? (
          <div className="p-4 space-y-2">{[1, 2, 3, 4].map(n => <div key={n} className="h-14 skeleton-dark rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <p className="font-bold text-p-text mb-1">Aucune transaction</p>
            <p className="text-sm text-p-muted px-6">{search || catFilter !== 'Tous' || typeFilter !== 'tous' ? 'Rien ne correspond à ces filtres.' : 'Vos revenus (loyers, frais de visite, intégrations) apparaîtront ici.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--p-surface)', borderBottom: `1px solid var(--p-border)` }}>
                  <th className="text-left font-semibold text-p-muted text-[11px] uppercase tracking-wide px-4 py-2.5">Transaction</th>
                  <th className="text-left font-semibold text-p-muted text-[11px] uppercase tracking-wide px-4 py-2.5 hidden sm:table-cell">Référence</th>
                  <th className="text-right font-semibold text-p-muted text-[11px] uppercase tracking-wide px-4 py-2.5">Montant</th>
                  <th className="text-left font-semibold text-p-muted text-[11px] uppercase tracking-wide px-4 py-2.5 hidden md:table-cell">Date</th>
                  <th className="text-left font-semibold text-p-muted text-[11px] uppercase tracking-wide px-4 py-2.5 hidden lg:table-cell">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const isCredit = t.type !== 'retrait'
                  const cat = categorieTransaction(t.description)
                  const statut = txStatutMeta(t.statut)
                  return (
                    <tr key={t.id || i} tabIndex={0} onKeyDown={onActivateKey(() => setDetailTx(t))} onClick={() => setDetailTx(t)} className="cursor-pointer hover:bg-[#0B1C30] transition-colors"
                      style={{ borderBottom: i < filtered.length - 1 ? `1px solid var(--p-border)` : undefined }}>
                      {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- faux positif : la cellule contient le libellé de la transaction (texte dynamique) */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: withAlpha(cat.color, '18') }}>
                            <span style={{ color: cat.color }}>{isCredit ? <IcTrendUp /> : <IcTrendDown />}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-p-text text-sm truncate">{t.description || (isCredit ? 'Crédit' : 'Débit')}</p>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: withAlpha(cat.color, '15'), color: cat.color }}>{cat.label}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="font-mono text-xs text-p-muted">{t.reference || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-sm" style={{ color: isCredit ? 'var(--c-success)' : 'var(--c-danger)' }}>
                          {isCredit ? '+' : '-'}{Math.abs(montantOf(t)).toLocaleString('fr-FR')} F
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-p-muted">{new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: withAlpha(statut.color, '18'), color: statut.color }}>{statut.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
      {detailTx && <TransactionDetailModal t={detailTx} onClose={() => setDetailTx(null)} />}
    </div>
  )
}

