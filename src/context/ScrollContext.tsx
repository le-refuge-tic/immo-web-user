import { useState } from 'react'
import type { ReactNode } from 'react'
import { ScrollContext } from './useScrolled'

export function ScrollProvider({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false)
  return <ScrollContext.Provider value={{ scrolled, setScrolled }}>{children}</ScrollContext.Provider>
}
