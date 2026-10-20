interface ErrorStateProps {
  /** Titre court : ce qui n'a pas pu être chargé. */
  title: string
  /** Consigne affichée sous le titre. */
  hint?: string
  onRetry: () => void
  /** Libellé du bouton de relance. */
  retryLabel?: string
  className?: string
}

/**
 * État d'erreur d'un chargement (FE-B-001) : une panne d'API ne doit jamais
 * se faire passer pour « aucun résultat ». Annoncé aux lecteurs d'écran,
 * avec une action de relance.
 */
export default function ErrorState({
  title,
  hint = 'Vérifiez votre connexion et réessayez.',
  onRetry,
  retryLabel = 'Réessayer',
  className = 'py-16',
}: ErrorStateProps) {
  return (
    <div role="alert" className={`flex flex-col items-center justify-center text-center px-4 ${className}`}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(239,68,68,0.1)' }}>
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <p className="font-bold text-base mb-1 text-text-dark">{title}</p>
      <p className="text-sm mb-5 text-text-grey">{hint}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
        style={{ background: 'var(--c-brand)' }}
      >
        {retryLabel}
      </button>
    </div>
  )
}
