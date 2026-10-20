import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../../utils/usePageTitle'
import LoadMoreBar from '../../components/LoadMoreBar'
import { useSearchPage } from './recherche/useSearchPage'
import SuggestDropdown from './recherche/SuggestDropdown'
import FilterPanel from './recherche/FilterPanel'
import ResultHeader from './recherche/ResultHeader'
import GuidedResults from './recherche/GuidedResults'
import { PinIcon, XIcon, BackIcon, FilterIcon, ClearIcon } from './recherche/icons'

/* ══════════════════════════════════════════════════════════════
   Composant principal
   ══════════════════════════════════════════════════════════════ */
export default function SearchPage() {
  usePageTitle('Rechercher un logement', 'Maisons, appartements et terrains à louer ou à vendre au Bénin : filtrez par ville, quartier, type et budget.')
  const navigate = useNavigate()
  const {
    tk, isDark, query, setQuery, showSuggest, setShowSuggest, suggestions, pickSuggestion,
    mobileOpen, setMobileOpen, sidebarRef, chips, hasFilters, reset, fp,
    results, loading, fetchError, sortBy, setSortBy, sharedResults, onFavToggle,
    allBiens, total, loadingMore, loadMoreError, localFiltersActive, loadMore,
  } = useSearchPage()

  return (
    <div className="min-h-full">

      {/* ══════════════ MOBILE ══════════════ */}
      <div className="lg:hidden overflow-x-hidden">

        {/* Header sticky : top-0 sur téléphone (pas de barre en haut), top-[72px] dès que la TopNav fixe est visible */}
        <div className="sticky top-0 md:top-[72px] z-30 px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] md:pt-3 pb-3"
          style={{
            background: tk.headerBg,
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderBottom: `1px solid ${tk.headerBdr}`,
          }}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <button onClick={() => navigate(-1)}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl transition-all"
              style={{ background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}`, color: tk.textClr }}
              aria-label="Retour"
            >
              <BackIcon />
            </button>

            <div className="flex-1 relative">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
                style={{ background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}`, color: tk.textClr }}
              >
                <span style={{ color: tk.labelClr }}><PinIcon /></span>
                <input
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowSuggest(true) }}
                  onFocus={() => setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                  placeholder="Ville ou quartier…"
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm"
                  style={{ color: tk.textClr }}
                />
                {query && (
                  <button onClick={() => setQuery('')} style={{ color: tk.labelClr }}>
                    <ClearIcon />
                  </button>
                )}
              </div>
              {suggestions.length > 0 && showSuggest && (
                <SuggestDropdown suggestions={suggestions} onPick={pickSuggestion} tk={tk} />
              )}
            </div>

            <button
              onClick={() => setMobileOpen(o => !o)}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl relative transition-all"
              aria-label="Filtres"
              style={hasFilters ? tk.pillActive : { background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}`, color: tk.textClr }}
            >
              <FilterIcon />
              {hasFilters && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-micro font-bold text-white flex items-center justify-center"
                  style={{ background: '#4160F2' }}>
                  {chips.length}
                </span>
              )}
            </button>
          </div>

          {chips.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pr-2 scrollbar-hide">
              {chips.map(chip => (
                <button key={chip.label} onClick={chip.onRemove}
                  className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={tk.chipStyle}
                >
                  {chip.label}<XIcon />
                </button>
              ))}
              <button onClick={reset} className="flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full" style={{ color: tk.labelClr }}>
                Tout effacer
              </button>
            </div>
          )}
        </div>

        {mobileOpen && (
          <div className="px-4 pb-4 pt-4 border-b anim-fade-down overflow-hidden"
            style={{
              background: isDark ? 'rgba(16,16,26,0.99)' : 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(40px)',
              borderColor: tk.sidebarBdr,
            }}
          >
            <FilterPanel {...fp} />
          </div>
        )}

        <div className="px-4 md:px-6 py-4">
          <h1 className="sr-only">Recherche avancée</h1>
          <ResultHeader
            count={results.length} loading={loading} hasFilters={hasFilters} reset={reset}
            sortBy={sortBy} setSortBy={setSortBy} tk={tk}
          />
          <GuidedResults {...sharedResults} onFavToggle={onFavToggle} cols="grid-cols-1 sm:grid-cols-2 md:grid-cols-3" />
          {!loading && !fetchError && <LoadMoreBar loaded={allBiens.length} total={total} loading={loadingMore} error={loadMoreError} localFilters={localFiltersActive} onLoadMore={loadMore} />}
        </div>
      </div>

      {/* ══════════════ DESKTOP ══════════════ */}
      <div className="hidden lg:flex min-h-full">

        {/* Sidebar filtres */}
        <aside
          ref={sidebarRef}
          className="w-[280px] xl:w-[300px] flex-shrink-0 sticky top-[72px] self-start h-[calc(100vh-72px)] overflow-y-auto scrollbar-auto"
          style={{
            background: tk.sidebarBg,
            backdropFilter: 'blur(48px)',
            WebkitBackdropFilter: 'blur(48px)',
            borderRight: `1px solid ${tk.sidebarBdr}`,
          }}
        >
          {/* En-tête sidebar sticky */}
          <div className="sticky top-0 z-10 px-5 pt-5 pb-3"
            style={{
              background: tk.sidebarBg,
              backdropFilter: 'blur(48px)',
              WebkitBackdropFilter: 'blur(48px)',
              borderBottom: `1px solid ${tk.divider}`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(75,107,255,0.14)', color: 'var(--tx-blue)' }}>
                  <FilterIcon />
                </div>
                <h2 className="font-bold text-sm" style={{ color: tk.textClr }}>Filtres</h2>
              </div>
              {hasFilters && (
                <button onClick={reset}
                  className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-all"
                  style={{ color: 'var(--tx-blue)', background: 'rgba(75,107,255,0.10)' }}>
                  <ClearIcon />Effacer
                </button>
              )}
            </div>

            {/* Chips filtres actifs */}
            {chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-1">
                {chips.map(chip => (
                  <button key={chip.label} onClick={chip.onRemove}
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                    style={tk.chipStyle}
                  >
                    {chip.label}<XIcon />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-5">
            {/* Localisation */}
            <div className="mb-4">
              <label htmlFor="filtre-localisation" className="block text-caption font-bold uppercase tracking-wider mb-2" style={{ color: tk.labelClr }}>
                Localisation
              </label>
              <div className="relative">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
                  style={{ background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}` }}>
                  <span style={{ color: tk.labelClr }}><PinIcon /></span>
                  <input id="filtre-localisation"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setShowSuggest(true) }}
                    onFocus={() => setShowSuggest(true)}
                    onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                    placeholder="Cotonou, Adovié, Akpakpa…"
                    className="flex-1 min-w-0 bg-transparent outline-none text-sm"
                    style={{ color: tk.textClr }}
                  />
                  {query && (
                    <button onClick={() => setQuery('')} style={{ color: tk.labelClr }}>
                      <ClearIcon />
                    </button>
                  )}
                </div>
                {suggestions.length > 0 && showSuggest && (
                  <SuggestDropdown suggestions={suggestions} onPick={pickSuggestion} tk={tk} />
                )}
              </div>
            </div>

            <div className="h-px mb-4" style={{ background: tk.divider }} />

            <FilterPanel {...fp} />
          </div>
        </aside>

        {/* Zone résultats */}
        <div className="flex-1 px-6 py-5 min-w-0">
          <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold" style={{ color: tk.textClr }}>Recherche avancée</h1>
              <p className="text-xs mt-0.5" style={{ color: tk.labelClr }}>Tous les biens disponibles au Bénin</p>
            </div>
            <ResultHeader
              count={results.length} loading={loading} hasFilters={hasFilters} reset={reset}
              sortBy={sortBy} setSortBy={setSortBy} inline tk={tk}
            />
          </div>

          <GuidedResults {...sharedResults} onFavToggle={onFavToggle} cols="grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
          {!loading && !fetchError && <LoadMoreBar loaded={allBiens.length} total={total} loading={loadingMore} error={loadMoreError} localFilters={localFiltersActive} onLoadMore={loadMore} />}
        </div>
      </div>
    </div>
  )
}
