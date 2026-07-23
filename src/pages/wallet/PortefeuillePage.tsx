import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { walletApi } from '../../api/walletApi'

const isLoyer = (t: any) => `${t.type ?? ''}${t.libelle ?? ''}${t.description ?? ''}`.toLowerCase().includes('loyer')
const isVisite = (t: any) => `${t.type ?? ''}${t.libelle ?? ''}${t.description ?? ''}`.toLowerCase().includes('visite')
const typeLabel = (t: any) => isLoyer(t) ? 'Loyer mensuel' : isVisite(t) ? 'Frais de visite' : String(t.libelle ?? t.description ?? t.type ?? 'Transaction')
const montantOf = (t: any) => Number(t.montant ?? t.amount ?? 0)
const statutLabel = (t: any) => {
  const s = String(t.statut ?? t.status ?? '').toLowerCase()
  if (s.includes('rembours')) return 'Remboursé'
  if (s.includes('fail') || s.includes('echec')) return 'Échoué'
  if (s.includes('pending') || s.includes('attente')) return 'En attente'
  return 'Payé'
}
const statutColor = (s: string) => s === 'Échoué' ? '#FF3B30' : (s === 'Remboursé' || s === 'En attente') ? '#FF9800' : '#34C759'
const typeColor = (t: any) => isLoyer(t) ? '#4B6BFF' : isVisite(t) ? '#FF6B35' : '#6E6E73'
const fieldLabel = (k: string) => k.split('_').map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(' ')
const formatDate = (t: any) => {
  const raw = String(t.created_at ?? t.date ?? '')
  if (!raw) return '—'
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw.slice(0, 10)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function TypeIcon({ t, color, className }: { t: any; color: string; className: string }) {
  if (isLoyer(t)) return <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10" /></svg>
  if (isVisite(t)) return <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  return <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v14l-3-2-2 2-2-2-2 2-2-2-3 2V6a2 2 0 012-2z" /></svg>
}

export default function PortefeuillePage() {
  const navigate = useNavigate()
  const [wallet, setWallet]         = useState<any>(null)
  const [transactions, setTrans]    = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [showRetrait, setShowRetrait] = useState(false)
  const [montant, setMontant]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [retraitOk, setRetraitOk]  = useState(false)
  const [filter, setFilter]         = useState<'Tous' | 'Loyers' | 'Visites'>('Tous')
  const [detailTx, setDetailTx]     = useState<any>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [w, t] = await Promise.all([walletApi.me(), walletApi.transactions()])
      setWallet(w)
      setTrans(Array.isArray(t) ? t : t.data || [])
    } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const demanderRetrait = async () => {
    if (!montant || Number(montant) <= 0) return
    setSubmitting(true)
    try {
      await walletApi.demandeRetrait(Number(montant))
      setRetraitOk(true); setShowRetrait(false); setMontant(''); load()
    } catch (_) {}
    setSubmitting(false)
  }

  const solde = Number(wallet?.solde || 0)
  const loyerCount = transactions.filter(isLoyer).length
  const visiteCount = transactions.filter(isVisite).length
  const filteredTx = filter === 'Loyers' ? transactions.filter(isLoyer) : filter === 'Visites' ? transactions.filter(isVisite) : transactions
  const totalFiltre = filteredTx.reduce((s, t) => s + montantOf(t), 0)

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-14 md:pt-6 pb-6"
        style={{ background: 'linear-gradient(135deg,#1A1A2E,#4B6BFF)', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.12)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div>
              <p className="text-white font-bold text-lg">Mon Portefeuille</p>
              <p className="text-white/60 text-xs">Solde & transactions</p>
            </div>
          </div>
          {/* Balance card */}
          <div className="rounded-2xl p-5 text-white" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Solde disponible</p>
            <p className="text-3xl font-bold mb-4">{loading ? '…' : solde.toLocaleString('fr-FR')} FCFA</p>
            <button onClick={() => setShowRetrait(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8l-8 8-8-8"/></svg>
              Demander un retrait
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 py-6 pb-10">

          {/* Confirmation retrait */}
          {retraitOk && (
            <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>Demande de retrait envoyée avec succès.</p>
            </div>
          )}

          {/* Modal retrait */}
          {showRetrait && (
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}
              onClick={() => setShowRetrait(false)}>
              <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(40px)' }}
                onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-text-dark text-lg mb-4">Demande de retrait</h3>
                <p className="text-sm text-text-grey mb-3">Solde disponible : <strong>{solde.toLocaleString('fr-FR')} FCFA</strong></p>
                <label className="block text-sm font-semibold text-text-dark mb-1.5">Montant à retirer (FCFA)</label>
                <input type="number" value={montant} onChange={e => setMontant(e.target.value)} min={1} max={solde}
                  placeholder="Ex: 50000"
                  className="w-full border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary mb-4 bg-surface-g" />
                <div className="flex gap-3">
                  <button onClick={() => setShowRetrait(false)}
                    className="flex-1 py-3.5 rounded-xl border border-divider font-bold text-sm text-text-grey">Annuler</button>
                  <button onClick={demanderRetrait} disabled={submitting || !montant || Number(montant) > solde}
                    className="flex-1 py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
                    {submitting ? 'Envoi…' : 'Envoyer'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal détail transaction */}
          {detailTx && (
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}
              onClick={() => setDetailTx(null)}>
              <div className="w-full max-w-md rounded-2xl p-6 max-h-[80vh] overflow-y-auto" style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(40px)' }}
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${typeColor(detailTx)}1A` }}>
                    <TypeIcon t={detailTx} color={typeColor(detailTx)} className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-text-dark">{typeLabel(detailTx)}</p>
                    <p className="text-xs text-text-grey">{formatDate(detailTx)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-text-dark">{montantOf(detailTx).toLocaleString('fr-FR')} FCFA</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: `${statutColor(statutLabel(detailTx))}1F`, color: statutColor(statutLabel(detailTx)) }}>
                      {statutLabel(detailTx)}
                    </span>
                  </div>
                </div>
                <div className="border-t border-divider pt-3 space-y-2.5">
                  {Object.entries(detailTx)
                    .filter(([k, v]) => !['id', 'type', 'wallet_id', 'created_at'].includes(k) && v != null && String(v) !== '')
                    .map(([k, v]) => (
                      <div key={k} className="flex items-start gap-3">
                        <span className="w-32 flex-shrink-0 text-xs text-text-grey">{fieldLabel(k)}</span>
                        <span className="text-xs font-semibold text-text-dark break-words">{String(v)}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Transactions */}
          <div>
            <p className="font-bold text-text-dark mb-4">Historique des transactions</p>
            {loading ? (
              [1,2,3].map(n => <div key={n} className="h-16 bg-white rounded-2xl animate-pulse mb-3" />)
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(75,107,255,0.1)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#4B6BFF" strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <p className="font-bold text-text-dark mb-1">Aucune transaction</p>
                <p className="text-text-grey text-sm">Vos commissions apparaîtront ici.</p>
              </div>
            ) : (
              <>
                {/* Résumé */}
                <div className="rounded-2xl p-4 mb-4 text-white flex items-center justify-between"
                  style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)', boxShadow: '0 8px 24px rgba(75,107,255,0.25)' }}>
                  <div>
                    <p className="text-white/70 text-xs">Total{filter !== 'Tous' ? ` (${filter})` : ''}</p>
                    <p className="text-xl font-bold mt-0.5">{totalFiltre.toLocaleString('fr-FR')} FCFA</p>
                    <p className="text-white/55 text-[11px] mt-0.5">{filteredTx.length} transaction{filteredTx.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      {loyerCount} Loyers
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      {visiteCount} Visites
                    </span>
                  </div>
                </div>

                {/* Filtres */}
                <div className="flex gap-2 mb-4">
                  {(['Tous', 'Loyers', 'Visites'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                      className="px-4 py-2 rounded-full text-xs font-bold transition-colors"
                      style={filter === f
                        ? { background: '#4B6BFF', color: '#fff', boxShadow: '0 4px 12px rgba(75,107,255,0.3)' }
                        : { background: '#fff', color: '#6E6E73', border: '1px solid rgba(0,0,0,0.08)' }}>
                      {f}
                    </button>
                  ))}
                </div>

                {filteredTx.length === 0 ? (
                  <p className="text-text-grey text-sm text-center py-8">Aucune transaction dans cette catégorie.</p>
                ) : filteredTx.map((t: any, i: number) => {
                  const statut = statutLabel(t)
                  const sColor = statutColor(statut)
                  const tColor = typeColor(t)
                  const subtitle = String(t.bien ?? t.reference ?? t.libelle ?? '')
                  return (
                    <div key={i} onClick={() => setDetailTx(t)}
                      className="flex items-center gap-3 p-4 bg-white rounded-2xl mb-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${tColor}1A` }}>
                        <TypeIcon t={t} color={tColor} className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text-dark text-sm truncate">{typeLabel(t)}</p>
                        {subtitle && <p className="text-xs text-text-grey mt-0.5 truncate">{subtitle}</p>}
                        <p className="text-[11px] text-text-grey mt-0.5">{formatDate(t)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm text-text-dark">{montantOf(t).toLocaleString('fr-FR')} FCFA</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: `${sColor}1F`, color: sColor }}>
                          {statut}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
