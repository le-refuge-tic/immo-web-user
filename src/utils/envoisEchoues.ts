/**
 * Message de l'écran de confirmation quand des fichiers n'ont pas pu être envoyés après la création
 * du bien ; null quand tout est parti.
 */
export function messageEnvoisEchoues(nbPhotos: number, video: boolean): string | null {
  const total = nbPhotos + (video ? 1 : 0)
  if (total === 0) return null
  const quoi = [
    nbPhotos > 0 && `${nbPhotos} photo${nbPhotos > 1 ? 's' : ''}`,
    video && 'la vidéo',
  ].filter(Boolean).join(' et ')
  const pluriel = total > 1
  return `${quoi.charAt(0).toUpperCase()}${quoi.slice(1)} n'${pluriel ? 'ont' : 'a'} pas pu être envoyée${pluriel ? 's' : ''}. Le bien est enregistré : réessayez l'envoi maintenant.`
}
