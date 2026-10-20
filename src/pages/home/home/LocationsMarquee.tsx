import { useNavigate } from 'react-router-dom'
import type { Tokens } from './tokens'

const capitalizeQuartier = (q: string) => q.charAt(0).toUpperCase() + q.slice(1)

interface LocationsMarqueeProps {
  quartiersActifs: string[]
  quartierCounts: Record<string, number>
  isDark: boolean
  tk: Tokens
}

/** Bandeau défilant des quartiers disposant d'annonces. */
export default function LocationsMarquee({ quartiersActifs, quartierCounts, isDark, tk }: LocationsMarqueeProps) {
  const navigate = useNavigate()

  return (
    <div className="w-full py-8 md:py-10 overflow-hidden"
      style={{
        background: tk.sectionBg,
        borderTop: `1px solid ${tk.sectionBdr}`,
        borderBottom: `1px solid ${tk.sectionBdr}`,
      }}
    >
      <div className="px-5 md:px-12 mb-5 flex items-end gap-3">
        <h2 className="font-bold text-lg md:text-xl" style={{ color: tk.textPrimary }}>Emplacements</h2>
        <span className="text-sm mb-0.5" style={{ color: tk.textMuted }}>
          {quartiersActifs.length} quartier{quartiersActifs.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-3 overflow-hidden">
        {[0, 1].map(row => {
          const half  = Math.ceil(quartiersActifs.length / 2)
          const items = quartiersActifs.slice(row * half, row * half + half)
          const dir   = row === 0 ? 'scroll-ltr' : 'scroll-rtl'
          return (
            <div key={row} className={`flex gap-3 ${dir}`} style={{ width: 'max-content' }}>
              {[...items, ...items].map((q, i) => {
                const count = quartierCounts[q]
                return (
                  <button key={`${q}-${i}`}
                    onClick={() => navigate(`/search?q=${encodeURIComponent(q)}`)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.88)',
                      backdropFilter: 'blur(12px)',
                      border: isDark ? '1px solid rgba(75,107,255,0.20)' : '1px solid rgba(75,107,255,0.15)',
                      boxShadow: isDark
                        ? 'inset 0 1px 0 rgba(255,255,255,0.06)'
                        : '0 2px 12px rgba(75,107,255,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
                    }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#4160F2', opacity: 0.7 }} />
                    <span className="text-sm font-semibold whitespace-nowrap" style={{ color: tk.textPrimary }}>
                      {capitalizeQuartier(q)}
                    </span>
                    <span className="text-caption font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(75,107,255,0.12)', color: 'var(--tx-blue)' }}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
