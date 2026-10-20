import { ModalSheet } from '../../../components/ui/ModalSheet'
import type { ConfirmDialogState } from './types'

// Boîte de confirmation des actions sur une visite (annuler, marquer effectuée…).
export function ConfirmDialog({ dialog, onClose }: { dialog: ConfirmDialogState; onClose: () => void }) {
  return (
    <ModalSheet open onClose={() => onClose()} label={dialog.title} placement="center" panelClassName="w-full max-w-sm" zIndex={60} backdropOpacity={0.5}>
<div className="glass-strong rounded-2xl p-6 w-full">
        <h3 className="font-bold text-text-dark text-base mb-2">{dialog.title}</h3>
        <p className="text-sm text-text-grey leading-relaxed mb-5">{dialog.body}</p>
        <div className="flex gap-3">
          <button onClick={() => onClose()} className="flex-1 py-3 rounded-xl border border-divider text-sm font-semibold text-text-dark">
            Garder
          </button>
          <button onClick={dialog.onConfirm} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--c-danger)' }}>
            Confirmer
          </button>
        </div>
      </div>
</ModalSheet>
  )
}
