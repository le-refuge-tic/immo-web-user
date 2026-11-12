import { createContext, useContext } from 'react'

export const ScrollContext = createContext({ scrolled: false, setScrolled: (_: boolean) => {} })

export const useScrolled = () => useContext(ScrollContext)
