import BienCard from '../../../components/BienCard'
import CarouselPauseToggle from '../../../components/CarouselPauseToggle'
import type { CarouselAutoplay } from '../../../hooks/useCarouselAutoplay'
import type { Bien } from '../../../types/api'
import type { Tokens } from './tokens'

interface RecentCarouselProps {
  biens: Bien[]
  carousel: CarouselAutoplay<HTMLDivElement>
  favIds: Set<number>
  onFavoriteToggle: (id: number, added: boolean) => void
  isDark: boolean
  tk: Tokens
  /** Classe de padding haut du bloc (espacement différent selon le carrousel). */
  topPaddingClass: string
  title: string
  description: string
  /** Couleur du titre. */
  titleColor: string
  /** Libellé accessible de la région défilante. */
  regionLabel: string
  /** Sujet annoncé par le bouton pause. */
  pauseSubject: string
  /** Couleur transmise au bouton pause (défaut du composant si absente). */
  pauseColor?: string
  /** Couleur de l'indicateur actif. */
  dotActive: string
  /** Couleur des indicateurs inactifs selon le thème. */
  dotIdleDark: string
  dotIdleLight: string
}

/** Carrousel desktop des derniers biens ajoutés (location ou vente). */
export default function RecentCarousel({
  biens, carousel, favIds, onFavoriteToggle, isDark, tk, topPaddingClass, title, description,
  titleColor, regionLabel, pauseSubject, pauseColor, dotActive, dotIdleDark, dotIdleLight,
}: RecentCarouselProps) {
  const { ref, index, setIndex, paused, togglePause, autoplayAvailable, containerProps } = carousel
  if (biens.length === 0) return null

  return (
    <div className={`hidden md:block w-full px-8 lg:px-16 ${topPaddingClass} pb-4`}>
      <div className="max-w-3xl mx-auto text-center mb-8">
        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: titleColor }}>
          {title}
        </h2>
        <p className="text-sm leading-relaxed mt-3" style={{ color: tk.textSecond }}>
          {description}
        </p>
      </div>
      <div ref={ref} role="region" aria-label={regionLabel} tabIndex={0}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
        {...containerProps}>
        {biens.map(bien => (
          <div key={bien.id} className="flex-shrink-0 snap-start w-[calc(33.333%-11px)] min-w-[260px]">
            <BienCard bien={bien} favoriteIds={favIds} onFavoriteToggle={onFavoriteToggle} showPhotoCount showAddedDate />
          </div>
        ))}
      </div>
      {biens.length > 3 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          {autoplayAvailable && <CarouselPauseToggle paused={paused} onToggle={togglePause} subject={pauseSubject} color={pauseColor} />}
          {biens.map((_, i) => (
            <button key={i} aria-label={`Afficher le bien ${i + 1} sur ${biens.length}`} aria-current={index === i}
              onClick={() => { const el = ref.current; if (!el) return; const w = el.scrollWidth / biens.length; el.scrollTo({ left: w * i, behavior: 'smooth' }); setIndex(i) }}
              style={{ width: index === i ? 20 : 8, height: 8, borderRadius: 4, background: index === i ? dotActive : isDark ? dotIdleDark : dotIdleLight, transition: 'all 0.3s ease', border: 'none', cursor: 'pointer', padding: 0 }} />
          ))}
        </div>
      )}
    </div>
  )
}
