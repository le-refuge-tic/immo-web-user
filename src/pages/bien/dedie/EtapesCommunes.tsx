import { useEffect, useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import QuartierPicker from '../../../components/QuartierPicker'
import { Card, Section } from '../nouveau-bien/ui'
import { erreurVideo, TAILLE_MAX_VIDEO_MO } from '../../../utils/videoAnnonce'
import type { ChampsIdentite, ChampsLocalisation } from '../../../shared/biens/formulaires/guesthouse'
import { Libelle, Texte } from './champs'

type Maj<T> = (patch: Partial<T>) => void

/**
 * Identité de l'annonce. Le bloc « Propriétaire » est celui du compte connecté : prérempli et
 * en lecture seule (le commercial, lui, le saisit).
 */
export function EtapeIdentite({ form, maj, libelleNom, placeholderNom, placeholderDescription }: {
  form: ChampsIdentite; maj: Maj<ChampsIdentite>; libelleNom: string; placeholderNom: string; placeholderDescription: string
}) {
  const telephoneManquant = !form.proprioTelephone.trim()
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Section title="L’annonce" required />
        <div className="flex flex-col gap-4">
          <div>
            <Libelle htmlFor="dedie-nom">{libelleNom}</Libelle>
            <Texte id="dedie-nom" value={form.nom} onChange={v => maj({ nom: v })} placeholder={placeholderNom} maxLength={100} />
          </div>
          <div>
            <Libelle htmlFor="dedie-desc">Description</Libelle>
            <Texte id="dedie-desc" value={form.description} onChange={v => maj({ description: v })} placeholder={placeholderDescription} lignes={4} maxLength={1800} />
          </div>
        </div>
      </Card>
      <Card>
        <Section title="Propriétaire" />
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-[var(--p-muted)]">Nom</dt>
          <dd className="font-semibold text-[var(--p-text)]">{[form.proprioPrenom, form.proprioNom].filter(Boolean).join(' ') || '—'}</dd>
          <dt className="text-[var(--p-muted)]">Téléphone</dt>
          <dd className="font-semibold text-[var(--p-text)]">{form.proprioTelephone || '—'}</dd>
          {form.proprioEmail && <><dt className="text-[var(--p-muted)]">E-mail</dt><dd className="text-[var(--p-text)]">{form.proprioEmail}</dd></>}
        </dl>
        <p className="mt-3 text-xs text-[var(--p-muted)]">
          Coordonnées de votre compte. {telephoneManquant
            ? <span className="font-semibold text-[var(--tx-red)]">Ajoutez votre téléphone dans <Link to="/profil" className="underline">votre profil</Link> pour publier.</span>
            : <>Pour les modifier, passez par <Link to="/profil" className="underline">votre profil</Link>.</>}
        </p>
      </Card>
    </div>
  )
}

export function EtapeLocalisation({ form, maj }: { form: ChampsLocalisation; maj: Maj<ChampsLocalisation> }) {
  return (
    <Card>
      <Section title="Localisation" required />
      <div className="flex flex-col gap-4">
        <div>
          <Libelle htmlFor="dedie-quartier">Quartier</Libelle>
          <QuartierPicker id="dedie-quartier" value={form.quartier}
            onChange={q => maj({ quartier: q, latitude: null, longitude: null })}
            onSelect={q => maj({ quartier: q.nom, arrondissement: q.arrondissement, ville: q.ville })} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Libelle htmlFor="dedie-ville">Ville</Libelle>
            <Texte id="dedie-ville" value={form.ville} onChange={v => maj({ ville: v })} placeholder="Cotonou" maxLength={100} />
          </div>
          <div>
            <Libelle htmlFor="dedie-arr" facultatif>Arrondissement</Libelle>
            <Texte id="dedie-arr" value={form.arrondissement} onChange={v => maj({ arrondissement: v })} maxLength={100} />
          </div>
        </div>
        <div>
          <Libelle htmlFor="dedie-repere" facultatif>Repère d’accès</Libelle>
          <Texte id="dedie-repere" value={form.repere} onChange={v => maj({ repere: v })} placeholder="Ex. Derrière la station, portail bleu" maxLength={150} />
        </div>
      </div>
    </Card>
  )
}

