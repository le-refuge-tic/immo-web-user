import { BUDGET_TOLERANCE, PROXIMITY_MAX_KM, AUTRES_PAGE_SIZE } from './options'
import ResultGrid from './ResultGrid'
import type { Bien } from '../../../types/api'
import type { Tokens } from './tokens'

type GuidedSearch = {
  mainResults: Bien[]; environs: Bien[]; environsLabel: string; environsDist: Map<number, number>
  budgetSimilar: Bien[]; autres: Bien[]; distFromQuartier: (bien: Bien) => number | null
  isProximityFallback: boolean; quartierRecherche: string | undefined
}

function SectionHeader({ title, subtitle, tk }: { title: string; subtitle?: string; tk: Tokens }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-bold" style={{ color: tk.textClr }}>{title}</h2>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: tk.labelClr }}>{subtitle}</p>}
    </div>
  )
}

function FallbackBanner({ quartier, isProximity, isDark }: { quartier: string; isProximity: boolean; isDark: boolean }) {
  return (
    <div className="rounded-2xl border-l-4 p-3.5 mb-2"
      style={{
        background: isDark ? 'rgba(245,158,11,0.08)' : '#FFF8E7',
        borderLeftColor: 'var(--c-amber-dark)',
      }}>
      <div className="flex items-start gap-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div>
          <p className="text-sm font-semibold" style={{ color: isDark ? '#FCD34D' : '#92400E' }}>
            Aucun bien disponible à « {quartier} »
          </p>
          <p className="text-xs mt-0.5" style={{ color: isDark ? '#FDE68A' : 'var(--c-amber-dark)' }}>
            {isProximity
              ? `Biens à moins de ${PROXIMITY_MAX_KM} km — triés par distance`
              : 'Voici les biens disponibles dans les environs'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function GuidedResults({
  search, loading, fetchError, retryFetch, favIds, onFavToggle, cols, showAllAutres, setShowAllAutres, mainDistanceFor, isDark, tk,
}: {
  search: GuidedSearch; loading: boolean; fetchError: boolean; retryFetch: () => void
  favIds: Set<number>; isDark: boolean; tk: Tokens
  onFavToggle: (id: number, added: boolean) => void; cols: string
  showAllAutres: boolean; setShowAllAutres: (v: boolean) => void
  mainDistanceFor?: (bien: Bien) => number | null
}) {
  if (loading) return <ResultGrid biens={[]} loading favIds={favIds} onFavToggle={onFavToggle} cols={cols} isDark={isDark} tk={tk} />

  if (fetchError) return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)' }}>
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
      </div>
      <p className="font-bold text-base mb-1" style={{ color: tk.textClr }}>Impossible de charger les biens</p>
      <p className="text-sm mb-5" style={{ color: tk.labelClr }}>Vérifiez votre connexion et réessayez.</p>
      <button onClick={retryFetch}
        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
        style={{ background: 'var(--c-brand)' }}>
        Réessayer
      </button>
    </div>
  )

  const { mainResults, environs, environsLabel, environsDist, budgetSimilar, autres, distFromQuartier, isProximityFallback, quartierRecherche } = search
  const hasMain      = mainResults.length > 0
  const nothingAtAll = !hasMain && environs.length === 0 && budgetSimilar.length === 0 && autres.length === 0
  const autresToShow = showAllAutres ? autres : autres.slice(0, AUTRES_PAGE_SIZE)
  const gridProps    = { loading: false, favIds, onFavToggle, isDark, tk }

  return (
    <div className="space-y-8">
      {hasMain ? (
        <ResultGrid biens={mainResults} {...gridProps} cols={cols} distanceFor={mainDistanceFor} />
      ) : nothingAtAll ? (
        <ResultGrid biens={[]} {...gridProps} cols={cols} />
      ) : quartierRecherche ? (
        <FallbackBanner quartier={quartierRecherche} isProximity={isProximityFallback} isDark={isDark} />
      ) : (
        <p className="text-sm" style={{ color: tk.labelClr }}>
          Aucun bien ne correspond exactement — voici ce qui s'en rapproche.
        </p>
      )}

      {environs.length > 0 && (
        <section>
          <SectionHeader title={environsLabel} subtitle={isProximityFallback ? 'Distances depuis le quartier recherché' : undefined} tk={tk} />
          <ResultGrid biens={environs} {...gridProps} cols={cols} distanceFor={b => environsDist.get(b.id) ?? distFromQuartier(b)} />
        </section>
      )}

      {budgetSimilar.length > 0 && (
        <section>
          <SectionHeader
            title="Légèrement hors budget"
            subtitle={`± ${BUDGET_TOLERANCE.toLocaleString('fr-FR')} FCFA${quartierRecherche ? ` depuis « ${quartierRecherche} »` : ''}`}
            tk={tk}
          />
          <ResultGrid biens={budgetSimilar} {...gridProps} cols={cols} distanceFor={distFromQuartier} />
        </section>
      )}

      {autres.length > 0 && (
        <section>
          <SectionHeader title="Autres biens disponibles" tk={tk} />
          <ResultGrid biens={autresToShow} {...gridProps} cols={cols} distanceFor={distFromQuartier} />
          {!showAllAutres && autres.length > AUTRES_PAGE_SIZE && (
            <button onClick={() => setShowAllAutres(true)}
              className="mt-4 w-full py-2.5 rounded-2xl text-sm font-semibold transition-all"
              style={{ border: `1px solid ${tk.sidebarBdr}`, color: tk.labelClr, background: tk.fieldBg }}>
              Voir {autres.length - AUTRES_PAGE_SIZE} autres biens
            </button>
          )}
        </section>
      )}
    </div>
  )
}
