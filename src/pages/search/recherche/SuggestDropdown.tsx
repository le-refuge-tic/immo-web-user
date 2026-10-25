import { useState } from 'react'
import type { Quartier } from '../../../data/quartiers'
import type { Tokens } from './tokens'

/* ── Dropdown suggestions ── */
export default function SuggestDropdown({ suggestions, onPick, tk }: {
  suggestions: Quartier[]; onPick: (q: Quartier) => void; tk: Tokens
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  return (
    <div className="absolute z-40 mt-1 w-full rounded-2xl overflow-hidden"
      style={{
        background: tk.suggestBg,
        border: `1px solid ${tk.suggestBdr}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        backdropFilter: 'blur(32px)',
      }}
    >
      {suggestions.map((q, i) => (
        <button key={`${q.nom}-${i}`} type="button" onClick={() => onPick(q)}
          className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors"
          style={{
            color: tk.textClr,
            borderBottom: i < suggestions.length - 1 ? `1px solid ${tk.suggestBdr}` : 'none',
            background: hoveredIdx === i ? tk.suggestHover : 'transparent',
          }}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <span className="font-semibold">{q.nom}</span>
          <span className="text-xs flex-shrink-0" style={{ color: tk.labelClr }}>{q.ville}</span>
        </button>
      ))}
    </div>
  )
}
