import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
export type ThemePreference = Theme | 'system'

interface ThemeContextValue {
  /** Thème réellement appliqué (après résolution de « system »). */
  theme: Theme
  /** Choix de l'utilisateur, réglable uniquement depuis Paramètres → Apparence. */
  preference: ThemePreference
  setPreference: (p: ThemePreference) => void
}

const STORAGE_KEY = 'rg_theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', preference: 'system', setPreference: () => {} })

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved
  } catch { /* stockage indisponible (navigation privée) */ }
  return 'system'
}

const systemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference)
  const [system, setSystem] = useState<Theme>(systemTheme)

  // Suit le réglage de l'appareil tant que la préférence est « system »
  useEffect(() => {
    const mq = window.matchMedia?.(DARK_QUERY)
    if (!mq) return
    const onChange = () => setSystem(mq.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const theme: Theme = preference === 'system' ? system : preference

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
  }, [theme])

  const setPreference = (p: ThemePreference) => {
    setPreferenceState(p)
    try { localStorage.setItem(STORAGE_KEY, p) } catch { /* ignore */ }
  }

  return <ThemeContext.Provider value={{ theme, preference, setPreference }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
