import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

const ScrollContext = createContext({ scrolled: false, setScrolled: (_: boolean) => {} })

export function ScrollProvider({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false)
  return <ScrollContext.Provider value={{ scrolled, setScrolled }}>{children}</ScrollContext.Provider>
}

export const useScrolled = () => useContext(ScrollContext)
