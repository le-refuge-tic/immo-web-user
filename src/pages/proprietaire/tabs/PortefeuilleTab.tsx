import { useState, useEffect } from 'react'
import { walletApi } from '../../../api/walletApi'
import NumeroRetraitModal from '../../../components/wallet/NumeroRetraitModal'
import { IcTrendUp, IcTrendDown } from './icons'
import { BLUE, DARK_BLUE } from './shared'
import type { Tab } from './shared'
import { categorieTransaction, TransactionDetailModal } from './TransactionsTab'
import { svgMaskUrl } from './RolesTab'
import { apiMessage } from '../../../utils/apiMessage'

// ─── Tab: Portefeuille ────────────────────────────────────────────────────────
function WalletMaskIcon({ path, size = 20 }: { path: string; size?: number }) {
  const url = svgMaskUrl(path)
  return (
    <span aria-hidden="true" style={{
      display: 'inline-block', width: size, height: size, background: 'currentColor', flexShrink: 0,
      WebkitMaskImage: url, maskImage: url,
      WebkitMaskSize: 'contain', maskSize: 'contain',
      WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center', maskPosition: 'center',
    }} />
  )
}

function RetraitModal({ solde, onClose, onSuccess }: { solde: number; onClose: () => void; onSuccess: () => void }) {
  const [montant, setMontant] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState(false)
  const [numeroInfo, setNumeroInfo] = useState<{ masque: string | null } | null>(null)
  const [showNumeroModal, setShowNumeroModal] = useState(false)

  useEffect(() => { walletApi.numeroRetrait().then(setNumeroInfo).catch(() => {}) }, [])

  const montantNum = Number(montant)
  const montantValide = montantNum >= 500 && montantNum <= solde

  const confirmer = async () => {
    if (!montant || !montantValide) { setError(montantNum > solde ? 'Montant supérieur à votre solde disponible.' : 'Montant minimum : 500 FCFA.'); return }
    setError('')
    setSubmitting(true)
    try {
      await walletApi.demandeRetrait(montantNum, 'revenus_locatifs')
      setSuccessMsg(true)
      onSuccess()
    } catch (e: any) {
      setError(apiMessage(e) || "Impossible d'envoyer la demande. Réessayez.")
    }
    setSubmitting(false)
  }

  if (successMsg) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
        <div role="dialog" aria-modal="true" aria-label="Succès" className="bg-[#0B1C30] rounded-2xl w-full max-w-sm p-7 text-center border border-[#1A3355]">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)', boxShadow: '0 8px 20px rgba(76,175,80,0.35)' }}>
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <p className="font-bold text-[#F0EDE8] text-lg mb-2">Demande envoyée !</p>
          <p className="text-sm text-[#8A9BB5] leading-relaxed mb-6">
            Retrait de {montantNum.toLocaleString('fr-FR')} FCFA en attente de validation. Vous serez notifié dès l'envoi.
          </p>
          <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: BLUE, color: '#060D1A' }}>Fermer</button>
        </div>
      </div>
    )
  }

  return (
    <div aria-hidden="true" className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Détail de la transaction" aria-hidden="false" className="bg-[#0B1C30] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-[#1A3355]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A3355] sticky top-0 bg-[#0B1C30] z-10">
          <div>
            <h2 className="font-bold text-[#F0EDE8]">Demander un retrait</h2>
            <p className="text-xs text-[#8A9BB5] mt-0.5">Solde disponible : {solde.toLocaleString('fr-FR')} FCFA</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0B1C30] text-[#8A9BB5] flex-shrink-0" aria-label="Fermer">✕</button>
        </div>

        <div className="p-5 space-y-5">
          <div role="alert" aria-live="assertive" aria-atomic="true">
            {error && (
              <div className="px-3.5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#EF444414', color: 'var(--tx-red)', border: '1px solid #EF444430' }}>
                {error}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-[#F0EDE8] uppercase tracking-wide mb-2 block">Montant à retirer</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A9BB5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="5" width="20" height="14" rx="2" /><path strokeLinecap="round" d="M2 10h20" /></svg>
              <input type="number" value={montant} onChange={e => setMontant(e.target.value)} placeholder="Ex: 50000" min={500} max={solde}
                className="w-full bg-[#112440] border border-[#1A3355] rounded-xl pl-10 pr-16 py-3 text-sm font-bold outline-none text-[#F0EDE8] focus:border-[#4B6BFF]" />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8A9BB5]">FCFA</span>
            </div>
            <p className="text-[11px] text-[#8A9BB5] mt-1.5">Minimum 500 FCFA · maximum 3 retraits / 24h vers le même numéro.</p>
          </div>

          <div className="p-3.5 rounded-xl flex items-center justify-between gap-3" style={{ background: '#112440', border: '1px solid #1A3355' }}>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#8A9BB5] uppercase tracking-wide mb-0.5">Envoyé sur</p>
              <p className="font-semibold text-sm text-[#F0EDE8] truncate">{numeroInfo?.masque || '—'}</p>
            </div>
            <button onClick={() => setShowNumeroModal(true)} className="flex-shrink-0 text-xs font-bold" style={{ color: BLUE }}>Changer</button>
          </div>

          <button onClick={confirmer} disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
            style={{ background: BLUE }}>
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                Confirmer le retrait
              </>
            )}
          </button>
        </div>
      </div>

      {showNumeroModal && (
        <NumeroRetraitModal
          current={numeroInfo?.masque ?? null}
          onClose={() => setShowNumeroModal(false)}
          onSaved={() => { setShowNumeroModal(false); walletApi.numeroRetrait().then(setNumeroInfo).catch(() => {}) }}
        />
      )}
    </div>
  )
}

