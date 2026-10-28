import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { clearMediaDraft, loadMediaDraft, mediaDraftGeneration, saveMediaDraft, type MediaDraft } from '../utils/mediaDraft'

/** « avec 2 photos et la vidéo » : ce que le brouillon a rendu, pour le bandeau de restauration. */
export function resumeMedias(m: MediaDraft): string {
  const n = m.photos.length
  const photos = n > 0 ? `${n} photo${n > 1 ? 's' : ''}` : ''
  const video = m.video ? 'la vidéo' : ''
  return [photos, video].filter(Boolean).join(' et ')
}

/**
 * Photos et vidéo du brouillon d'annonce (FE-B-002) : restaurées au montage si l'état est vide,
 * puis enregistrées à chaque changement. Les écritures sont mises en file : une écriture lente
 * ne peut ni passer après une plus récente, ni faire revenir un brouillon effacé.
 */
export function useMediaDraft(
  initialKey: string,
  photos: File[],
  video: File | null,
  setPhotos: Dispatch<SetStateAction<File[]>>,
  setVideo: Dispatch<SetStateAction<File | null>>,
) {
  // Clé figée au premier rendu, comme useFormDraft : changer de clé en cours de saisie
  // effacerait le brouillon qu'on s'apprête à restaurer.
  const [key] = useState(initialKey)
  const [restored, setRestored] = useState<MediaDraft | null>(null)
  const [pret, setPret] = useState(false)
  const efface = useRef(false)
  const photosRef = useRef(photos)
  const videoRef = useRef(video)
  useEffect(() => { photosRef.current = photos; videoRef.current = video }, [photos, video])
  const file = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    let actif = true
    void loadMediaDraft(key).then(m => {
      if (!actif) return
      // Ce que la personne a déjà choisi pendant la lecture l'emporte sur le brouillon :
      // le bandeau n'annonce que ce qui a réellement été restauré.
      if (m && photosRef.current.length === 0 && !videoRef.current) {
        setPhotos(m.photos)
        setVideo(m.video)
        setRestored(m)
      }
      setPret(true)
    })
    return () => { actif = false }
  }, [key, setPhotos, setVideo])

  useEffect(() => {
    // Avant la lecture, une écriture effacerait le brouillon qu'on s'apprête à restaurer.
    if (!pret || efface.current) return
    const gen = mediaDraftGeneration()
    file.current = file.current.then(() => (efface.current ? undefined : saveMediaDraft(key, { photos, video }, gen)))
  }, [key, pret, photos, video])

  const clear = useCallback((): Promise<void> => {
    efface.current = true
    file.current = file.current.then(() => clearMediaDraft(key))
    return file.current
  }, [key])

  return { restored, clear }
}
