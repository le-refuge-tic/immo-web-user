import { createContext, useContext } from 'react'

export type TonToast = 'success' | 'error' | 'info'
export type AfficherToast = (message: string, ton?: TonToast) => void

export const ContexteToast = createContext<AfficherToast>(() => {})

/** Message bref en bas de l'écran (au-dessus de la barre de navigation mobile). */
export const useToast = (): AfficherToast => useContext(ContexteToast)

/**
 * Zone de la pile de notifications du bas, fournie par ToastProvider : les autres
 * avis flottants (envoi des photos…) s'y rendent pour s'empiler avec les toasts au
 * lieu de se superposer. `null` hors du fournisseur.
 */
export const ContexteZoneNotifs = createContext<HTMLElement | null>(null)
export const useZoneNotifs = (): HTMLElement | null => useContext(ContexteZoneNotifs)
