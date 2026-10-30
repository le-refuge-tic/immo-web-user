import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { openPaymentUrl } from '../../../utils/paymentUrl'
import { loyersApi } from '../../../api/loyersApi'
import { paiementApi } from '../../../api/paiementApi'
import { walletApi } from '../../../api/walletApi'
import { formatMois } from '../../../utils/dateFormat'
import { validateBeninPhone, PHONE_FORMAT_HINT, PHONE_PLACEHOLDER, BENIN_PHONE_LENGTH } from '../../../utils/phone'
import { apiMessage } from '../../../utils/apiMessage'
import { issueStatutLoyer, loyerRepare, referenceLoyer } from '../../../utils/loyerPaiement'
import { usePaymentPolling } from '../../../hooks/usePaymentPolling'
import { useTentativesParCle } from '../../../hooks/usePaymentAttempt'
import { avecCle } from '../../../utils/paymentAttempt'
import { GREEN, TEAL, ORANGE, GREEN_TX, ORANGE_TX, TEAL_TX } from '../shared'
import { IcCheck, IcCal, IcMoney } from '../icons'
import OperateurChips from '../OperateurChips'
import type { ModePaiementLoyer, MonLogement } from '../../../types/locataire'
import { withAlpha } from '../../../utils/color'
import ErrorState from '../../../components/ErrorState'
import RefreshFailedNotice from '../../../components/RefreshFailedNotice'

