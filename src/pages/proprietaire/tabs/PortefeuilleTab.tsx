import { useState, useEffect } from 'react'
import { walletApi } from '../../../api/walletApi'
import NumeroRetraitModal from '../../../components/wallet/NumeroRetraitModal'
import { IcTrendUp, IcTrendDown } from './icons'
import { BLUE, DARK_BLUE, BLUE_TX } from './outils'

import { TransactionDetailModal } from './TransactionsTab'
import { categorieTransaction } from './transactionsOutils'
import { svgMaskUrl } from './rolesOutils'
import { apiMessage } from '../../../utils/apiMessage'
import { ModalSheet } from '../../../components/ui/ModalSheet'
import { RETRAIT_MINIMUM, messageApresDemande, messageMontantRetrait, raisonBlocageRetrait } from '../../../utils/retrait'
import { useInfoRetrait } from '../../../hooks/useInfoRetrait'
import { useSuiviRetraits } from '../../../hooks/useSuiviRetraits'
import RetraitConfirmModal from '../../../components/wallet/RetraitConfirmModal'
import SuiviRetraits from '../../../components/wallet/SuiviRetraits'
import SelecteurOperateur from '../../../components/wallet/SelecteurOperateur'
import type { MouvementWallet, WalletProprio } from '../../../types/proprietaire'
import { withAlpha } from '../../../utils/color'
import ErrorState from '../../../components/ErrorState'
import { usePaymentAttempt } from '../../../hooks/usePaymentAttempt'
import { avecCle } from '../../../utils/paymentAttempt'

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
  const attempt = usePaymentAttempt()
  const [montant, setMontant] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [resultat, setResultat] = useState<{ ok: boolean; texte: string } | null>(null)
  const { info: numeroInfo, limites, recharger: rechargerInfo, operateur, setOperateur } = useInfoRetrait()
  const [showNumeroModal, setShowNumeroModal] = useState(false)

  const montantNum = Number(montant)
  const fcfa = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`
  // Message dès la saisie (et non seulement au clic sur Confirmer) : B-015
  const montantMessage = messageMontantRetrait(montant, solde, limites)
  const montantValide = !!montant && !montantMessage
  const blocage = raisonBlocageRetrait(numeroInfo)
  const min = limites.min ?? RETRAIT_MINIMUM
  const aideMontant = `Minimum ${fcfa(min)}${limites.max && Number.isFinite(limites.max) ? ` · maximum ${fcfa(limites.max)}` : ''} · 3 retraits maximum / 24h vers le même numéro.`

  // L'argent part immédiatement : l'envoi n'a lieu qu'après la confirmation (RetraitConfirmModal).
  const envoyer = async () => {
    if (!operateur) return
    setError('')
    setSubmitting(true)
    try {
      const retrait = await avecCle(attempt, `revenus_locatifs:${montantNum}`, cle => walletApi.demandeRetrait(montantNum, 'revenus_locatifs', operateur, cle))
      attempt.reset()
      setConfirmOpen(false)
      setResultat(messageApresDemande(retrait))
      onSuccess()
    } catch (e: unknown) {
      attempt.fail(e)
      setError(apiMessage(e) || "Impossible d'envoyer la demande. Réessayez.")
    }
    setSubmitting(false)
  }

  if (resultat) {
    return (
      <ModalSheet open onClose={onClose} label={resultat.ok ? 'Demande de retrait envoyée' : 'Retrait échoué'} placement="center" panelClassName="w-full max-w-sm" backdropOpacity={0.45}>
        <div className="bg-p-surface rounded-2xl w-full p-7 text-center border border-p-border">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={resultat.ok
              ? { background: 'linear-gradient(135deg, var(--c-green-material), var(--c-success))', boxShadow: '0 8px 20px rgba(76,175,80,0.35)' }
              : { background: 'var(--c-danger)' }}>
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              {resultat.ok ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />}
            </svg>
          </div>
          <p className="font-bold text-p-text text-lg mb-2">{resultat.ok ? 'Demande envoyée !' : 'Retrait échoué'}</p>
          <p className="text-sm text-p-muted leading-relaxed mb-6">
            {fcfa(montantNum)} — {resultat.texte}
          </p>
          <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: BLUE, color: '#060D1A' }}>Fermer</button>
        </div>
      </ModalSheet>
    )
  }

  return (
    <>
    <ModalSheet open onClose={onClose} label="Demander un retrait" placement="center" panelClassName="w-full max-w-md" backdropOpacity={0.45}>
<div className="bg-p-surface rounded-2xl w-full max-h-[90vh] overflow-y-auto border border-p-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-p-border sticky top-0 bg-p-surface z-10">
          <div>
            <h2 className="font-bold text-p-text">Demander un retrait</h2>
            <p className="text-xs text-p-muted mt-0.5">Solde disponible : {solde.toLocaleString('fr-FR')} FCFA</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-p-surface text-p-muted flex-shrink-0" aria-label="Fermer">✕</button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label htmlFor="portefeuille-tab-97" className="text-xs font-bold text-p-text uppercase tracking-wide mb-2 block">Montant à retirer</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-p-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="5" width="20" height="14" rx="2" /><path strokeLinecap="round" d="M2 10h20" /></svg>
              <input id="portefeuille-tab-97" type="number" value={montant} onChange={e => setMontant(e.target.value)} placeholder="Ex: 50000" min={min} max={solde}
                aria-invalid={!!montantMessage} aria-describedby="retrait-montant-aide"
                className="w-full bg-p-card border border-p-border rounded-xl pl-10 pr-16 py-3 text-sm font-bold outline-none text-p-text focus:border-brand" />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-p-muted">FCFA</span>
            </div>
            <p id="retrait-montant-aide" aria-live="polite" className="text-[11px] mt-1.5" style={{ color: montantMessage ? 'var(--tx-red)' : '#8A9BB5', fontWeight: montantMessage ? 600 : 400 }}>
              {montantMessage || aideMontant}
            </p>
          </div>

          <div className="p-3.5 rounded-xl flex items-center justify-between gap-3" style={{ background: '#112440', border: '1px solid #1A3355' }}>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-p-muted uppercase tracking-wide mb-0.5">Envoyé sur</p>
              <p className="font-semibold text-sm text-p-text truncate">
                {numeroInfo?.masque || '—'}
              </p>
            </div>
            <button onClick={() => setShowNumeroModal(true)} className="flex-shrink-0 text-xs font-bold" style={{ color: BLUE_TX }}>
              Changer
            </button>
          </div>

          <SelecteurOperateur variant="sombre" valeur={operateur} onChange={setOperateur} disabled={submitting} />

          {blocage && (
            <p role="alert" className="text-xs rounded-xl px-3.5 py-2.5" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--c-amber-dark)', border: '1px solid rgba(245,158,11,0.3)' }}>{blocage}</p>
          )}

          {montantValide && (
            <div className="p-3.5 rounded-xl text-sm space-y-1" style={{ background: '#112440', border: '1px solid #1A3355' }} aria-label="Récapitulatif du retrait">
              <p className="text-[10px] font-bold text-p-muted uppercase tracking-wide">Récapitulatif</p>
              <p className="text-p-text">Vous retirez <strong>{fcfa(montantNum)}</strong> vers <strong>{numeroInfo?.masque || 'votre numéro de retrait'}</strong>.</p>
              <p className="text-p-muted">Solde après la demande : {fcfa(solde - montantNum)}</p>
            </div>
          )}

          <button onClick={() => { setError(''); setConfirmOpen(true) }} disabled={!montantValide || !!blocage || !operateur}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
            style={{ background: BLUE }}>
            Continuer
          </button>
        </div>
      </div>
</ModalSheet>
    {confirmOpen && (
      <RetraitConfirmModal variant="sombre" montant={montantNum} numeroMasque={numeroInfo?.masque} operateur={operateur}
        soldeApres={solde - montantNum} submitting={submitting} error={error}
        onCancel={() => { setConfirmOpen(false); setError('') }} onConfirm={envoyer} />
    )}
    {showNumeroModal && (
      <NumeroRetraitModal
        current={numeroInfo?.masque ?? null}
        onClose={() => setShowNumeroModal(false)}
        onSaved={() => { setShowNumeroModal(false); rechargerInfo() }}
      />
    )}
    </>
  )
}

export function PortefeuilleTab({ onOpenTransactions }: { onOpenTransactions: () => void }) {
  const [wallet, setWallet] = useState<WalletProprio | null>(null)
  const [transactions, setTrans] = useState<MouvementWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [showRetrait, setShowRetrait] = useState(false)
  const [detailTx, setDetailTx] = useState<MouvementWallet | null>(null)
  // Échec du chargement : jamais présenté comme « 0 FCFA / aucune transaction » ; un solde déjà affiché reste.
  const [loadError, setLoadError] = useState(false)

  const load = async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const [w, t] = await Promise.all([walletApi.me(), walletApi.transactions()])
      setWallet(w); setTrans(Array.isArray(t) ? t : t.data || [])
    } catch {
      setLoadError(true)
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  // Un virement qui échoue rend le montant au portefeuille : relecture silencieuse du solde.
  const rafraichirSolde = async () => {
    try {
      const [w, t] = await Promise.all([walletApi.me(), walletApi.transactions()])
      setWallet(w); setTrans(Array.isArray(t) ? t : t.data || [])
    } catch { /* le solde affiché reste celui d'avant */ }
  }
  const { retraits, recharger: rechargerRetraits } = useSuiviRetraits(rafraichirSolde)
  const retraitsWallet = retraits.filter(r => !wallet?.id || r.wallet_id === wallet.id)

  const noData = loadError && !wallet

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
          style={{ background: `linear-gradient(135deg, ${DARK_BLUE}, ${BLUE})`, boxShadow: `0 12px 30px ${withAlpha(BLUE, '40')}` }}>
          <div className="absolute rounded-full pointer-events-none" style={{ width: 220, height: 220, top: -110, right: -60, background: 'rgba(255,255,255,0.06)' }} />
          <div className="absolute rounded-full pointer-events-none" style={{ width: 140, height: 140, bottom: -70, right: 40, background: 'rgba(255,255,255,0.05)' }} />
          <div className="relative flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-white/70">
              <WalletMaskIcon path='<rect x="2" y="6" width="20" height="14" rx="3"/><path d="M2 10h20"/><circle cx="17" cy="15" r="1.4" fill="white"/>' />
              <span className="text-sm">Solde disponible</span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(255,255,255,0.16)' }}>PROPRIÉTAIRE</span>
          </div>
          <p className="relative text-[32px] font-extrabold tracking-tight mb-1">{loading ? '…' : noData ? '—' : solde.toLocaleString('fr-FR')} <span className="text-lg font-bold">FCFA</span></p>
          <p className="relative text-white/50 text-xs mb-6">Mis à jour le {updatedLabel}</p>
          <div className="relative flex flex-wrap gap-2.5">
            <button onClick={() => setShowRetrait(o => !o)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.16)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8l-8 8-8-8" /></svg>
              Demander un retrait
            </button>
            <button onClick={onOpenTransactions}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-p-card transition-opacity hover:opacity-90" style={{ color: BLUE_TX }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 7h6m-6 4h6" /></svg>
              Historique complet
            </button>
          </div>
        </div>

        {/* Mini-stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card-soft rounded-2xl p-3.5 min-w-0">
            <p className="text-[10px] font-semibold text-p-muted uppercase tracking-wide mb-1">Reçu ce mois</p>
            <p className="text-sm font-bold text-p-text truncate">{noData ? '—' : `${recuCeMois.toLocaleString('fr-FR')} F`}</p>
          </div>
          <div className="card-soft rounded-2xl p-3.5">
            <p className="text-[10px] font-semibold text-p-muted uppercase tracking-wide mb-1">Transactions</p>
            <p className="text-sm font-bold text-p-text">{noData ? '—' : transactions.length}</p>
          </div>
          <div className="card-soft rounded-2xl p-3.5">
            <p className="text-[10px] font-semibold text-p-muted uppercase tracking-wide mb-1">Dernière</p>
            <p className="text-sm font-bold text-p-text">{derniereLabel}</p>
          </div>
        </div>

        {/* Suivi des retraits : statut en direct, remboursement en cas d'échec */}
        <SuiviRetraits retraits={retraitsWallet} variant="sombre" />

        {/* Transactions récentes */}
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-p-text">Transactions récentes</p>
          {transactions.length > 0 && (
            <button onClick={onOpenTransactions} className="text-xs font-semibold" style={{ color: BLUE_TX }}>Voir tout →</button>
          )}
        </div>
        {loading ? [1, 2, 3].map(n => <div key={n} className="h-16 skeleton-dark rounded-xl mb-2" />) : noData ? (
          <ErrorState palette="proprietaire" title="Impossible de charger votre portefeuille" onRetry={load} className="py-10" />
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center card-navy rounded-2xl">
            <p className="font-bold text-p-text mb-1">Aucune transaction</p>
            <p className="text-sm text-p-muted">Vos loyers, frais de visite et intégrations apparaîtront ici.</p>
          </div>
        ) : transactions.slice(0, 5).map((t, i) => {
          const isCredit = t.type !== 'retrait'
          const montant = Number(t.amount ?? t.montant ?? 0)
          const cat = categorieTransaction(t.description)
          return (
            <button key={t.id || i} onClick={() => setDetailTx(t)} className="w-full flex items-center gap-3 p-3.5 card-navy rounded-xl mb-2 text-left hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: withAlpha(cat.color, '18') }}>
                <span style={{ color: cat.color }}>{isCredit ? <IcTrendUp /> : <IcTrendDown />}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-p-text text-sm truncate">{t.description || (isCredit ? 'Crédit' : 'Débit')}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ background: withAlpha(cat.color, '15'), color: cat.color }}>{cat.label}</span>
                  <span className="text-[10px] text-p-muted">{new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
              <p className="font-bold text-sm flex-shrink-0" style={{ color: isCredit ? 'var(--c-success)' : 'var(--c-danger)' }}>
                {isCredit ? '+' : '-'}{Math.abs(montant).toLocaleString('fr-FR')} F
              </p>
            </button>
          )
        })}
      </div>
      {showRetrait && (
        <RetraitModal solde={solde} onClose={() => setShowRetrait(false)} onSuccess={() => { load(); rechargerRetraits() }} />
      )}
      {detailTx && <TransactionDetailModal t={detailTx} onClose={() => setDetailTx(null)} />}
    </div>
  )
}

