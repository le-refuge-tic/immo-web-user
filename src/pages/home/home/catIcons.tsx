import type { ReactNode } from 'react'
import { LayersIcon, HomeIcon, BuildingIcon, LandscapeIcon, VillaIcon, PartyIcon } from './icons'

/** Icônes des filtres de type (clés de FILTRES_TYPE, src/shared/biens). */
export const CAT_ICONS: Record<string, ReactNode> = {
  '':            <LayersIcon />,
  'maison':      <HomeIcon />,
  'appartement': <BuildingIcon />,
  'chambre_salon': <BuildingIcon />,
  'commerce':    <BuildingIcon />,
  'terrain':     <LandscapeIcon />,
  'guesthouse':  <VillaIcon />,
  'salle_fete':  <PartyIcon />,
}
