import { useState, useEffect, useRef } from 'react'
import { openPaymentUrl } from '../../../utils/paymentUrl'
import { paiementApi } from '../../../api/paiementApi'
import { validateBeninPhone, normaliseBeninPhone } from '../../../utils/phone'
import { track } from '../../../lib/analytics'
import { apiMessage } from '../../../utils/apiMessage'
import { readPaymentConflict } from '../../../utils/paymentAttempt'
import { usePaymentAttempt } from '../../../hooks/usePaymentAttempt'
import { usePaymentPolling } from '../../../hooks/usePaymentPolling'

// Paiement des frais de visite : état de la modale, suivi de la transaction
// (polling), idempotence (clé de tentative) et reprise d'un paiement en cours.
// Un seul appel par page : les refs et verrous ne sont jamais recréés.
export function usePaiementVisite({ loadVisites }: { loadVisites: () => void }) {
  const [showPay, setShowPay] = useState<any>(null)
  const [operator, setOperator] = useState('momo')
  const [phoneOp, setPhoneOp] = useState('')
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const [notice, setNotice] = useState('')
  const [payState, setPayState] = useState<'idle' | 'waiting' | 'pending' | 'success'>('idle')
  const [payRefId, setPayRefId] = useState('')
  const [payUrl, setPayUrl] = useState('')
  const polling = usePaymentPolling()
  const attempt = usePaymentAttempt()
  // Incrémenté à chaque fermeture de la modale : une réponse arrivée après coup est ignorée.
  const payGenerationRef = useRef(0)

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) polling.stop()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [polling])

  // Suivi d'une transaction déjà créée chez l'opérateur (nouvelle ou reprise).
  const suivrePaiement = (ref: string, urlPaiement: string | undefined, maxAttempts: number) => {
    setPayRefId(ref)
    setPayState('waiting')
    setPayUrl(urlPaiement ?? '')
    polling.start({
      intervalMs: 5000,
      maxAttempts,
      check: async () => {
        const { statut } = await paiementApi.statutVisite(ref)
        if (statut === 'confirme' || statut === 'reussi' || statut === 'success') return 'success'
        if (statut === 'echoue' || statut === 'failed') return 'failed'
        return 'waiting'
      },
      onSuccess: () => {
        attempt.reset()
        setPayState('success')
        track('visite_payee')
        loadVisites()
      },
      onFailed: () => {
        attempt.reset()
        setPayError('Paiement refusé. Vérifiez votre solde Mobile Money.')
        setPayState('idle')
      },
      onTimeout: () => setPayState('pending'),
    })
  }

  // FedaPay se paie sur une page hébergée ouverte à part — l'utilisateur a
  // besoin de bien plus de temps que pour valider un push USSD MoMo.
  const maxTentatives = (urlPaiement?: string) => (urlPaiement ? 100 : 20)

  const handlePayer = async () => {
    if (!showPay) return
    if (paying || payState === 'pending' || payState === 'waiting') return
    if (operator !== 'fedapay' && !validateBeninPhone(phoneOp)) return
    setPaying(true)
    setPayError('')
    const generation = payGenerationRef.current
    // FE-B-006 : une même clé pour une même tentative — rejouée après une coupure,
    // elle ne peut pas créer un second prélèvement.
    const idempotencyKey = attempt.key()
    try {
      const res = await paiementApi.initierVisite({
        visite_id: showPay.id,
        phone: normaliseBeninPhone(phoneOp),
        methode_paiement: operator as any,
      }, idempotencyKey)
      if (generation !== payGenerationRef.current) return
      const ref = res.referenceId || res.reference_id
      // FedaPay : la transaction est créée côté serveur mais le paiement ne
      // se fait que sur sa page hébergée — sans cette ouverture, l'utilisateur
      // reste bloqué sur l'écran d'attente jusqu'au timeout du polling.
      if (res.url_paiement) openPaymentUrl(res.url_paiement)
      suivrePaiement(ref, res.url_paiement, maxTentatives(res.url_paiement))
    } catch (err: any) {
      if (generation !== payGenerationRef.current) return
      const conflit = readPaymentConflict(err)
      if (conflit?.code === 'PAIEMENT_EN_ATTENTE' && conflit.referenceId) {
        // Une demande est déjà ouverte chez l'opérateur : on reprend son suivi
        // au lieu de débiter une seconde fois.
        suivrePaiement(conflit.referenceId, conflit.urlPaiement, maxTentatives(conflit.urlPaiement))
        setNotice('Un paiement était déjà en cours : nous reprenons son suivi.')
      } else if (conflit?.code === 'PAIEMENT_DEJA_CONFIRME') {
        attempt.reset()
        setPayRefId(conflit.referenceId ?? '')
        setPayState('success')
        loadVisites()
      } else if (conflit?.code === 'VISITE_GRATUITE') {
        attempt.reset()
        setPayError(apiMessage(err) || 'Cette visite est gratuite.')
        setPayState('idle')
        loadVisites()
      } else {
        // Réponse perdue ou serveur en erreur : on garde la clé pour que le
        // prochain essai retrouve la transaction éventuellement créée.
        attempt.fail(err)
        setPayError(apiMessage(err) || 'Erreur de paiement')
        setPayState('idle')
      }
    } finally {
      if (generation === payGenerationRef.current) setPaying(false)
    }
  }

  const closePayModal = () => {
    payGenerationRef.current++
    polling.stop()
    setPaying(false)
    setNotice('')
    setShowPay(null)
    setPayState('idle')
    setPhoneOp('')
    setPayError('')
    setPayUrl('')
    attempt.reset()
  }

  return {
    showPay, setShowPay, operator, setOperator, phoneOp, setPhoneOp, paying, payError, notice,
    payState, payRefId, payUrl, attempt, suivrePaiement, handlePayer, closePayModal,
  }
}
