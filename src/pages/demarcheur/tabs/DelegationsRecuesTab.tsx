import { useState, useEffect } from 'react'
import { delegationApi } from '../../../api/delegationApi'
import { bienTypeLabel } from '../../../utils/bienType'
import { PURPLE, DELEG_STATUT } from '../shared'
import { IcPerson } from '../icons'
import { unwrapList } from '../../../utils/unwrapList'
import type { DelegationRecue } from '../../../types/demarcheur'
import { withAlpha } from '../../../utils/color'
import { apiMessage } from '../../../utils/apiMessage'
import ErrorState from '../../../components/ErrorState'

export default function DelegationsRecuesTab({ onBack }: { onBack: () => void }) {
  const [delegations, setDelegations] = useState<DelegationRecue[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<number | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [actionError, setActionError] = useState('')

  const load = async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const d = await delegationApi.recues()
      setDelegations(unwrapList<DelegationRecue>(d))
    } catch {
      setLoadError(true)
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const repondre = async (id: number, accepter: boolean) => {
    setActingId(id)
    setActionError('')
    try { await delegationApi.repondre(id, accepter); load() } catch (e: unknown) {
      // Les boutons Accepter / Refuser redeviennent actifs : on peut simplement recliquer.
      setActionError(apiMessage(e) || "Votre réponse n'a pas pu être envoyée. Réessayez.")
    }
    setActingId(null)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="bg-white px-4 py-3 border-b border-divider flex items-center flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-text-grey text-sm font-semibold">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Délégations reçues
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {actionError && <p role="alert" className="text-sm font-semibold mb-3" style={{ color: 'var(--c-danger)' }}>{actionError}</p>}
        {loading ? [1, 2].map(n => <div key={n} className="h-24 skeleton rounded-xl mb-3" />) : loadError && delegations.length === 0 ? (
          <ErrorState title="Impossible de charger vos délégations" onRetry={load} />
        ) : delegations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: withAlpha(PURPLE, '15') }}>
              <IcPerson />
            </div>
            <p className="font-bold text-text-dark mb-1">Aucune délégation</p>
            <p className="text-sm text-text-grey text-center px-6">Les propositions de gestion des propriétaires apparaîtront ici.</p>
          </div>
        ) : delegations.map(d => {
          const meta = DELEG_STATUT[d.statut] || { label: d.statut, color: 'var(--c-grey)' }
          return (
            <div key={d.id} className="card-soft rounded-xl p-4 mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-text-dark text-sm">{d.proprietaire?.prenom} {d.proprietaire?.nom}</p>
                <span className="text-micro font-bold px-2 py-0.5 rounded-full" style={{ color: meta.color, background: withAlpha(meta.color, '18') }}>{meta.label}</span>
              </div>
              <p className="text-xs text-text-grey mb-3">
                {d.bien ? `${bienTypeLabel(d.bien)} — ${d.bien.localisation?.ville || ''}` : 'Tous les biens'}
              </p>
              {d.statut === 'en_attente' && (
                <div className="flex gap-2">
                  <button onClick={() => repondre(d.id, true)} disabled={actingId === d.id}
                    className="flex-1 py-2 rounded-lg text-xs font-bold disabled:opacity-50" style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--tx-green)' }}>
                    Accepter
                  </button>
                  <button onClick={() => repondre(d.id, false)} disabled={actingId === d.id}
                    className="flex-1 py-2 rounded-lg text-xs font-bold disabled:opacity-50" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--tx-red)' }}>
                    Refuser
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
