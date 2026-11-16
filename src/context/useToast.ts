import { createContext, useContext } from 'react'

export type TonToast = 'success' | 'error' | 'info'
export type AfficherToast = (message: string, ton?: TonToast) => void

export const ContexteToast = createContext<AfficherToast>(() => {})

/** Message bref en bas de l'écran (au-dessus de la barre de navigation mobile). */
export const useToast = (): AfficherToast => useContext(ContexteToast)
