import BienCard from '../../../components/BienCard'
import type { Bien } from '../../../types/api'
import type { Tokens } from './tokens'

/**
 * Lot 9 — « Récemment ajoutés » sur téléphone et tablette (jusqu'à `lg`) : cartes larges qui
 * défilent horizontalement, une et un peu plus à l'écran sur téléphone, deux sur tablette.
 */
export default function RecentMobile({ biens, favIds, onFavoriteToggle, tk }: {
  biens: Bien[]
  favIds: Set<number>
  onFavoriteToggle: (id: number, added: boolean) => void
  tk: Tokens
}) {
  if (biens.length === 0) return null
  return (
    <section aria-labelledby="recents-mobile-titre" className="lg:hidden mb-6">
      <h2 id="recents-mobile-titre" className="text-base md:text-lg font-bold mb-3" style={{ color: tk.textPrimary }}>
        Récemment ajoutés
      </h2>
      <div role="region" aria-label="Biens récemment ajoutés" tabIndex={0}
        className="-mx-4 md:-mx-6 px-4 md:px-6 flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory scroll-px-4 md:scroll-px-6">
        {biens.map(bien => (
          <div key={bien.id} className="flex-shrink-0 snap-start w-[82%] sm:w-[60%] md:w-[calc(50%-8px)]">
            <BienCard bien={bien} favoriteIds={favIds} onFavoriteToggle={onFavoriteToggle} showPhotoCount showAddedDate />
          </div>
        ))}
      </div>
    </section>
  )
}
