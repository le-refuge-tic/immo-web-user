import { useState } from 'react'
import { ModalSheet } from './ui/ModalSheet'
import {
  DELAI_REMBOURSEMENT_JOURS,
  DUREE_REPORT_JOURS,
  fcfa,
  politiqueAnnulation,
  type ChoixAnnulation,
  type VisiteAnnulable,
} from '../utils/annulationVisite'

type Props = {
  visite: VisiteAnnulable & { statut?: string }
  onClose: () => void
  onConfirm: (choix: ChoixAnnulation) => void
  busy?: boolean
  /** Titre et texte d'appel (ex. refus d'une contre-proposition). */
  titre?: string
  texte?: string
}

/**
 * Annulation d'une visite par le prospect : annonce ce que la grille lui
 * rembourse et, à 24 h ou plus de la visite payée, lui laisse choisir entre
 * le remboursement et le report gratuit.
 */
export function AnnulationVisiteDialog({ visite, onClose, onConfirm, busy, titre, texte }: Props) {
  const politique = politiqueAnnulation(visite)
  const [choix, setChoix] = useState<ChoixAnnulation>('rembourser')
  const intro = texte ?? (visite.statut === 'confirmee'
    ? 'Cette visite est déjà confirmée. Voulez-vous vraiment l\'annuler ?'
    : 'Voulez-vous vraiment annuler cette demande de visite ?')

  return (
    <ModalSheet open onClose={onClose} label={titre ?? 'Annuler la visite ?'} placement="center" panelClassName="w-full max-w-sm" zIndex={60} backdropOpacity={0.5}>
      <div className="glass-strong rounded-2xl p-6 w-full">
        <h3 className="font-bold text-text-dark text-base mb-2">{titre ?? 'Annuler la visite ?'}</h3>
        <p className="text-sm text-text-grey leading-relaxed mb-4">{intro}</p>

        {politique.fraisPayes > 0 && (politique.reportPossible ? (
          <fieldset className="space-y-2 mb-5">
            <legend className="sr-only">Que faire de vos frais de visite ?</legend>
            <OptionChoix
              actif={choix === 'rembourser'} onSelect={() => setChoix('rembourser')}
              titre={`Être remboursé de ${fcfa(politique.montant)}`}
              detail={`Versé sur votre Mobile Money sous ${DELAI_REMBOURSEMENT_JOURS} jours.`}
            />
            <OptionChoix
              actif={choix === 'reporter'} onSelect={() => setChoix('reporter')}
              titre="Reporter ma visite"
              detail={`Revenez voir ce bien un autre jour sans payer à nouveau, dans les ${DUREE_REPORT_JOURS} jours.`}
            />
          </fieldset>
        ) : (
          <p className="text-sm rounded-xl px-3 py-2.5 mb-5"
            style={politique.montant > 0
              ? { background: 'rgba(34,197,94,0.10)', color: 'var(--tx-green)' }
              : { background: 'rgba(239,68,68,0.08)', color: 'var(--tx-red)' }}>
            {politique.montant > 0
              ? `Vous serez remboursé de ${fcfa(politique.montant)} (${politique.pourcentage} % de vos frais) sous ${DELAI_REMBOURSEMENT_JOURS} jours.`
              : 'À moins d\'1 h de la visite, les frais de visite ne sont pas remboursés.'}
          </p>
        ))}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={busy} className="flex-1 py-3 rounded-xl border border-divider text-sm font-semibold text-text-dark">
            Garder
          </button>
          <button onClick={() => onConfirm(politique.reportPossible ? choix : 'rembourser')} disabled={busy}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: 'var(--c-danger)' }}>
            {busy ? '…' : choix === 'reporter' && politique.reportPossible ? 'Reporter' : 'Confirmer'}
          </button>
        </div>
      </div>
    </ModalSheet>
  )
}

function OptionChoix({ actif, onSelect, titre, detail }: { actif: boolean; onSelect: () => void; titre: string; detail: string }) {
  return (
    <label aria-label={titre} className="flex items-start gap-3 rounded-xl px-3 py-2.5 cursor-pointer border border-divider transition-colors"
      style={actif ? { borderColor: 'var(--c-brand)', background: 'rgba(75,107,255,0.06)' } : undefined}>
      <input type="radio" name="choix-annulation" checked={actif} onChange={onSelect} aria-label={titre} className="mt-1 accent-[var(--c-brand)]" />
      <span>
        <span className="block text-sm font-bold text-text-dark">{titre}</span>
        <span className="block text-xs text-text-grey mt-0.5">{detail}</span>
      </span>
    </label>
  )
}
