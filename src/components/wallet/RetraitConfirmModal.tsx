import { ModalSheet } from '../ui/ModalSheet'
import { libelleOperateur } from '../../utils/retrait'

const fcfa = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`

/**
 * Dernière vérification avant un retrait : l'argent part tout de suite vers le numéro
 * enregistré et ne peut plus être rappelé. Le numéro est affiché masqué.
 */
export default function RetraitConfirmModal({ variant, montant, numeroMasque, operateur, soldeApres, submitting, error, onCancel, onConfirm }: {
  variant: 'sombre' | 'clair'
  montant: number
  numeroMasque: string | null | undefined
  operateur: string | null | undefined
  soldeApres: number
  submitting: boolean
  error: string
  onCancel: () => void
  onConfirm: () => void
}) {
  const sombre = variant === 'sombre'
  const panneau = sombre ? 'bg-p-surface border border-p-border' : ''
  const texte = sombre ? 'text-p-text' : 'text-text-dark'
  const muet = sombre ? 'text-p-muted' : 'text-text-grey'
  const ligne = sombre ? 'border-p-border' : 'border-divider'

  return (
    <ModalSheet open onClose={onCancel} dismissible={!submitting} label="Confirmer le retrait" placement="center" panelClassName="w-full max-w-sm" backdropOpacity={0.55} zIndex={70}>
      <div className={`rounded-2xl w-full p-6 ${panneau}`} style={sombre ? undefined : { background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(40px)' }}>
        <h3 className={`font-bold text-lg mb-1 ${texte}`}>Confirmer le retrait</h3>
        <p className={`text-sm mb-4 ${muet}`}>Vérifiez les informations : l&apos;argent part immédiatement.</p>

        <dl className={`rounded-xl border ${ligne} divide-y ${ligne} mb-4 text-sm`}>
          <div className="flex justify-between gap-3 px-3.5 py-2.5">
            <dt className={muet}>Montant</dt>
            <dd className={`font-bold ${texte}`}>{fcfa(montant)}</dd>
          </div>
          <div className="flex justify-between gap-3 px-3.5 py-2.5">
            <dt className={muet}>Numéro Mobile Money</dt>
            <dd className={`font-bold ${texte}`}>{numeroMasque || '—'}</dd>
          </div>
          <div className="flex justify-between gap-3 px-3.5 py-2.5">
            <dt className={muet}>Opérateur</dt>
            <dd className={`font-bold ${texte}`}>{libelleOperateur(operateur) || '—'}</dd>
          </div>
          <div className="flex justify-between gap-3 px-3.5 py-2.5">
            <dt className={muet}>Solde après retrait</dt>
            <dd className={`font-bold ${texte}`}>{fcfa(soldeApres)}</dd>
          </div>
        </dl>

        <p className="text-xs rounded-xl px-3.5 py-2.5 mb-4" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--c-amber-dark)', border: '1px solid rgba(245,158,11,0.3)' }}>
          Une fois envoyé, le virement ne peut pas être annulé. En cas d&apos;échec côté opérateur, le montant est automatiquement remis sur votre portefeuille.
        </p>

        <div role="alert" aria-live="assertive" aria-atomic="true">
          {error && <p className="text-sm font-semibold mb-3" style={{ color: 'var(--c-danger)' }}>{error}</p>}
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} disabled={submitting}
            className={`flex-1 py-3.5 rounded-xl border font-bold text-sm disabled:opacity-50 ${sombre ? 'border-p-border text-p-muted' : 'border-divider text-text-grey'}`}>
            Modifier
          </button>
          <button onClick={onConfirm} disabled={submitting}
            className="flex-1 py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
            style={{ background: 'var(--c-brand)' }}>
            {submitting ? 'Envoi…' : 'Envoyer maintenant'}
          </button>
        </div>
      </div>
    </ModalSheet>
  )
}
