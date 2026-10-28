import { useNavigate } from 'react-router-dom'
import type { Tokens } from './tokens'

const capitalizeQuartier = (q: string) => q.charAt(0).toUpperCase() + q.slice(1)

/**
 * Nombre de quartiers à partir duquel le bandeau défile. En dessous, chaque rangée serait plus
 * étroite que l'écran : la boucle laisserait des vides et les pastilles sortiraient de l'écran.
 */
export const SEUIL_DEFILEMENT = 8

interface LocationsMarqueeProps {
  quartiersActifs: string[]
  quartierCounts: Record<string, number>
  isDark: boolean
  tk: Tokens
}

/** Bandeau des quartiers disposant d'annonces : défile s'il y en a beaucoup, sinon pastilles fixes. */
export default function LocationsMarquee({ quartiersActifs, quartierCounts, isDark, tk }: LocationsMarqueeProps) {
  const navigate = useNavigate()
  const defile = quartiersActifs.length >= SEUIL_DEFILEMENT

  const pastille = (q: string, cle: string) => (
    <button key={cle}
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
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--c-brand)', opacity: 0.7 }} />
      <span className="text-sm font-semibold whitespace-nowrap" style={{ color: tk.textPrimary }}>
        {capitalizeQuartier(q)}
      </span>
      <span className="text-caption font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
        style={{ background: 'rgba(75,107,255,0.12)', color: 'var(--tx-blue)' }}>
        {quartierCounts[q]}
      </span>
    </button>
  )

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
      {defile ? (
        <div className="space-y-3 overflow-hidden" data-testid="quartiers-defilants">
          {[0, 1].map(row => {
            const half  = Math.ceil(quartiersActifs.length / 2)
            const items = quartiersActifs.slice(row * half, row * half + half)
            const dir   = row === 0 ? 'scroll-ltr' : 'scroll-rtl'
            return (
              <div key={row} className={`flex gap-3 ${dir}`} style={{ width: 'max-content' }}>
                {[...items, ...items].map((q, i) => pastille(q, `${q}-${i}`))}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="px-5 md:px-12 flex flex-wrap gap-3" data-testid="quartiers-fixes">
          {quartiersActifs.map(q => pastille(q, q))}
        </div>
      )}
    </div>
  )
}
