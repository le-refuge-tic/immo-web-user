import { useState, useRef, useEffect } from 'react'
import { rechercherQuartiers, type Quartier } from '../data/quartiers'

type Props = {
  value: string
  onChange: (quartier: string) => void
  onSelect?: (q: Quartier) => void
  onBlur?: () => void
  ville?: 'Cotonou' | 'Abomey-Calavi'
  placeholder?: string
  className?: string
}

/**
 * Champ "quartier" avec suggestions (Cotonou / Abomey-Calavi).
 * La saisie reste libre : si le quartier tapé n'est pas dans la liste,
 * la valeur est quand même acceptée (pas de blocage).
 */
export default function QuartierPicker({ value, onChange, onSelect, onBlur, ville, placeholder, className }: Props) {
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<Quartier[]>([])
  const boxRef = useRef<HTMLDivElement>(null)
  const justPickedRef = useRef(false)

  useEffect(() => {
    setSuggestions(value.trim().length >= 1 ? rechercherQuartiers(value, ville) : [])
  }, [value, ville])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const pick = (q: Quartier) => {
    justPickedRef.current = true
    onChange(q.nom)
    onSelect?.(q)
    setOpen(false)
  }

  return (
    <div className="relative" ref={boxRef}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            setOpen(false)
            if (justPickedRef.current) { justPickedRef.current = false; return }
            onBlur?.()
          }, 150)
        }}
        placeholder={placeholder ?? 'Ex: Cadjèhoun, Godomey…'}
        className={className ?? 'w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary'}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-divider shadow-lg max-h-56 overflow-y-auto">
          {suggestions.map((q, i) => (
            <button
              key={`${q.ville}-${q.nom}-${i}`}
              type="button"
              onClick={() => pick(q)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-g border-b border-divider last:border-b-0 flex items-center justify-between gap-2"
            >
              <span className="text-text-dark font-medium">{q.nom}</span>
              <span className="text-text-grey text-xs flex-shrink-0">{q.arrondissement} · {q.ville}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
