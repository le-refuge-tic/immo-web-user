import type { Photo } from '../types/api'

/** Largeur des vignettes créées par le backend au téléversement (FE-D-002). */
export const LARGEUR_VIGNETTE = 480

/** Attributs d'une image de couverture dans une liste : vignette si elle existe, original en haute densité. */
export interface ImageCouverture {
  src: string
  srcSet?: string
  sizes?: string
}

/**
 * Photo de couverture d'un bien pour les listes (FE-D-002) : la photo marquée
 * couverture, sinon la première. Avec une vignette, l'image chargée par défaut
 * est la vignette (480 px, quelques dizaines de Ko) et `srcSet` laisse le
 * navigateur choisir l'original sur un écran large ou à haute densité ; sans
 * vignette (photos antérieures), l'original.
 *
 * @param resoudre transforme une URL relative du backend en URL absolue
 * @param sizes largeur affichée de l'image, au format de l'attribut `sizes`
 */
export function imageDeCouverture(
  photos: Photo[] | null | undefined,
  resoudre: (url: string) => string = url => url,
  sizes = '(max-width: 640px) 50vw, 320px',
): ImageCouverture | null {
  const cover = photos?.find(p => p.is_cover) || photos?.[0]
  if (!cover?.url) return null
  const original = resoudre(cover.url)
  if (!cover.thumbnail_url) return { src: original }
  const vignette = resoudre(cover.thumbnail_url)
  return { src: vignette, srcSet: `${vignette} ${LARGEUR_VIGNETTE}w, ${original} 1600w`, sizes }
}
