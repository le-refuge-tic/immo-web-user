import { useFavoriBien } from '../hooks/useFavoris'

/**
 * Lot 12 — bouton favori de la fiche d'un bien. `rond` : pastille sur la photo ; `barre` : bouton
 * carré à côté de l'action principale de la barre du bas (mobile).
 */
export function BoutonFavori({ bien, variante }: { bien: { id: number; type?: string }; variante: 'rond' | 'barre' }) {
  const { estFavori, enCours, basculer } = useFavoriBien(bien)
  const taille = variante === 'rond' ? 'w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm' : 'w-[54px] h-[54px] flex-shrink-0 rounded-xl border-2 border-divider'
  return (
    <button
      type="button"
      onClick={() => void basculer()}
      disabled={enCours}
      aria-pressed={estFavori}
      aria-label={estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={`${taille} flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-60`}
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={estFavori ? 'var(--c-brand)' : 'none'}
        stroke={estFavori ? 'var(--c-brand)' : variante === 'rond' ? '#fff' : 'currentColor'} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  )
}
