interface LoadMoreBarProps {
  loaded: number
  total: number
  loading: boolean
  /** La dernière demande de page suivante a échoué : la liste affichée reste intacte. */
  error?: boolean
  /** Le filtre de prix, appliqué dans le navigateur, ne porte que sur les annonces chargées. */
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
          Le filtre de prix s'applique aux annonces affichées. Chargez-en plus pour élargir le résultat.
        </p>
      )}
      {error && <p role="alert" className="text-sm font-semibold text-[color:var(--tx-red)]">Impossible de charger la suite. Vérifiez votre connexion.</p>}
      {!complete && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          className="px-6 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all active:scale-95"
          style={{ background: 'var(--c-brand)' }}
        >
          {loading ? 'Chargement…' : error ? 'Réessayer' : 'Afficher plus d’annonces'}
        </button>
      )}
    </div>
  )
}
