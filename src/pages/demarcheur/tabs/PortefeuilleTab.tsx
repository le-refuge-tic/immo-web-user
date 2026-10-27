import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { walletApi } from '../../../api/walletApi'
import { PURPLE, PURPLE_TX } from '../shared'
import { unwrapList } from '../../../utils/unwrapList'
import type { WalletTransaction } from '../../../types/wallet'
import { withAlpha } from '../../../utils/color'
import ErrorState from '../../../components/ErrorState'

// L'écran lit toujours `created_at` pour la date de la ligne.
type TransactionAffichee = WalletTransaction & { created_at: string }

export default function PortefeuilleTab() {
  const navigate = useNavigate()
  const [transactions, setTrans] = useState<TransactionAffichee[]>([])
  const [loading, setLoading]   = useState(true)
  const [loadError, setLoadError] = useState(false)

  const charger = () => {
    setLoading(true)
    setLoadError(false)
    walletApi.transactions()
      .then(t => setTrans(unwrapList<TransactionAffichee>(t)))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }
  useEffect(() => { charger() }, [])

  const recent = transactions.slice(0, 4)

  return (
    <div className="flex-1 overflow-y-auto pb-10">
      <div className="px-4 py-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-text-dark text-[17px]">Historique des transactions</p>
          <button onClick={() => navigate('/portefeuille')} className="text-sm font-semibold" style={{ color: PURPLE_TX }}>
            Voir tout
          </button>
        </div>

        {loading ? (
          [1,2,3,4].map(n => <div key={n} className="h-16 skeleton rounded-2xl mb-3" />)
        ) : loadError && transactions.length === 0 ? (
          <ErrorState title="Impossible de charger vos transactions" onRetry={charger} />
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: withAlpha(PURPLE, '15') }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p className="font-bold text-text-dark mb-1">Aucune transaction</p>
            <p className="text-text-grey text-sm">Vos commissions apparaîtront ici.</p>
          </div>
        ) : (
          <>
            {recent.map((t, i) => {
              const isCredit = t.type !== 'retrait'
              const amt = Number(t.amount ?? t.montant ?? 0)
              return (
                <div key={i} className="flex items-center gap-3 p-4 card-soft rounded-2xl mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isCredit ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={isCredit ? 'var(--c-success)' : '#DC2626'} strokeWidth={2.5} className="w-5 h-5">
                      {isCredit
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8l-8-8-8 8"/>
                        : <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V4m8 8l-8 8-8-8"/>}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-dark text-sm truncate">{t.description || (isCredit ? 'Crédit' : 'Débit')}</p>
                    <p className="text-xs text-text-grey mt-0.5">{new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm" style={{ color: isCredit ? 'var(--c-success)' : 'var(--c-danger)' }}>
                      {isCredit ? '+' : '-'}{Math.abs(amt).toLocaleString('fr-FR')} F
                    </p>
                    {t.balance_after != null && <p className="text-micro text-text-grey">{Number(t.balance_after).toLocaleString('fr-FR')} F</p>}
                  </div>
                </div>
              )
            })}
            <button onClick={() => navigate('/portefeuille')}
              className="w-full py-3 rounded-xl text-sm font-bold mt-1"
              style={{ background: withAlpha(PURPLE, '12'), color: PURPLE_TX }}>
              Voir tout l'historique
            </button>
          </>
        )}
      </div>
    </div>
  )
}