export default function ActiviteTab() {
  const navigate = useNavigate()
  const [data, setData]         = useState<MonLogement | null>(null)
  const [loading, setLoading]   = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [tel, setTel]           = useState('')
  const [operateur, setOperateur] = useState<ModePaiementLoyer>('momo')
  const [cotisationSolde, setCotisationSolde] = useState(0)
  const [showPay, setShowPay]   = useState(false)
  const [paying, setPaying]     = useState(false)
  const [payState, setPayState] = useState<'idle'|'waiting'|'success'|'error'>('idle')
  const [payMsg, setPayMsg]     = useState('')
  const [payUrl, setPayUrl]     = useState('')
  const polling                 = usePaymentPolling()
  // Une clé d'idempotence par loyer : un renvoi retrouve la transaction et son lien de paiement (FE-B-006).
  const tentativeLoyer          = useTentativesParCle()
  const initiationEnCoursRef    = useRef(false)

  const load = async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const [logement, wallet] = await Promise.all([
        loyersApi.monLogement(),
        // Solde de cotisation facultatif : sans lui, seul le paiement par cotisation est indisponible.
        walletApi.me('cotisation').catch(() => null),
      ])
      // Réconciliation silencieuse : un loyer resté "en attente" alors que la
      // transaction a en fait été confirmée côté serveur (webhook manqué, etc).
      const prochain = logement?.loyers_en_attente?.[0] || logement?.prochain_loyer
      if (prochain?.id) {
        try {
          const repaired = await paiementApi.repairerLoyer(prochain.id)
          if (loyerRepare(repaired)) { setData(await loyersApi.monLogement()); setCotisationSolde(Number(wallet?.balance || 0)); setLoading(false); return }
        } catch { /* réparation facultative : on affiche le logement déjà chargé */ }
      }
      setData(logement)
      setCotisationSolde(Number(wallet?.balance || 0))
    } catch {
      setLoadError(true)
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const prochainLoyer = data?.loyers_en_attente?.[0] || data?.prochain_loyer
  const historique = data?.historique_loyers || []
  const contrat = data?.contrat
  const cotisationSuffisante = prochainLoyer ? cotisationSolde >= Number(prochainLoyer.montant) : false

  const urgence = () => {
    if (!prochainLoyer) return null
    const diff = new Date(prochainLoyer.date_echeance).getTime() - Date.now()
    const jours = Math.ceil(diff / 86400000)
    if (jours < 0)  return { label: `En retard de ${-jours}j`, color: 'var(--tx-red)', fill: 'var(--c-fill-red)', bg: 'rgba(239,68,68,0.125)' }
    if (jours <= 3) return { label: `Dû dans ${jours}j`, color: ORANGE_TX, fill: ORANGE, bg: withAlpha(ORANGE, '20') }
    if (jours <= 7) return { label: `À payer dans ${jours}j`, color: TEAL_TX, fill: TEAL, bg: withAlpha(TEAL, '20') }
    return { label: `${jours} jours`, color: GREEN_TX, fill: GREEN, bg: withAlpha(GREEN, '20') }
  }

  const payer = async () => {
    if (!prochainLoyer) return
    if (operateur === 'cotisation') {
      if (!cotisationSuffisante) return
      setPaying(true); setPayState('waiting')
      try {
        await paiementApi.payerLoyersAvecCotisation([prochainLoyer.id])
        setPayState('success'); load()
      } catch (e: unknown) {
        setPayState('error'); setPayMsg(apiMessage(e) || "Le paiement n'a pas pu aboutir. Réessayez dans un instant.")
      }
      setPaying(false)
      return
    }
    if (operateur !== 'fedapay' && !validateBeninPhone(tel)) { setPayState('error'); setPayMsg(PHONE_FORMAT_HINT); return }
    if (initiationEnCoursRef.current) return
    initiationEnCoursRef.current = true
    const loyerId = prochainLoyer.id
    setPaying(true); setPayState('waiting')
    try {
      const res = await avecCle(tentativeLoyer(loyerId), `${operateur}:${tel}`, cle =>
        paiementApi.initierLoyer({ loyer_id: loyerId, methode_paiement: operateur, telephone_paiement: tel }, cle))
      if (res.url_paiement) {
        // Lien refusé par la liste de domaines autorisés : on n'annonce pas « terminez dans l'onglet ouvert » et on ne suit rien.
        if (!openPaymentUrl(res.url_paiement)) {
          tentativeLoyer(loyerId).reset()
          setPayUrl('')
          setPayState('error'); setPayMsg('Le lien de paiement reçu est invalide. Vérifiez votre historique avant de réessayer.')
          return
        }
        setPayUrl(res.url_paiement)
      } else {
        setPayUrl('')
      }
      // Le backend renvoie `reference` : sans elle, aucun suivi ne peut partir.
      const reference = referenceLoyer(res)
      if (!reference) {
        tentativeLoyer(loyerId).reset()
        setPayState('error'); setPayMsg('Référence de paiement manquante. Vérifiez votre historique avant de réessayer.')
      } else {
        polling.start({
          intervalMs: 3000,
          maxAttempts: res.url_paiement ? 100 : 20,
          check: async () => issueStatutLoyer((await paiementApi.statutLoyer(reference)).statut),
          onSuccess: () => { tentativeLoyer(loyerId).reset(); setPayState('success'); load() },
          onFailed: () => { tentativeLoyer(loyerId).reset(); setPayState('error'); setPayMsg('Paiement échoué.') },
          onTimeout: () => { setPayState('error'); setPayMsg('Délai expiré.') },
        })
      }
    } catch (e: unknown) {
      tentativeLoyer(loyerId).fail(e)
      setPayState('error'); setPayMsg(apiMessage(e) || "Le paiement n'a pas pu aboutir. Réessayez dans un instant.")
    } finally {
      initiationEnCoursRef.current = false
      setPaying(false)
    }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GREEN, borderTopColor: 'transparent' }} /></div>

  if (loadError && !data) return (
    <div className="flex-1 flex items-center justify-center">
      <ErrorState title="Impossible de charger votre activité" onRetry={load} />
    </div>
  )

  const urg = urgence()

  return (
    <div className="flex-1 overflow-y-auto pb-6 px-4 md:px-8 md:max-w-3xl md:mx-auto md:w-full">
      {loadError && <RefreshFailedNotice onRetry={load} />}
      {/* Prépayé */}
      {Number(contrat?.loyer_prepaye_mois || 0) > 0 && (
        <div className="mt-5 md:mt-8 rounded-2xl p-4 flex items-center gap-3" style={{ background: withAlpha(TEAL, '15'), border: `1px solid ${withAlpha(TEAL, '30')}` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: withAlpha(TEAL, '20') }}>
            <span style={{ color: TEAL_TX }}><IcCheck /></span>
          </div>
          <p className="text-sm text-text-dark"><strong>{contrat?.loyer_prepaye_mois}</strong> mois déjà prépayés — vous êtes à jour d'avance.</p>
        </div>
      )}

      {/* Prochaine échéance */}
      {prochainLoyer && urg && (
        <div className="mt-5 md:mt-8 rounded-3xl p-5" style={{ background: urg.bg, border: `1.5px solid ${withAlpha(urg.color, '30')}` }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-text-dark">Prochaine échéance</p>
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: urg.fill, color: 'white' }}>{urg.label}</span>
          </div>
          <p className="text-2xl font-bold text-text-dark mb-1">{Number(prochainLoyer.montant).toLocaleString('fr-FR')} FCFA</p>
          <div className="flex items-center gap-1.5 text-text-grey text-sm">
            <IcCal />
            <span>{new Date(prochainLoyer.date_echeance).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
          <button onClick={() => { if (payState !== 'waiting') setPayState('idle'); setShowPay(!showPay) }} className="mt-4 w-full py-3 rounded-xl font-bold text-white text-sm"
            style={{ background: `linear-gradient(135deg, var(--c-emerald-dark), ${GREEN})` }}>
            Payer ce loyer
          </button>
        </div>
      )}

      {/* Modal paiement */}
      {showPay && (
        <div className="mt-3 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.08)' }}>
          {payState === 'waiting' ? (
            <div role="status" className="flex flex-col items-center gap-2 py-3">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GREEN, borderTopColor: 'transparent' }} />
              {payUrl ? (
                <>
                  <p className="text-sm text-text-grey text-center">Terminez le paiement dans l'onglet ouvert, puis revenez ici.</p>
                  <button onClick={() => openPaymentUrl(payUrl)}
                    className="mt-1 text-xs font-bold" style={{ color: GREEN_TX }}>
                    Rouvrir la page de paiement
                  </button>
                </>
              ) : (
                <p className="text-sm text-text-grey">Validez sur votre téléphone…</p>
              )}
            </div>
          ) : payState === 'success' ? (
            <div role="status" className="flex items-center gap-2 justify-center py-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: GREEN }}><IcCheck /></div>
              <p className="font-bold text-text-dark">Paiement confirmé !</p>
            </div>
          ) : payState === 'error' ? (
            <div className="text-center">
              <p role="alert" className="text-red-500 text-sm mb-2">{payMsg}</p>
              <button onClick={() => setPayState('idle')} className="text-sm font-semibold" style={{ color: TEAL_TX }}>Réessayer</button>
            </div>
          ) : (
            <>
              <p className="font-semibold text-text-dark text-sm mb-2">Mode de paiement</p>
              <OperateurChips value={operateur} onChange={setOperateur} cotisationSolde={cotisationSolde} />
              {operateur === 'cotisation' ? (
                !cotisationSuffisante && (
                  <p className="text-xs text-red-500 mb-3">Solde cotisation insuffisant ({cotisationSolde.toLocaleString('fr-FR')} F disponible).</p>
                )
              ) : operateur !== 'fedapay' && (
                <div className="flex items-center gap-2 bg-surface-g rounded-xl px-4 py-3 mb-3 border border-divider">
                  <span className="text-text-grey text-sm font-semibold">+229</span>
                  <div className="w-px h-4 bg-divider" />
                  <input type="tel" value={tel} onChange={e => setTel(e.target.value.replace(/\D/g, ''))}
                    placeholder={PHONE_PLACEHOLDER} maxLength={BENIN_PHONE_LENGTH} inputMode="tel" autoComplete="tel-national" aria-label="Numéro Mobile Money"
                    className="flex-1 min-w-0 bg-transparent text-sm outline-none text-text-dark" />
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setShowPay(false)} className="flex-1 py-3 rounded-xl border border-divider text-sm font-semibold text-text-grey">Annuler</button>
                <button onClick={payer}
                  disabled={paying || (operateur === 'cotisation' ? !cotisationSuffisante : (operateur !== 'fedapay' && !validateBeninPhone(tel)))}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ background: GREEN }}>{operateur === 'cotisation' ? 'Payer avec ma cotisation' : 'Payer'}</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Historique */}
      <div className="mt-6">
        <p className="font-bold text-text-dark mb-3">Historique ({historique.length})</p>
        {historique.length === 0 ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.7)' }}>
            <p className="text-text-grey text-sm">Aucun paiement effectué pour l'instant.</p>
          </div>
        ) : historique.map((h, i) => (
          <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl mb-2" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: withAlpha(GREEN, '15') }}>
              <span style={{ color: GREEN_TX }}><IcMoney /></span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-text-dark text-sm">{formatMois(h.mois || h.created_at)}</p>
              <p className="text-xs text-text-grey">{new Date(h.created_at || h.date_paiement).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm" style={{ color: GREEN_TX }}>+{Number(h.montant).toLocaleString('fr-FR')} F</p>
              <span className="text-micro font-semibold" style={{ color: GREEN_TX }}>Payé</span>
              {h.transaction_id && (
                <button onClick={() => navigate(`/recu/loyer/${h.transaction_id}`)}
                  className="block mt-1 text-micro font-bold underline" style={{ color: TEAL_TX }}>Reçu</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
