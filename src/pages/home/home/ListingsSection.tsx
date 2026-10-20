import { useState } from 'react'
import BienCard from '../../../components/BienCard'
import ErrorState from '../../../components/ErrorState'
import Reveal from '../../../components/Reveal'
import { CATEGORIES, TYPES } from './constants'
import { CAT_ICONS } from './catIcons'
import { FilterIcon } from './icons'
import MobileFilters from './MobileFilters'
import type { Bien } from '../../../types/api'
import type { Tokens } from './tokens'
import type { HomeSearch } from './useHomeSearch'

interface ListingsSectionProps {
  s: HomeSearch
  isDark: boolean
  tk: Tokens
  displayedBiens: Bien[]
  loading: boolean
  loadError: boolean
  loadBiens: () => void
  favIds: Set<number>
  onFavoriteToggle: (id: number, added: boolean) => void
}

/** Pastilles de catégories, filtres mobiles, titre et grille des annonces. */
export default function ListingsSection({
  s, isDark, tk, displayedBiens, loading, loadError, loadBiens, favIds, onFavoriteToggle,
}: ListingsSectionProps) {
  const { transaction, setTransaction, type, setType, prixMin, prixMax, goToSearch } = s
  const [showFilters, setShowFilters] = useState(false)

  const activeCat = CATEGORIES.find(c => c.transaction === transaction && c.type === type)
  const combinedLabel = [transaction && (transaction === 'location' ? 'À louer' : 'À vendre'), TYPES.find(t => t.key === type)?.label]
    .filter(Boolean).join(' · ')
  const catLabel = activeCat?.label ?? (combinedLabel || 'Annonces')

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-16 py-6 md:py-8">

      {/* Pills catégories */}
      <Reveal animation="anim-slide-left" className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 md:mb-6 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button key={cat.key}
            onClick={() => { setTransaction(cat.transaction); setType(cat.type) }}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all pill-hover"
            style={transaction === cat.transaction && type === cat.type ? tk.pillActive : tk.pillIdle}
          >
            {CAT_ICONS[cat.key]}
            <span>{cat.label}</span>
          </button>
        ))}
        <button
          onClick={() => setShowFilters(s => !s)}
          className="md:hidden flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all pill-hover"
          style={showFilters || prixMin || prixMax ? tk.pillActive : tk.pillIdle}
        >
          <FilterIcon /><span>Filtres</span>
        </button>
      </Reveal>

      {showFilters && <MobileFilters s={s} isDark={isDark} tk={tk} />}

      {/* Titre section + Voir tout */}
      <Reveal animation="anim-fade-up" className="flex items-center justify-between mb-4">
        <h2 className="text-base md:text-lg font-bold" style={{ color: tk.textPrimary }}>
          {!transaction && !type ? 'Toutes les annonces' : catLabel}
          {displayedBiens.length > 0 && (
            <span className="font-normal text-sm ml-2" style={{ color: tk.textMuted }}>
              ({displayedBiens.length})
            </span>
          )}
        </h2>
        <button onClick={goToSearch} className="text-sm font-semibold" style={{ color: 'var(--tx-blue)' }}>
          Voir tout
        </button>
      </Reveal>

      {/* Grille */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4" aria-busy="true" aria-label="Chargement des annonces…">
          {[1,2,3,4,5,6,7,8].map(n => <div key={n} className="skeleton rounded-2xl h-52 md:h-64" aria-hidden="true" />)}
        </div>
      ) : loadError && displayedBiens.length === 0 ? (
        <ErrorState title="Impossible de charger les annonces" onRetry={loadBiens} />
      ) : displayedBiens.length === 0 ? (
        <Reveal animation="anim-fade-in" className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
            <svg className="w-8 h-8" style={{ color: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.20)' }}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <p className="font-bold text-sm" style={{ color: tk.textPrimary }}>Aucun bien trouvé</p>
          <p className="text-xs mt-1" style={{ color: tk.textMuted }}>Essayez de modifier vos filtres</p>
        </Reveal>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {displayedBiens.map((bien, idx) => (
            <Reveal key={bien.id} animation="anim-scale-in" delay={Math.min(idx * 60, 360)} className="card-lift">
              <BienCard bien={bien} favoriteIds={favIds} onFavoriteToggle={onFavoriteToggle} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  )
}
