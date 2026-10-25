import { SORTS } from './options'
import { SortAscIcon, SortDescIcon, SortRelevanceIcon } from './icons'
import type { Tokens } from './tokens'

const SORT_ICONS: Record<string, React.ReactNode> = {
  pertinence: <SortRelevanceIcon />,
  prix_asc:   <SortAscIcon />,
  prix_desc:  <SortDescIcon />,
}

/* ══════════════════════════════════════════════════════════════
   ResultHeader — tri avec icônes directionnelles
   ══════════════════════════════════════════════════════════════ */
type ResultHeaderProps = {
  count: number; loading: boolean; hasFilters: boolean; reset: () => void; inline?: boolean
  sortBy: 'pertinence' | 'prix_asc' | 'prix_desc'; setSortBy: (v: 'pertinence' | 'prix_asc' | 'prix_desc') => void
  tk: Tokens
}

export default function ResultHeader({ count, loading, hasFilters, reset, inline, sortBy, setSortBy, tk }: ResultHeaderProps) {
  if (loading) return (
    <div className={inline ? 'flex items-center' : 'mb-3'}>
      <div className="w-32 h-4 rounded-lg skeleton" />
    </div>
  )
  return (
    <div className={`flex items-center gap-2 flex-wrap ${inline ? '' : 'mb-4'}`}>
      <h2 className="sr-only">Résultats de la recherche</h2>
      <p className="text-sm font-medium" style={{ color: tk.labelClr }}>
        <strong style={{ color: tk.textClr }} className="font-bold">{count}</strong>{' '}
        résultat{count !== 1 ? 's' : ''}
        {hasFilters && ` trouvé${count !== 1 ? 's' : ''}`}
      </p>
      {hasFilters && count === 0 && (
        <button onClick={reset} className="text-xs font-semibold underline" style={{ color: 'var(--tx-blue)' }}>
          Effacer les filtres
        </button>
      )}

      {/* Tri */}
      <div className="ml-auto flex items-center gap-1 rounded-xl p-1"
        style={{ background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}` }}>
        {SORTS.map(s => {
          const active = sortBy === s.key
          return (
            <button key={s.key}
              onClick={() => setSortBy(s.key)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all"
              style={active ? tk.pillActive : { color: tk.labelClr }}
              title={s.label}
              aria-label={s.label}
            >
              {SORT_ICONS[s.key]}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
