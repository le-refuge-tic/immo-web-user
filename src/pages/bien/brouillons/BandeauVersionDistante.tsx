/**
 * Lot 6 — le brouillon ouvert a été modifié sur un autre appareil : l'utilisateur choisit la
 * version à garder (rien n'est écrit entre-temps).
 */
export default function BandeauVersionDistante({ onCharger, onGarder }: { onCharger: () => void; onGarder: () => void }) {
  return (
    <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3"
      style={{ background: 'rgba(245,158,11,0.10)', borderColor: 'rgba(245,158,11,0.35)' }}>
      <p className="text-sm" style={{ color: 'var(--p-text)' }}>
        Ce brouillon a été modifié sur un autre appareil depuis l’ouverture de cette page.
      </p>
      <div className="flex flex-shrink-0 gap-3">
        <button type="button" onClick={onCharger} className="text-xs font-bold text-[var(--p-accent-text)]">Charger cette version</button>
        <button type="button" onClick={onGarder} className="text-xs font-bold" style={{ color: 'var(--p-muted)' }}>Garder ma saisie</button>
      </div>
    </div>
  )
}
