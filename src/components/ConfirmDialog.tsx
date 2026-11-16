import { createPortal } from 'react-dom'
import type { ProprietesRendu, TonAction } from '../shared/dialogues/useConfirm'

const CLASSES_TON: Record<TonAction, string> = {
  danger: 'bg-red-600 text-white hover:bg-red-700',
  primaire: 'bg-primary text-white hover:opacity-90',
  neutre: 'border border-[var(--p-border)] text-[var(--p-text)] hover:bg-[var(--p-deep)]',
}

/**
 * Boîte de dialogue de confirmation (rendu de ConfirmProvider) : feuille en bas sur
 * mobile, centrée dès md. Échap ou clic à côté = Annuler.
 */
export default function ConfirmDialog({ titre, message, actions, repondre, idTitre, idMessage, refDialogue }: ProprietesRendu) {
  const principale = actions[actions.length - 1]
  return createPortal(
    // Fond : le clic à côté vaut « Annuler » ; au clavier, Échap fait de même (ConfirmProvider).
    <div
      role="presentation"
      className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center bg-black/50 md:p-4"
      onClick={e => e.target === e.currentTarget && repondre(null)}
    >
      <div
        ref={refDialogue}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={idTitre}
        aria-describedby={message ? idMessage : undefined}
        className="w-full max-w-md rounded-t-3xl md:rounded-3xl bg-[var(--p-card)] text-[var(--p-text)] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-6 shadow-2xl"
      >
        <h2 id={idTitre} className="text-lg font-bold leading-snug">{titre}</h2>
        {message && <div id={idMessage} className="mt-2 text-sm text-[var(--p-muted)] leading-relaxed">{message}</div>}
        <div className={`mt-6 flex gap-3 ${actions.length > 2 ? 'flex-col' : 'flex-col-reverse sm:flex-row'}`}>
          {actions.map(a => {
            const ton = a.ton ?? 'neutre'
            return (
              <button
                key={String(a.valeur)}
                type="button"
                data-autofocus={a === principale && ton !== 'danger' ? '' : undefined}
                onClick={() => repondre(a.valeur)}
                className={`flex-1 min-h-[48px] rounded-2xl px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${CLASSES_TON[ton]}`}
              >
                {a.libelle}
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body,
  )
}
