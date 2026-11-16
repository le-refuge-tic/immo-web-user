import { createContext, useContext } from 'react'

export type Theme = 'light' | 'dark'
export type ThemePreference = Theme | 'system'

export interface ThemeContextValue {
  /** Thème réellement appliqué (après résolution de « system »). */
  theme: Theme
  /** Choix de l'utilisateur, réglable uniquement depuis Paramètres → Apparence. */
  preference: ThemePreference
  setPreference: (p: ThemePreference) => void
}

export const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', preference: 'system', setPreference: () => {} })

export const useTheme = () => useContext(ThemeContext)