/** Photos (la première sert de couverture) et vidéo, puis le récapitulatif. */
export function EtapeMedias({ photos, setPhotos, video, setVideo, min, max, conseil, signaler, recap }: {
  photos: File[]; setPhotos: (p: File[]) => void; video: File | null; setVideo: (v: File | null) => void
  min: number; max: number; conseil: string; signaler: (m: string) => void; recap: ReactNode
}) {
  const apercus = useMemo(() => photos.map(f => URL.createObjectURL(f)), [photos])
  useEffect(() => () => apercus.forEach(u => URL.revokeObjectURL(u)), [apercus])

  const ajouter = (liste: FileList | null) => {
    const images = Array.from(liste ?? []).filter(f => f.type.startsWith('image/'))
    const suivantes = [...photos, ...images].slice(0, max)
    if (photos.length + images.length > max) signaler(`${max} photos au maximum : les suivantes sont ignorées.`)
    setPhotos(suivantes)
  }
  const deplacer = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= photos.length) return
    const copie = [...photos];
    [copie[i], copie[j]] = [copie[j], copie[i]]
    setPhotos(copie)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Section title={`Photos (au moins ${min})`} required />
        <p className="mb-3 text-xs text-[var(--p-muted)]">{conseil} La première photo sert de couverture.</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((f, i) => (
            <figure key={`${f.name}-${f.size}-${i}`} className="relative overflow-hidden rounded-xl border border-[var(--p-border)]">
              <img src={apercus[i]} alt={i === 0 ? 'Couverture de l’annonce' : `Vue ${i + 1} de l’annonce`} className="aspect-square w-full object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">Couverture</span>}
              <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
                <button type="button" aria-label={`Avancer la photo ${i + 1}`} onClick={() => deplacer(i, -1)} disabled={i === 0}
                  className="rounded-md bg-black/60 px-1.5 text-xs text-white disabled:opacity-30">←</button>
                <button type="button" aria-label={`Retirer la photo ${i + 1}`} onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                  className="rounded-md bg-black/60 px-1.5 text-xs text-white">✕</button>
                <button type="button" aria-label={`Reculer la photo ${i + 1}`} onClick={() => deplacer(i, 1)} disabled={i === photos.length - 1}
                  className="rounded-md bg-black/60 px-1.5 text-xs text-white disabled:opacity-30">→</button>
              </div>
            </figure>
          ))}
          {photos.length < max && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--p-border)] text-xs font-semibold text-[var(--p-muted)] hover:border-primary">
              <span className="text-2xl">+</span>Ajouter
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={e => { ajouter(e.target.files); e.target.value = '' }} />
            </label>
          )}
        </div>
        <p className={`mt-2 text-xs ${photos.length < min ? 'font-semibold text-[var(--tx-red)]' : 'text-[var(--p-muted)]'}`}>
          {photos.length}/{max} photo{photos.length > 1 ? 's' : ''}{photos.length < min ? ` — il en faut au moins ${min}` : ''}
        </p>
      </Card>
      <Card>
        <Section title="Vidéo (facultatif)" />
        <p className="mb-2 text-xs text-[var(--p-muted)]">Une vidéo MP4, {TAILLE_MAX_VIDEO_MO} Mo au plus.</p>
        {video
          ? <div className="flex items-center justify-between gap-2 text-sm text-[var(--p-text)]"><span className="truncate">{video.name}</span>
              <button type="button" onClick={() => setVideo(null)} className="text-xs font-bold text-[var(--tx-red)]">Retirer</button></div>
          : <input type="file" accept="video/mp4" aria-label="Choisir une vidéo" className="text-sm text-[var(--p-muted)]"
              onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; const err = erreurVideo(f); if (err) signaler(err); else setVideo(f) }} />}
      </Card>
      {recap}
    </div>
  )
}

/** Récapitulatif par sections, totaux mis en valeur, champs manquants listés. */
export function Recapitulatif({ sections, totaux, manques, allerA }: {
  sections: { titre: string; etape: number; lignes: string[] }[]
  totaux: ReactNode
  manques: { etape: number; libelle: string; champs: string[] }[]
  allerA: (etape: number) => void
}) {
  const aCompleter = manques.filter(m => m.champs.length)
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-bold text-[var(--p-text)]">Récapitulatif</h2>
      {aCompleter.length > 0 && (
        <div role="alert" className="rounded-2xl border border-[var(--tx-red)] p-3 text-sm">
          <strong className="text-[var(--tx-red)]">À compléter avant l’envoi</strong>
          <ul className="mt-1 list-disc pl-5 text-[var(--p-text)]">
            {aCompleter.map(m => (
              <li key={m.etape}>{m.libelle} : {m.champs.join(', ')}{' '}
                <button type="button" onClick={() => allerA(m.etape)} className="font-bold text-[var(--p-accent-text)]">Compléter</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {totaux}
      {sections.map(s => (
        <section key={s.titre} aria-label={s.titre} className="rounded-2xl border border-[var(--p-border)] bg-[var(--p-card)] p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--p-muted)]">{s.titre}</h3>
            <button type="button" onClick={() => allerA(s.etape)} aria-label={`Modifier : ${s.titre}`} className="text-xs font-bold text-[var(--p-accent-text)]">Modifier</button>
          </div>
          {s.lignes.length
            ? <ul className="mt-1 list-disc pl-5 text-sm leading-relaxed text-[var(--p-text)]">{s.lignes.map(l => <li key={l}>{l}</li>)}</ul>
            : <p className="mt-1 text-sm text-[var(--p-muted)]">Rien de renseigné.</p>}
        </section>
      ))}
    </div>
  )
}
