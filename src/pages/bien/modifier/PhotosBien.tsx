import { useRef, useState } from 'react'
import { biensApi } from '../../../api/biensApi'
import { useToast } from '../../../context/useToast'
import { useConfirm } from '../../../shared/dialogues/useConfirm'
import { useGestionEnvois } from '../../../shared/uploads/useGestionEnvois'
import { apiMessage } from '../../../utils/apiMessage'
import type { Photo } from '../../../types/api'

const PHOTOS_MAX = 8

/**
 * Lot 5 — photos d'un bien existant : photo principale, suppression (confirmée) et ajout.
 * Les ajouts passent par le gestionnaire d'envois (arrière-plan, reprise après rechargement).
 * Le minimum de photos d'un bien publié est garanti par l'API.
 */
export default function PhotosBien({ bienId, photos, setPhotos, min, libelle, lien }: {
  bienId: number
  photos: Photo[]
  setPhotos: (p: Photo[]) => void
  min: number
  libelle: string
  lien: string
}) {
  const toast = useToast()
  const { confirmer } = useConfirm()
  const { demarrer } = useGestionEnvois()
  const [occupe, setOccupe] = useState<number | null>(null)
  const entree = useRef<HTMLInputElement>(null)
  const place = Math.max(0, PHOTOS_MAX - photos.length)

  const couverture = async (p: Photo) => {
    setOccupe(p.id)
    try {
      await biensApi.definirCouverture(bienId, p.id)
      setPhotos(photos.map(x => ({ ...x, is_cover: x.id === p.id })))
      toast('Photo principale mise à jour.', 'success')
    } catch (err) {
      toast(apiMessage(err) ?? 'La photo principale n’a pas pu être changée.', 'error')
    } finally {
      setOccupe(null)
    }
  }

  const supprimer = async (p: Photo) => {
    const ok = await confirmer({ titre: 'Supprimer cette photo ?', message: 'Elle sera retirée de l’annonce.', confirmer: 'Supprimer', danger: true })
    if (!ok) return
    setOccupe(p.id)
    try {
      await biensApi.supprimerPhoto(bienId, p.id)
      setPhotos(photos.filter(x => x.id !== p.id))
      toast('Photo supprimée.', 'success')
    } catch (err) {
      toast(apiMessage(err) ?? 'La photo n’a pas pu être supprimée.', 'error')
    } finally {
      setOccupe(null)
    }
  }

  const ajouter = (liste: FileList | null) => {
    const images = Array.from(liste ?? []).filter(f => f.type.startsWith('image/'))
    if (!images.length) return
    if (images.length > place) toast(`${PHOTOS_MAX} photos au maximum : les suivantes sont ignorées.`, 'error')
    const retenues = images.slice(0, place)
    if (!retenues.length) return
    demarrer({ bienId, libelle, lien, photos: retenues, video: null })
    toast('Envoi des photos en arrière-plan : elles apparaîtront ici une fois reçues.', 'info')
    if (entree.current) entree.current.value = ''
  }

  return (
    <section aria-labelledby="photos-bien-titre" className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="photos-bien-titre" className="text-sm font-bold text-[var(--p-text)]">Photos</h2>
        <span className={`text-xs ${photos.length < min ? 'text-[var(--tx-red)]' : 'text-[var(--p-muted)]'}`}>
          {photos.length}/{PHOTOS_MAX} · {min} au minimum
        </span>
      </div>
      {photos.length === 0 ? (
        <p className="text-sm text-[var(--p-muted)]">Aucune photo pour l’instant.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {photos.map(p => (
            <li key={p.id} className="overflow-hidden rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)]">
              <img src={p.thumbnail_url || p.url} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                {p.is_cover
                  ? <span className="text-xs font-semibold text-[var(--p-accent-text)]">Principale</span>
                  : <button type="button" disabled={occupe !== null} onClick={() => void couverture(p)} className="text-xs font-semibold text-[var(--p-text)] underline disabled:opacity-50">Mettre en principale</button>}
                <button type="button" disabled={occupe !== null} onClick={() => void supprimer(p)} aria-label="Supprimer la photo"
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-[var(--tx-red)] disabled:opacity-50">Supprimer</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[var(--p-border)] px-4 py-2.5 text-sm font-semibold text-[var(--p-text)] ${place ? '' : 'pointer-events-none opacity-50'}`}>
        <input ref={entree} type="file" accept="image/*" multiple className="sr-only" disabled={!place} onChange={e => ajouter(e.target.files)} />
        Ajouter des photos
      </label>
    </section>
  )
}
