import { useState } from 'react'
import Reveal from '../../../components/Reveal'
import { BUDGET_PRESETS, TRANSACTIONS, TYPES } from './constants'
import { PinIcon, XIcon } from './icons'
import { panelColors, type Tokens } from './tokens'
import type { HomeSearch } from './useHomeSearch'

interface MobileFiltersProps {
  s: HomeSearch
  isDark: boolean
  tk: Tokens
}

/** Panneau de filtres affiché sur mobile sous les pastilles de catégories. */
export default function MobileFilters({ s, isDark, tk }: MobileFiltersProps) {
  const {
    search, setSearch, showSuggest, setShowSuggest, suggestions,
    transaction, setTransaction, type, setType, prixMin, setPrixMin, prixMax, setPrixMax,
  } = s
  const [hoveredSuggestIdx, setHoveredSuggestIdx] = useState<number | null>(null)
  const { suggestBg, suggestBdr, suggestRow, suggestHov } = panelColors(isDark, tk)

  return (
    <Reveal animation="anim-fade-up" className="md:hidden rounded-2xl p-4 mb-4"
      style={{
        background: tk.cardBg,
        backdropFilter: 'blur(32px)',
        border: `1px solid ${tk.cardBdr}`,
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.30)' : '0 4px 20px rgba(0,0,0,0.07)',
      }}
    >
      {/* Ville ou quartier */}
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: tk.textMuted }}>Ville ou quartier</p>
        <div className="relative">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
            style={{ background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}` }}>
            <span style={{ color: tk.textMuted }}><PinIcon /></span>
            <input value={search}
              onChange={e => { setSearch(e.target.value); setShowSuggest(true) }}
              onFocus={() => setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
              placeholder="Ex: Cotonou, Adovié…"
              className="flex-1 min-w-0 bg-transparent outline-none text-sm"
              style={{ color: tk.textPrimary }} />
            {search && (
              <button onClick={() => setSearch('')} style={{ color: tk.textMuted }}><XIcon /></button>
            )}
          </div>
          {showSuggest && suggestions.length > 0 && (
            <div className="absolute z-30 mt-1 w-full rounded-xl overflow-hidden shadow-lg"
              style={{ background: suggestBg, border: `1px solid ${suggestBdr}` }}>
              {suggestions.map((q, i) => (
                <button key={`${q.nom}-${i}`} type="button"
                  onClick={() => { setSearch(q.nom); setShowSuggest(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 transition-all"
                  style={{ borderBottom: `1px solid ${suggestRow}`, color: tk.textPrimary, background: hoveredSuggestIdx === i ? suggestHov : 'transparent' }}
                  onMouseEnter={() => setHoveredSuggestIdx(i)}
                  onMouseLeave={() => setHoveredSuggestIdx(null)}
                >
                  <span className="font-medium">{q.nom}</span>
                  <span className="text-xs flex-shrink-0" style={{ color: tk.textMuted }}>{q.ville}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction */}
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: tk.textMuted }}>Transaction</p>
        <div className="flex gap-2">
          {TRANSACTIONS.map(t => (
            <button key={t.key} onClick={() => setTransaction(t.key)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={transaction === t.key ? tk.pillActive : tk.pillIdle}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type de bien */}
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: tk.textMuted }}>Type de bien</p>
        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setType(t.key)}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={type === t.key ? tk.pillActive : tk.pillIdle}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: tk.textMuted }}>Budget (FCFA)</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {BUDGET_PRESETS.map(p => {
            const active = prixMax === String(p.max)
            return (
              <button key={p.label}
                onClick={() => { setPrixMin(''); setPrixMax(active ? '' : String(p.max)) }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={active ? tk.pillActive : tk.pillIdle}>
                {p.label}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-3">
          <input type="number" min={0} value={prixMin} onChange={e => setPrixMin(e.target.value)}
            placeholder="Minimum"
            className="flex-1 min-w-0 rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}`, color: tk.textPrimary }} />
          <span className="text-sm flex-shrink-0" style={{ color: tk.textMuted }}>—</span>
          <input type="number" min={0} value={prixMax} onChange={e => setPrixMax(e.target.value)}
            placeholder="Maximum"
            className="flex-1 min-w-0 rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}`, color: tk.textPrimary }} />
          {(prixMin || prixMax) && (
            <button onClick={() => { setPrixMin(''); setPrixMax('') }}
              className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--tx-blue)' }}>
              Effacer
            </button>
          )}
        </div>
      </div>
    </Reveal>
  )
}
