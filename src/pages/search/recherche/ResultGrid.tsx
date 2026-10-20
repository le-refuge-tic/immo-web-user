import BienCard from '../../../components/BienCard'
import Reveal from '../../../components/Reveal'
import type { Tokens } from './tokens'

/* ══════════════════════════════════════════════════════════════
   ResultGrid
   ══════════════════════════════════════════════════════════════ */
type ResultGridProps = {
  biens: any[]; loading: boolean; favIds: Set<number>; isDark: boolean; tk: Tokens
  onFavToggle: (id: number, added: boolean) => void; cols: string
  distanceFor?: (bien: any) => number | null
}

export default function ResultGrid({ biens, loading, favIds, onFavToggle, cols, distanceFor, isDark, tk }: ResultGridProps) {
  if (loading) return (
    <div className={`grid ${cols} gap-3`} aria-busy="true" aria-label="Chargement des annonces…">
      {[1, 2, 3, 4, 5, 6].map(n => (
        <div key={n} className="skeleton rounded-2xl h-56" aria-hidden="true" />
      ))}
    </div>
  )

  if (biens.length === 0) return (
    <Reveal animation="anim-fade-in" className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
          style={{ color: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.20)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <p className="font-bold text-sm" style={{ color: tk.textClr }}>Aucun résultat</p>
      <p className="text-xs mt-1 max-w-xs" style={{ color: tk.labelClr }}>
        Aucun bien ne correspond à vos critères. Essayez d'élargir la recherche.
      </p>
    </Reveal>
  )

  return (
    <div className={`grid ${cols} gap-3`}>
      {biens.map((b, i) => (
        <Reveal key={b.id} animation="anim-scale-in" delay={Math.min(i * 50, 300)} className="card-lift">
          <BienCard bien={b} favoriteIds={favIds} onFavoriteToggle={onFavToggle} distanceKm={distanceFor?.(b) ?? null} />
        </Reveal>
      ))}
    </div>
  )
}
