import { useId } from 'react'
import { useTheme } from '../context/ThemeContext'
import type { ThemePreference } from '../context/ThemeContext'

const MoonMenuIcon = () => (
  <svg className="w-5 h-5 text-text-grey flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
)

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light',  label: 'Clair'   },
  { value: 'dark',   label: 'Sombre'  },
  { value: 'system', label: 'Système' },
]

/**
 * Choix du thème (Clair / Sombre / Système). C'est le seul réglage de thème de
 * l'app : il apparaît dans les paramètres du Profil et des espaces par rôle.
 */
export default function AppearanceSetting({ className = 'px-4 py-3.5' }: { className?: string }) {
  const { preference, setPreference } = useTheme()
  const labelId = useId()
  return (
    <div className={className}>
      <div className="flex items-center gap-3.5 mb-3">
        <MoonMenuIcon />
        <span id={labelId} className="flex-1 text-sm text-text-dark font-medium">Apparence</span>
      </div>
      <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06]">
        {THEME_OPTIONS.map(o => {
          const selected = preference === o.value
          return (
            <button
              key={o.value}
              role="radio"
              aria-checked={selected}
              onClick={() => setPreference(o.value)}
              className={`py-2 rounded-lg text-[13px] font-semibold transition-all ${selected ? 'bg-white dark:bg-white/15 text-primary dark:text-white shadow-sm' : 'text-text-grey'}`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      {preference === 'system' && <p className="text-caption text-text-grey mt-2">Suit le réglage de votre téléphone ou ordinateur.</p>}
    </div>
  )
}

