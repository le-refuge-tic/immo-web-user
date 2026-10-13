interface CarouselPauseToggleProps {
  paused: boolean
  onToggle: () => void
  /** Texte lu par les lecteurs d'écran, ex. « les annonces récentes ». */
  subject: string
  color?: string
}

/** Bouton pause / lecture d'un carrousel automatique (WCAG 2.2.2). */
export default function CarouselPauseToggle({ paused, onToggle, subject, color = '#4160F2' }: CarouselPauseToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={paused}
      aria-label={paused ? `Reprendre le défilement automatique : ${subject}` : `Mettre en pause le défilement automatique : ${subject}`}
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ background: `${color}1A`, color, outlineColor: color }}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
        {paused ? <path d="M8 5v14l11-7z" /> : <path d="M6 5h4v14H6zm8 0h4v14h-4z" />}
      </svg>
    </button>
  )
}