export function PortefeuilleTab({ onOpenTransactions }: { onOpenTransactions: () => void }) {
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTrans] = useState<any[]>([])
  const [retraits, setRetraits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showRetrait, setShowRetrait] = useState(false)
  const [detailTx, setDetailTx] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [w, t, r] = await Promise.all([walletApi.me(), walletApi.transactions(), walletApi.mesRetraits()])
      setWallet(w); setTrans(Array.isArray(t) ? t : t.data || []); setRetraits(Array.isArray(r) ? r : r.data || [])
    } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const retraitsEnCours = retraits.filter(r => r.statut === 'en_attente' || r.statut === 'approuve')

  const solde = Number(wallet?.balance || 0)

  const now = new Date()
  const recuCeMois = transactions
    .filter(t => {
      const d = new Date(t.created_at)
      return t.type !== 'retrait' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((s, t) => s + Number(t.amount ?? t.montant ?? 0), 0)
  const derniereTx = transactions[0]
  const derniereLabel = derniereTx
    ? new Date(derniereTx.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : '—'
  const updatedLabel = wallet?.updated_at
    ? new Date(wallet.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-8">
      <div>
        {/* Carte solde — style carte bancaire, motif décoratif discret */}
        <div className="relative overflow-hidden rounded-2xl p-6 mb-5 text-white"
          style={{ background: `linear-gradient(135deg, ${DARK_BLUE}, ${BLUE})`, boxShadow: `0 12px 30px ${BLUE}40` }}>
          <div className="absolute rounded-full pointer-events-none" style={{ width: 220, height: 220, top: -110, right: -60, background: 'rgba(255,255,255,0.06)' }} />
          <div className="absolute rounded-full pointer-events-none" style={{ width: 140, height: 140, bottom: -70, right: 40, background: 'rgba(255,255,255,0.05)' }} />
          <div className="relative flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-white/70">
              <WalletMaskIcon path='<rect x="2" y="6" width="20" height="14" rx="3"/><path d="M2 10h20"/><circle cx="17" cy="15" r="1.4" fill="white"/>' />
              <span className="text-sm">Solde disponible</span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(255,255,255,0.16)' }}>PROPRIÉTAIRE</span>
          </div>
          <p className="relative text-[32px] font-extrabold tracking-tight mb-1">{loading ? '…' : solde.toLocaleString('fr-FR')} <span className="text-lg font-bold">FCFA</span></p>
          <p className="relative text-white/50 text-xs mb-6">Mis à jour le {updatedLabel}</p>
          <div className="relative flex flex-wrap gap-2.5">
            <button onClick={() => setShowRetrait(o => !o)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.16)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8l-8 8-8-8" /></svg>
              Demander un retrait
            </button>
            <button onClick={onOpenTransactions}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-[#112440] transition-opacity hover:opacity-90" style={{ color: BLUE }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 7h6m-6 4h6" /></svg>
              Historique complet
            </button>
          </div>
        </div>

        {/* Mini-stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card-soft rounded-2xl p-3.5 min-w-0">
            <p className="text-[10px] font-semibold text-[#8A9BB5] uppercase tracking-wide mb-1">Reçu ce mois</p>
            <p className="text-sm font-bold text-[#F0EDE8] truncate">{recuCeMois.toLocaleString('fr-FR')} F</p>
          </div>
          <div className="card-soft rounded-2xl p-3.5">
            <p className="text-[10px] font-semibold text-[#8A9BB5] uppercase tracking-wide mb-1">Transactions</p>
            <p className="text-sm font-bold text-[#F0EDE8]">{transactions.length}</p>
          </div>
          <div className="card-soft rounded-2xl p-3.5">
            <p className="text-[10px] font-semibold text-[#8A9BB5] uppercase tracking-wide mb-1">Dernière</p>
            <p className="text-sm font-bold text-[#F0EDE8]">{derniereLabel}</p>
          </div>
        </div>

        {/* Retraits en cours */}
        {retraitsEnCours.length > 0 && (
          <div className="mb-6">
            <p className="font-bold text-[#F0EDE8] mb-3">Retraits en cours</p>
            {retraitsEnCours.map((r: any) => {
              const approuve = r.statut === 'approuve'
              const color = approuve ? '#B45309' : '#8A9BB5'
              return (
                <div key={r.id} className="flex items-center gap-3 p-3.5 rounded-xl mb-2" style={{ background: '#112440', border: `1px solid ${color}40` }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} className="w-5 h-5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#F0EDE8]">{Number(r.montant).toLocaleString('fr-FR')} FCFA</p>
                    <p className="text-xs" style={{ color }}>{approuve ? 'Approuvé — envoi en cours' : 'En attente de validation'}</p>
                  </div>
                  <p className="text-[11px] text-[#8A9BB5] flex-shrink-0">{new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Transactions récentes */}
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-[#F0EDE8]">Transactions récentes</p>
          {transactions.length > 0 && (
            <button onClick={onOpenTransactions} className="text-xs font-semibold" style={{ color: BLUE }}>Voir tout →</button>
          )}
        </div>
        {loading ? [1, 2, 3].map(n => <div key={n} className="h-16 skeleton-dark rounded-xl mb-2" />) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center card-navy rounded-2xl">
            <p className="font-bold text-[#F0EDE8] mb-1">Aucune transaction</p>
            <p className="text-sm text-[#8A9BB5]">Vos loyers, frais de visite et intégrations apparaîtront ici.</p>
          </div>
        ) : transactions.slice(0, 5).map((t: any, i: number) => {
          const isCredit = t.type !== 'retrait'
          const montant = Number(t.amount ?? t.montant ?? 0)
          const cat = categorieTransaction(t.description)
          return (
            <button key={t.id || i} onClick={() => setDetailTx(t)} className="w-full flex items-center gap-3 p-3.5 card-navy rounded-xl mb-2 text-left hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cat.color + '18' }}>
                <span style={{ color: cat.color }}>{isCredit ? <IcTrendUp /> : <IcTrendDown />}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#F0EDE8] text-sm truncate">{t.description || (isCredit ? 'Crédit' : 'Débit')}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ background: cat.color + '15', color: cat.color }}>{cat.label}</span>
                  <span className="text-[10px] text-[#8A9BB5]">{new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
              <p className="font-bold text-sm flex-shrink-0" style={{ color: isCredit ? '#15803D' : '#DC2626' }}>
                {isCredit ? '+' : '-'}{Math.abs(montant).toLocaleString('fr-FR')} F
              </p>
            </button>
          )
        })}
      </div>
      {showRetrait && (
        <RetraitModal solde={solde} onClose={() => setShowRetrait(false)} onSuccess={load} />
      )}
      {detailTx && <TransactionDetailModal t={detailTx} onClose={() => setDetailTx(null)} />}
    </div>
  )
}

