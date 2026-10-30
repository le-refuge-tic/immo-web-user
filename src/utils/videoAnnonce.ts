/** Taille maximale d'une vidéo d'annonce, alignée sur la limite du backend (POST /biens/:id/video). */
export const TAILLE_MAX_VIDEO_MO = 30

/** Message d'erreur si la vidéo choisie ne sera pas acceptée par le serveur, sinon null. */
export function erreurVideo(fichier: Pick<File, 'type' | 'size'>): string | null {
  if (fichier.type !== 'video/mp4') return 'Seules les vidéos MP4 sont acceptées.'
  if (fichier.size > TAILLE_MAX_VIDEO_MO * 1024 * 1024) {
    return `La vidéo dépasse ${TAILLE_MAX_VIDEO_MO} Mo : choisissez une vidéo plus courte ou compressée.`
  }
  return null
}
