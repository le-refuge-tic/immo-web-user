import type { ReactNode } from 'react'
import { LayersIcon, HomeIcon, BuildingIcon, LandscapeIcon, VillaIcon } from './icons'

export const CAT_ICONS: Record<string, ReactNode> = {
  'Tous':        <LayersIcon />,
  'maison':      <HomeIcon />,
  'appartement': <BuildingIcon />,
  'terrain':     <LandscapeIcon />,
  'guesthouse':  <VillaIcon />,
}
