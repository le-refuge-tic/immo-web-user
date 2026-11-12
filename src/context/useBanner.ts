import { createContext, useContext } from 'react'

export interface BannerData {
  id: number
  title: string
  message: string
  /** Route vers laquelle naviguer au tap (optionnel). */
  to?: string
  /** State React Router à passer lors de la navigation. */
  toState?: Record<string, unknown>
  /** Avatar : initiale + dégradé, ou icône. */
  initial?: string
  gradient?: string
  variant?: 'message' | 'notif'
}

export type BannerInput = Omit<BannerData, 'id'>

export interface BannerCtx {
  showBanner: (b: BannerInput) => void
}

export const BannerContext = createContext<BannerCtx>({ showBanner: () => {} })

export const useBanner = () => useContext(BannerContext)
