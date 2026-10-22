import { useState } from 'react'
import type { RefObject } from 'react'
import { BUDGET_PRESETS, TRANSACTIONS, TYPES } from './constants'
import { PinIcon, SearchIcon, XIcon } from './icons'
import { panelColors, type Tokens } from './tokens'
import type { HomeSearch } from './useHomeSearch'

interface SearchPanelProps {
  s: HomeSearch
  isDark: boolean
  tk: Tokens
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  searchPanelRef: RefObject<HTMLDivElement | null>
}

/** Panneau de recherche flottant du hero desktop (replié en bouton, déplié en formulaire). */
export default function SearchPanel({ s, isDark, tk, searchOpen, setSearchOpen, searchPanelRef }: SearchPanelProps) {
  const {
    search, setSearch, showSuggest, setShowSuggest, suggestions, goToSearch,
    transaction, setTransaction, type, setType, prixMin, setPrixMin, prixMax, setPrixMax,
  } = s
  const [hoveredSuggestIdx, setHoveredSuggestIdx] = useState<number | null>(null)
  const {
    panelBg, panelBdr, panelSep, closeBg, closeClr, suggestBg, suggestBdr, suggestRow, suggestHov,
    panelPillActive, panelPillIdle,
  } = panelColors(isDark, tk)

  return (
    <div ref={searchPanelRef} className="absolute z-[4] left-8 top-24 w-[min(22rem,calc(100%-4rem))] lg:left-auto lg:right-10 xl:right-20 lg:top-1/2 lg:-translate-y-1/2 lg:w-80">
      {!searchOpen ? (
        <button onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.99]"
          style={{
            background: isDark ? 'rgba(10,10,22,0.70)' : 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: isDark ? '1px solid rgba(75,107,255,0.45)' : '1px solid rgba(255,255,255,0.45)',
            boxShadow: isDark
              ? '0 0 0 1px rgba(75,107,255,0.15), 0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)'
              : '0 8px 32px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.50)',
          }}
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,var(--c-brand),var(--c-violet))', boxShadow: '0 4px 12px rgba(75,107,255,0.45)' }}>
            <SearchIcon />
          </span>
          <div className="flex-1 min-w-0 text-left">
            <p className="font-semibold text-sm truncate text-white">
              {search.trim() || 'Rechercher un bien…'}
            </p>
            <p className="text-caption text-white/55 truncate">
              {[
                transaction && (transaction === 'location' ? 'Location' : 'Vente'),
                type && TYPES.find(t => t.key === type)?.label,
                prixMin && !prixMax && `≥ ${Number(prixMin).toLocaleString('fr-FR')} F`,
                prixMax && !prixMin && `≤ ${Number(prixMax).toLocaleString('fr-FR')} F`,
                prixMin && prixMax && `${Number(prixMin).toLocaleString('fr-FR')}–${Number(prixMax).toLocaleString('fr-FR')} F`,
              ].filter(Boolean).join(' · ') || 'Tous types · Partout au Bénin'}
            </p>
          </div>
          {(search || transaction || type || prixMin || prixMax) && (
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-micro font-bold text-white"
              style={{ background: 'var(--c-brand)' }}>
              {[search, transaction, type, prixMin, prixMax].filter(Boolean).length}
            </span>
          )}
          <svg className="w-4 h-4 flex-shrink-0 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ) : (
        <div className="w-full rounded-2xl overflow-visible anim-scale-in origin-top-right"
          style={{
            background: panelBg,
            backdropFilter: 'blur(56px) saturate(200%)',
            WebkitBackdropFilter: 'blur(56px) saturate(200%)',
            border: `1px solid ${panelBdr}`,
            boxShadow: isDark
              ? '0 0 0 1px rgba(75,107,255,0.10), 0 32px 80px rgba(0,0,0,0.55)'
              : '0 0 0 1px rgba(75,107,255,0.08), 0 24px 64px rgba(0,0,0,0.18)',
          }}
        >
          <div className="px-4 pt-4 pb-3 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${panelSep}` }}>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg"
                style={{ background: 'linear-gradient(135deg,var(--c-brand),var(--c-violet))' }}>
                <SearchIcon />
              </span>
              <span className="font-semibold text-sm" style={{ color: tk.textPrimary }}>Recherche</span>
            </div>
            <button onClick={() => setSearchOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{ background: closeBg, color: closeClr }}>
              <XIcon />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* Localisation */}
            <div className="relative">
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                style={{ background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}` }}>
                <span style={{ color: 'var(--tx-blue)' }}><PinIcon /></span>
                {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- le champ de recherche s'affiche à la demande de l'utilisateur */}
                <input autoFocus value={search}
                  onChange={e => { setSearch(e.target.value); setShowSuggest(true) }}
                  onFocus={() => setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                  onKeyDown={e => { if (e.key === 'Enter') { goToSearch(); setSearchOpen(false) } }}
                  placeholder="Ville ou quartier…"
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm"
                  style={{ color: tk.textPrimary }} />
                {search && (
                  <button onClick={() => setSearch('')} style={{ color: tk.textMuted }}><XIcon /></button>
                )}
              </div>
              {showSuggest && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-xl overflow-hidden"
                  style={{ background: suggestBg, border: `1px solid ${suggestBdr}`, boxShadow: '0 16px 48px rgba(0,0,0,0.22)' }}>
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

            {/* Opération */}
            <div>
              <p className="text-micro font-bold uppercase tracking-wide mb-2" style={{ color: tk.textMuted }}>Opération</p>
              <div className="flex gap-2">
                {TRANSACTIONS.map(t => (
                  <button key={t.key} onClick={() => setTransaction(t.key)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={transaction === t.key ? panelPillActive : panelPillIdle}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <p className="text-micro font-bold uppercase tracking-wide mb-2" style={{ color: tk.textMuted }}>Type de bien</p>
              <div className="flex flex-wrap gap-1.5">
                {TYPES.slice(0, 5).map(t => (
                  <button key={t.key} onClick={() => setType(t.key)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={type === t.key ? panelPillActive : panelPillIdle}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <p className="text-micro font-bold uppercase tracking-wide mb-2" style={{ color: tk.textMuted }}>Budget (FCFA)</p>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {BUDGET_PRESETS.map(p => {
                  const active = prixMax === String(p.max)
                  return (
                    <button key={p.label}
                      onClick={() => { setPrixMin(''); setPrixMax(active ? '' : String(p.max)) }}
                      className="px-2.5 py-1 rounded-lg text-caption font-semibold transition-all"
                      style={active ? panelPillActive : panelPillIdle}>
                      {p.label}
                    </button>
                  )
                })}
              </div>
              {/* Champs min / max */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl min-w-0" style={{ flex: 1, background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}` }}>
                  <input type="number" min={0} value={prixMin}
                    onChange={e => { setPrixMin(e.target.value); if (e.target.value) setPrixMax('') }}
                    placeholder="Minimum"
                    className="w-full bg-transparent outline-none text-xs"
                    style={{ color: tk.textPrimary }} />
                </div>
                <span className="text-sm flex-shrink-0" style={{ color: tk.textMuted }}>—</span>
                <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl min-w-0" style={{ flex: 1, background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}` }}>
                  <input type="number" min={0} value={prixMax}
                    onChange={e => setPrixMax(e.target.value)}
                    placeholder="Maximum"
                    className="w-full bg-transparent outline-none text-xs"
                    style={{ color: tk.textPrimary }} />
                </div>
              </div>
              {(prixMin || prixMax) && (
                <button onClick={() => { setPrixMin(''); setPrixMax('') }}
                  className="mt-1.5 text-caption font-semibold transition-opacity hover:opacity-70"
                  style={{ color: 'var(--tx-blue)' }}>
                  Effacer le budget
                </button>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={() => { goToSearch(); setSearchOpen(false) }}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'var(--c-accent)', color: 'var(--c-ink-navy)', boxShadow: '0 4px 20px rgba(255,107,53,0.40)' }}
            >
              <SearchIcon />Trouver mon logement
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
