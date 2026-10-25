interface RefreshFailedNoticeProps {
  /** Ce qui n'a pas pu être actualisé (ex. « Actualisation impossible »). */
  message?: string
  /** Absent : simple message (l'action échouée se relance en recliquant sur son bouton). */
  onRetry?: () => void
  /** `proprietaire` : couleurs du thème de l'espace propriétaire (variables --p-*). */
  palette?: 'default' | 'proprietaire'
  className?: string
}

/**
 * Bandeau discret : un rafraîchissement a échoué alors que des données sont déjà affichées
 * (FE-B-001). On garde la liste à l'écran au lieu de la remplacer par un écran d'erreur,
 * mais on prévient que les informations peuvent être périmées.
 */
export default function RefreshFailedNotice({
  message = 'Actualisation impossible : les informations affichées peuvent être anciennes.',
  onRetry,
  palette = 'default',
  className = 'mb-4',
}: RefreshFailedNoticeProps) {
  const isProprio = palette === 'proprietaire'
  return (
    <div
      role="alert"
      className={`flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 border ${className}`}
      style={{
        background: 'rgba(239,68,68,0.08)',
        borderColor: 'rgba(239,68,68,0.25)',
        color: isProprio ? 'var(--p-text)' : undefined,
      }}
    >
      <p className={`text-xs font-semibold ${isProprio ? '' : 'text-text-dark'}`}>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex-shrink-0 text-xs font-bold underline"
          style={{ color: 'var(--c-danger)' }}
        >
          Réessayer
        </button>
      )}
    </div>
  )
}
