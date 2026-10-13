interface LoadMoreBarProps {
  loaded: number
  total: number
  loading: boolean
  /** La dernière demande de page suivante a échoué : la liste affichée reste intacte. */
  error?: boolean
  /** Des filtres appliqués dans le navigateur (prix, pièces…) ne portent que sur les annonces chargées. */
  localFilters?: boolean
  onLoadMore: () => void
}

/**
 * Pied de liste paginée (FE-D-005) : dit combien d'annonces sont affichées sur
 * combien existent, au lieu de tronquer la liste sans le signaler.
 */
export default function LoadMoreBar({ loaded, total, loading, error = false, localFilters = false, onLoadMore }: LoadMoreBarProps) {
  if (total <= 0 || loaded <= 0) return null
  const complete = loaded >= total
  return (
    <div className="flex flex-col items-center gap-3 py-8" role="status" aria-live="polite">
      <p className="text-sm text-text-grey">
        {complete
          ? `${total} annonce${total > 1 ? 's' : ''} au total`
          : `${loaded} annonces affichées sur ${total}`}
      </p>
      {localFilters && !complete && (
        <p className="text-xs text-text-grey max-w-sm text-center">
          Les filtres de prix, de pièces et de superficie, ainsi que le tri, s'appliquent aux annonces affichées. Chargez-en plus pour élargir le résultat.
        </p>
      )}
      {error && <p role="alert" className="text-sm font-semibold text-[color:var(--tx-red)]">Impossible de charger la suite. Vérifiez votre connexion.</p>}
      {!complete && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          className="px-6 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all active:scale-95"
          style={{ background: '#4160F2' }}
        >
          {loading ? 'Chargement…' : error ? 'Réessayer' : 'Afficher plus d’annonces'}
        </button>
      )}
    </div>
  )
}
