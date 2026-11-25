import { useNavigate } from 'react-router-dom'
import { openPaymentUrl } from '../../../utils/paymentUrl'
import { fraisVisiteAPayer } from '../../../utils/fraisVisite'
import { ModalSheet } from '../../../components/ui/ModalSheet'
import type { usePaiementVisite } from './usePaiementVisite'
import { PrixVisite } from '../../../components/PrixVisite'

// Modale de paiement des frais de visite (saisie, attente, en attente, succès).
export function PaiementModal({ pay }: { pay: ReturnType<typeof usePaiementVisite> }) {
  const navigate = useNavigate()
  const {
    showPay, paying, payError, notice,
    payState, payRefId, payUrl, suivrePaiement, handlePayer, closePayModal,
  } = pay

  return (
    <ModalSheet open onClose={closePayModal} label="Payer la visite" placement="responsive" panelClassName="w-full md:max-w-md" zIndex={60} backdropOpacity={0.5} dismissible={!paying && (payState === 'idle' || payState === 'pending')}>
    <div className="glass-strong rounded-t-3xl md:rounded-3xl p-6 w-full">
        <div className="w-12 h-1 bg-divider rounded-full mx-auto mb-5" />

        {payState === 'pending' ? (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#FEF3C7' }}>
              <svg className="w-8 h-8" fill="none" stroke="var(--c-amber)" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p className="font-bold text-text-dark mb-2">Confirmation en attente</p>
            <p className="text-sm text-text-grey mb-6">Nous n'avons pas encore reçu la confirmation de l'opérateur. Si vous avez validé sur votre téléphone, le paiement apparaîtra ici dès réception.</p>
            <button
              onClick={() => { if (payRefId) suivrePaiement(payRefId, payUrl || undefined, 10) }}
              className="w-full py-3.5 rounded-xl font-bold text-white mb-3" style={{ background: 'var(--c-amber-dark)' }}>
              Vérifier à nouveau
            </button>
            <button onClick={closePayModal} className="text-sm font-semibold text-text-grey">Fermer</button>
          </div>
        ) : payState === 'success' ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--c-page-green)' }}>
              <svg className="w-8 h-8" fill="none" stroke="var(--c-green)" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="font-bold text-text-dark mb-1">Paiement confirmé !</p>
            <p className="text-sm text-text-grey mb-5">Les frais de visite ont bien été réglés.</p>
            <button onClick={() => { navigate(`/recu/visite/${payRefId}`) }} className="w-full py-3.5 rounded-xl font-bold text-white mb-2" style={{ background: 'var(--c-brand)' }}>
              Voir mon reçu
            </button>
            <button onClick={closePayModal} className="text-sm font-semibold text-text-grey">Fermer</button>
          </div>
        ) : payState === 'waiting' ? (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-bold text-text-dark mb-1">Confirmation en cours…</p>
            {notice && <p role="status" className="text-xs text-text-grey mb-3">{notice}</p>}
            {payUrl ? (
              <>
                <p className="text-sm text-text-grey mb-4">Terminez le paiement dans l'onglet ouvert, puis revenez ici.</p>
                <button onClick={() => openPaymentUrl(payUrl)}
                  className="w-full py-3 rounded-xl font-bold text-white text-sm" style={{ background: 'var(--c-orange-dark)' }}>
                  Rouvrir la page de paiement
                </button>
              </>
            ) : (
              <p className="text-sm text-text-grey">Nous attendons la confirmation de FedaPay.</p>
            )}
          </div>
        ) : (
          <>
            <h3 className="font-bold text-text-dark mb-1">Payer la visite</h3>
            <p className="text-sm text-text-grey mb-4">
              Montant : <span className="font-bold text-text-dark"><PrixVisite montant={showPay ? fraisVisiteAPayer(showPay) : 0} /></span>
            </p>
            {payError && <p className="text-danger text-sm mb-3">{payError}</p>}
            <p className="text-xs text-text-grey mb-4">Vous serez redirigé vers la page de paiement sécurisée FedaPay (carte ou Mobile Money).</p>
            <button
              onClick={handlePayer}
              disabled={paying}
              className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: 'var(--c-orange-dark)' }}
            >
              {paying ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Confirmer le paiement'}
            </button>
          </>
        )}
      </div>
</ModalSheet>
  )
}
