import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { visitesApi } from '../../api/visitesApi'
import { chatApi } from '../../api/chatApi'
import { bienTypeLabel } from '../../utils/bienType'
import { usePageTitle } from '../../utils/usePageTitle'
import { unwrapList } from '../../utils/unwrapList'
import { useApiQuery } from '../../hooks/useApiQuery'
import ErrorState from '../../components/ErrorState'
import RefreshFailedNotice from '../../components/RefreshFailedNotice'
import { apiMessage } from '../../utils/apiMessage'
import { TABS, NO_VISITES } from './visites/constants'
import { fmtDate, isEchoueeVisite } from './visites/helpers'
import type { ConfirmDialogState } from './visites/types'
import type { Visite } from '../../types/api'
import { VisiteCard } from './visites/VisiteCard'
import { usePaiementVisite } from './visites/usePaiementVisite'
import { useAvisVisite } from './visites/useAvisVisite'
import { PaiementModal } from './visites/PaiementModal'
import { FeedbackModal } from './visites/FeedbackModal'
import { ConfirmDialog } from './visites/ConfirmDialog'

export default function MesVisitesPage() {
  usePageTitle('Mes visites')
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState(0)
  // Chargement annulable, sans réponse périmée (FE-A-004) ; refetch recharge la liste.
  const { data: visitesData, loading, error: loadError, refetch: loadVisites } = useApiQuery(
    signal => visitesApi.mesVisites(signal).then(unwrapList),
    [],
  )
  const visites = visitesData ?? NO_VISITES
  const pay = usePaiementVisite({ loadVisites })
  const { setShowPay } = pay
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null)
  // Échec d'une action (annuler, confirmer…) : le bouton de la carte reste utilisable pour recommencer.
  const [actionError, setActionError] = useState('')
  const echecAction = (e: unknown, repli: string) => setActionError(apiMessage(e) || repli)
  const avis = useAvisVisite({ loadVisites })

  // Ouverture directe du paiement quand on arrive depuis "Payer maintenant"
  // dans le chat (comme sur mobile) — au lieu de laisser l'utilisateur
  // rechercher lui-même la visite dans la liste.
  useEffect(() => {
    const targetId = (location.state as { openPayForVisiteId?: number } | null)?.openPayForVisiteId
    if (!targetId || visites.length === 0) return
    const v = visites.find(x => x.id === targetId)
    if (v) {
      setShowPay(v)
      navigate(location.pathname, { replace: true, state: {} })
    }
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- navigate et le chemin courant ne servent qu'à effacer l'état de navigation une fois consommé
  }, [visites, location.state])

  const filtered = visites.filter(v => {
    const echouee = isEchoueeVisite(v)
    if (tab === 0) return true
    if (tab === 1) return !echouee && ['en_attente', 'contre_proposee', 'confirmee'].includes(v.statut)
    if (tab === 2) return echouee || ['effectuee', 'annulee'].includes(v.statut)
    if (tab === 3) return v.statut === 'annulee'
    if (tab === 4) return echouee
    return true
  })

  const handleAnnuler = (v: Visite) => {
    const body = v.statut === 'confirmee'
      ? 'Cette visite est déjà confirmée. Voulez-vous vraiment l\'annuler ?'
      : 'Voulez-vous vraiment annuler cette demande de visite ?'
    setConfirmDialog({
      title: 'Annuler la visite ?',
      body,
      onConfirm: async () => {
        setConfirmDialog(null)
        // Recharger même en cas d'erreur réseau — le serveur a peut-être traité
        // la demande (cold start Render) et l'état affiché doit refléter la réalité.
        setActionError('')
        try { await visitesApi.annuler(v.id) } catch (e: unknown) { echecAction(e, "L'annulation de la visite a échoué. Réessayez.") } finally { loadVisites() }
      },
    })
  }

  const handleMarquerEffectuee = (v: Visite) => {
    setConfirmDialog({
      title: 'Visite effectuée ?',
      body: 'Confirmez-vous que la visite a bien eu lieu ?',
      onConfirm: async () => {
        setConfirmDialog(null)
        setActionError('')
        try { await visitesApi.marquerEffectuee(v.id) } catch (e: unknown) { echecAction(e, 'La mise à jour de la visite a échoué. Réessayez.') } finally { loadVisites() }
      },
    })
  }

  const handleAccepterCP = async (id: number) => {
    setActionError('')
    try {
      await visitesApi.accepterContreProposition(id)
      loadVisites()
    } catch (e: unknown) {
      echecAction(e, "Le créneau proposé n'a pas pu être accepté. Réessayez.")
    }
  }

  const handleRefuserCP = (v: Visite) => {
    setConfirmDialog({
      title: 'Refuser le créneau proposé ?',
      body: 'La visite sera annulée. Vous pouvez faire une nouvelle demande si vous le souhaitez.',
      onConfirm: async () => {
        setConfirmDialog(null)
        setActionError('')
        try { await visitesApi.annuler(v.id) } catch (e: unknown) { echecAction(e, 'Le refus du créneau a échoué. Réessayez.') } finally { loadVisites() }
      },
    })
  }

  const handleReproposer = async (id: number, isoDate: string) => {
    setActionError('')
    try {
      await visitesApi.reProposer(id, isoDate)
    } catch (e) {
      // Refus du serveur (4xx) : la carte affiche l'erreur et garde son formulaire ouvert, sans recharger la liste.
      // Pas de réponse (délai dépassé, coupure) : le serveur a peut-être enregistré la proposition, on recharge.
      if (!(e as { response?: unknown } | null)?.response) loadVisites()
      throw e
    }
    loadVisites()
  }

  const openChat = async (bienId: number, draftMessage?: string) => {
    try {
      const conv = await chatApi.creerConversation(bienId)
      navigate(`/conversations/${conv.conversationId}`, draftMessage ? { state: { draftMessage } } : undefined)
    } catch (e: unknown) {
      echecAction(e, "Impossible d'ouvrir la conversation. Réessayez.")
    }
  }

  const handleContacterEchouee = (v: Visite) => {
    const bien = v.bien
    const gestionnairePrenom = v.gestionnaire?.prenom || ''
    const typeStr = bien ? bienTypeLabel(bien) : 'ce bien'
    const loc = bien?.localisation?.quartier ? `${bien.localisation.quartier}, ${bien.localisation.ville}` : (bien?.localisation?.ville || '')
    const msg = `Bonjour${gestionnairePrenom ? ' ' + gestionnairePrenom : ''}, je vous contacte au sujet de notre visite prévue le ${fmtDate(v.date_contre_proposee || v.date_souhaitee)} pour le bien ${typeStr}${loc ? ' à ' + loc : ''}, qui ne s'est pas tenue. Peut-on reprogrammer ?`
    if (bien?.id) openChat(bien.id, msg)
  }

  const handleIntegration = async (id: number, integre: boolean, bienId?: number) => {
    setActionError('')
    try {
      await visitesApi.deciderIntegration(id, integre)
      loadVisites()
      // Comme sur mobile : le contrat de bail s'affiche une seule fois,
      // juste après avoir accepté d'intégrer — avant d'aller au paiement.
      if (integre && bienId) navigate(`/contrat-bail/${bienId}`)
    } catch (e: unknown) {
      echecAction(e, "Votre choix n'a pas pu être enregistré. Réessayez.")
    }
  }

  return (
    <div className="min-h-full">

      {/* ── Header (mobile sticky + desktop glass bar) ── */}
      <div className="sticky top-0 md:top-[72px] z-10 bg-[rgba(245,245,247,0.88)] dark:bg-[rgba(15,15,20,0.88)] border-b border-black/[0.07] dark:border-white/[0.08]" style={{ backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}>
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-3 pt-6 md:pt-5 pb-3">
            <button onClick={() => navigate(-1)} aria-label="Retour"
              className="glass-btn w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0">
              <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-text-dark">Mes visites</h1>
              {!loading && !loadError && <p className="text-xs text-text-grey">{visites.length} visite{visites.length > 1 ? 's' : ''} au total</p>}
            </div>
          </div>
          {/* Tabs */}
          {/* Onglets : défilent horizontalement sur petit écran au lieu d'être écrasés */}
          <div role="group" aria-label="Filtrer les visites" className="flex gap-1 md:gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {TABS.map((t, i) => (
              <button key={t} type="button" aria-pressed={tab === i} onClick={() => setTab(i)}
                className={`flex-shrink-0 px-3 md:px-6 pb-3 text-[13px] font-semibold transition-all relative whitespace-nowrap ${tab === i ? 'text-primary dark:text-brand-soft' : 'text-gray-500 dark:text-[#5F6672]'}`}>
                {t}
                {tab === i && <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-brand" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
        {actionError && <RefreshFailedNotice message={actionError} />}
        {!!loadError && !loading && visites.length > 0 && <RefreshFailedNotice onRetry={loadVisites} />}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(n => <div key={n} className="skeleton rounded-2xl h-28" />)}
          </div>
        ) : loadError && visites.length === 0 ? (
          <ErrorState title="Impossible de charger vos visites" onRetry={loadVisites} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-[20px] flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(75,107,255,0.1)' }}>
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="var(--c-brand)" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-bold text-text-dark mb-1">Aucune visite</p>
            <p className="text-text-grey text-sm">Vos demandes de visite apparaîtront ici</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-24 md:pb-8">
            {filtered.map(v => <VisiteCard key={v.id} visite={v} onAnnuler={handleAnnuler} onAccepterCP={handleAccepterCP} onRefuserCP={handleRefuserCP} onReproposer={handleReproposer} onMarquerEffectuee={handleMarquerEffectuee} onIntegration={handleIntegration} onPay={setShowPay} onMessage={(bienId) => openChat(bienId)} onContacterEchouee={handleContacterEchouee} onFeedback={avis.openFeedback} onPayIntegration={(bienId) => navigate(`/paiement-integration/${bienId}`)} />)}
          </div>
        )}
      </div>

      {/* Payment modal */}
      {pay.showPay && <PaiementModal pay={pay} />}

      {/* Feedback modal */}
      {avis.showFeedback && <FeedbackModal avis={avis} />}

      {/* Confirm dialog */}
      {confirmDialog && <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />}
    </div>
  )
}
