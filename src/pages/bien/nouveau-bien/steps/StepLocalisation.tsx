

import { VILLES_AVEC_QUARTIERS } from '../../../../data/quartiers'

import { BLUE, baseInputStyle } from '../options'
import { Card } from '../ui'
import type { NouveauBienForm } from '../useNouveauBienForm'

export function StepLocalisation({ form }: { form: NouveauBienForm }) {
  const {
    hoveredQuartierIdx,
    setHoveredQuartierIdx,
    ville,
    quartier,
    arrondissement,
    indicationAdresse,
    setIndicationAdresse,
    quartierSearch,
    setQuartierSearch,
    quartierInputFocused,
    setQuartierInputFocused,
    filteredQuartiers,
    selectQuartier,
    clearQuartier,
  } = form
  return (
      <Card>
        <div className="space-y-4">
          {/* Quartier — recherche inline dark-themed */}
          <div>
            <label htmlFor="nouveau-bien-quartier" className="text-caption font-bold uppercase tracking-[0.14em] mb-2 block" style={{ color: 'var(--p-muted)' }}>
              Quartier
            </label>
            <p className="text-xs mb-2" style={{ color: 'var(--p-muted)' }}>
              La liste couvre {VILLES_AVEC_QUARTIERS.join(' et ')}. Un quartier absent de la liste peut être saisi librement.
            </p>
            {quartier ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                style={{ background: 'rgba(72,199,116,0.09)', borderColor: 'rgba(72,199,116,0.45)' }}>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ color: 'var(--c-green-soft)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--c-green-soft)' }}>
                  {quartier}{arrondissement ? `, ${arrondissement}` : ''}{ville ? `, ${ville}` : ''}
                </span>
                <button type="button" onClick={clearQuartier}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(72,199,116,0.2)', color: 'var(--c-green-soft)' }}>✕</button>
              </div>
            ) : (
              <div className="relative">
                <input
                  id="nouveau-bien-quartier"
                  type="text"
                  value={quartierSearch}
                  onChange={e => setQuartierSearch(e.target.value)}
                  onFocus={() => setQuartierInputFocused(true)}
                  onBlur={() => setQuartierInputFocused(false)}
                  placeholder="Rechercher un quartier…"
                  className="w-full rounded-xl pl-9 pr-4 py-3 text-sm outline-none border transition-colors"
                  style={baseInputStyle}
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--p-muted)' }}>
                  <circle cx={11} cy={11} r={8} /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                </svg>
                {quartierInputFocused && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border overflow-auto z-20"
                    style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)', maxHeight: 260 }}>
                    {filteredQuartiers.length === 0 ? (
                      quartierSearch.trim() ? (
                        <button type="button"
                          onMouseDown={() => selectQuartier(quartierSearch.trim(), null, null)}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold">
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: BLUE }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                          </svg>
                          <span style={{ color: BLUE }}>Utiliser « {quartierSearch.trim()} » comme quartier</span>
                        </button>
                      ) : (
                        <p className="px-4 py-3 text-sm" style={{ color: 'var(--p-muted)' }}>Commencez à taper…</p>
                      )
                    ) : filteredQuartiers.map((q, qi) => (
                      <button key={q.nom + q.arrondissement} type="button"
                        onMouseDown={() => selectQuartier(q.nom, q.arrondissement, q.ville)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm border-b transition-colors"
                        style={{ borderColor: 'var(--p-border)', color: 'var(--p-text)', background: hoveredQuartierIdx === qi ? 'var(--p-surface)' : 'transparent' }}
                        onMouseEnter={() => setHoveredQuartierIdx(qi)}
                        onMouseLeave={() => setHoveredQuartierIdx(null)}>
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--p-muted)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="flex-1">{q.nom}</span>
                        <span className="text-caption" style={{ color: 'var(--p-muted)' }}>{q.arrondissement}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="nouveau-bien-page-907" className="text-caption font-bold uppercase tracking-[0.14em] mb-2 block" style={{ color: 'var(--p-muted)' }}>
              Indication précise <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optionnel)</span>
            </label>
            <input id="nouveau-bien-page-907" value={indicationAdresse} onChange={e => setIndicationAdresse(e.target.value)}
              placeholder="Ex: Derrière le CEG, à 200m du goudron..."
              className="w-full rounded-xl px-4 py-3 text-sm outline-none border transition-colors"
              style={baseInputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--p-border)')} />
          </div>
        </div>
      </Card>
  )
}
