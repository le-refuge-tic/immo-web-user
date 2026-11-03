

import { BLUE, TYPES_BIEN, EQUIPEMENTS_RESIDENTIEL, EQUIPEMENTS_BOUTIQUE, ALENTOURS_OPTS, parsePrix, formatFcfa } from '../options'
import { Card, RecapSection } from '../ui'
import type { NouveauBienForm } from '../useNouveauBienForm'
import { withAlpha } from '../../../../utils/color'
import { erreurVideo, TAILLE_MAX_VIDEO_MO } from '../../../../utils/videoAnnonce'
import { useState } from 'react'

export function StepPhotos({ form }: { form: NouveauBienForm }) {
  const {
    submitting,
    photos,
    setPhotos,
    video,
    setVideo,
    uploadProgress,
    hoveredDropzone,
    setHoveredDropzone,
    typeBien,
    typeTransaction,
    prix,
    etatMeubleMaison,
    etatConstructionMaison,
    sanitaire,
    finition,
    ville,
    quartier,
    arrondissement,
    indicationAdresse,
    typeCuisine,
    typeCour,
    avanceMois,
    loyerPrepayeMois,
    cautionEau,
    cautionElec,
    electricite,
    eau,
    equipementsBonus,
    alentours,
    disponibilite,
    disponibleA,
    description,
    autresFrais,
    isTerrain,
    nbPieces,
    showPieces,
    chambres,
    salons,
    isBoutique,
    isMeuble,
    montantBrut,
    labelFinition,
    labelSanitaire,
    labelCuisine,
    labelCour,
    labelElec,
    labelEau,
  } = form
  const [videoErreur, setVideoErreur] = useState<string | null>(null)
  return (
      <div className="space-y-4">

        {/* ── Récapitulatif ── */}
        <Card>
          <p className="text-sm font-bold mb-4" style={{ color: 'var(--p-text)' }}>Récapitulatif de votre annonce</p>

          <RecapSection title="Type de bien" items={[
            TYPES_BIEN.find(t => t.key === typeBien)?.label ?? typeBien,
            ...(finition ? [labelFinition(finition)] : []),
            ...(sanitaire ? [labelSanitaire(sanitaire)] : []),
            ...(isMeuble ? ['Meublé'] : []),
            ...(typeBien === 'maison' ? [
              etatMeubleMaison === 'non_meuble' ? 'Maison non meublée' :
              etatMeubleMaison === 'semi_meuble' ? 'Maison semi-meublée' : 'Maison meublée',
              etatConstructionMaison === 'semi_construite' ? 'Maison semi-construite' :
              etatConstructionMaison === 'totalement_construite' ? 'Maison totalement construite' : '',
            ].filter(Boolean) : []),
          ]} />

          <RecapSection title="Localisation" items={[
            ...(quartier ? [`Quartier : ${quartier}`] : []),
            ...(arrondissement ? [`Arrondissement : ${arrondissement}`] : []),
            ...(ville ? [`Ville : ${ville}`] : []),
            ...(indicationAdresse.trim() ? [`Adresse : ${indicationAdresse.trim()}`] : []),
          ]} />

          {nbPieces > 0 && (
            <RecapSection title="Pièces" items={[
              showPieces
                ? `${nbPieces} pièce${nbPieces > 1 ? 's' : ''} : ${chambres} chambre${chambres > 1 ? 's' : ''} + ${salons} salon${salons > 1 ? 's' : ''}`
                : '1 pièce',
            ]} />
          )}

          {!isTerrain && (parsePrix(prix) ?? 0) > 0 && (
            <RecapSection title="Prix" items={[
              `${typeTransaction === 'location' ? 'Loyer mensuel' : 'Prix de vente'} : ${formatFcfa(parsePrix(prix) ?? 0)}`
            ]} />
          )}

          {!isTerrain && !isBoutique && typeTransaction === 'location' && (
            <>
              <RecapSection title="Conditions d'entrée" items={[
                avanceMois > 0
                  ? `Avance : ${avanceMois} mois × ${formatFcfa(parsePrix(prix) ?? 0)} = ${formatFcfa((parsePrix(prix) ?? 0) * avanceMois)}`
                  : 'Avance : Aucune',
                ...(loyerPrepayeMois > 0 ? [`Loyer prépayé : ${loyerPrepayeMois} mois`] : []),
                ...((parsePrix(cautionEau) ?? 0) > 0 ? [`Caution eau : ${formatFcfa(parsePrix(cautionEau) ?? 0)}`] : []),
                ...((parsePrix(cautionElec) ?? 0) > 0 ? [`Caution électricité : ${formatFcfa(parsePrix(cautionElec) ?? 0)}`] : []),
              ]} />
              {montantBrut > 0 && (
                <div className="rounded-xl p-3.5 mb-2" style={{ background: withAlpha(BLUE, '12'), border: `1px solid ${withAlpha(BLUE, '30')}` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--p-muted)' }}>Montant minimum à verser avant intégration</p>
                  <p className="text-xl font-bold" style={{ color: BLUE }}>{formatFcfa(montantBrut)}</p>
                </div>
              )}
            </>
          )}

          {!isTerrain && !isBoutique && (
            <RecapSection title="Confort" items={[
              `Cuisine : ${labelCuisine(typeCuisine)}`,
              `Accès / Cour : ${labelCour(typeCour)}`,
              `Électricité : ${labelElec(electricite)}`,
              `Eau : ${labelEau(eau)}`,
            ]} />
          )}

          {equipementsBonus.length > 0 && (
            <RecapSection title="Équipements" items={equipementsBonus.map(e =>
              (EQUIPEMENTS_RESIDENTIEL.find(o => o.value === e) ?? EQUIPEMENTS_BOUTIQUE.find(o => o.value === e))?.label ?? e
            )} />
          )}
          {alentours.length > 0 && (
            <RecapSection title="À proximité" items={alentours.map(a => ALENTOURS_OPTS.find(o => o.value === a)?.label ?? a)} />
          )}
          {!isTerrain && (
            <RecapSection title="Disponibilité" items={[
              disponibilite === 'immediate' ? 'Disponible immédiatement'
                : disponibleA ? `Disponible à partir du ${disponibleA.split('-').reverse().join('/')}`
                : 'En finition — Bientôt disponible'
            ]} />
          )}
          {autresFrais.filter(f => parsePrix(f.prix) !== undefined).length > 0 && (
            <RecapSection title="Autres frais" items={autresFrais
              .filter(f => parsePrix(f.prix) !== undefined)
              .map(f => `${f.label.trim() || 'Autre frais'} : ${formatFcfa(parsePrix(f.prix)!)}`)} />
          )}
          {description.trim() && (
            <RecapSection title="Notes" items={[description.trim()]} />
          )}
        </Card>

        {/* ── Photos ── */}
        <Card>
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--p-text)' }}>Photos du bien</p>
          <p className="text-xs mb-4" style={{ color: 'var(--p-muted)' }}>
            Maximum 5 photos (PNG, JPEG, WEBP) — les photos augmentent les visites de 3×
          </p>

          {photos.length < 5 && (
            // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- zone de dépôt : le glisser-déposer s'ajoute au champ fichier, qui reste utilisable au clavier
            <label className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors"
              style={{ borderColor: hoveredDropzone === 'photos' ? BLUE : 'var(--p-border)' }}
              onMouseEnter={() => setHoveredDropzone('photos')}
              onMouseLeave={() => setHoveredDropzone(null)}>
              <div className="flex justify-center mb-3">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
                  style={{ color: 'var(--p-muted)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>Choisir des photos</p>
              <p className="text-xs mt-1" style={{ color: 'var(--p-muted)' }}>JPG, PNG, WEBP (max 5 photos)</p>
              <input type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={e => {
                  const files = Array.from(e.target.files || []).slice(0, 5 - photos.length)
                  setPhotos(p => [...p, ...files].slice(0, 5))
                }} />
            </label>
          )}

          {photos.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {photos.map((f, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover rounded-xl" />
                    <button aria-label="Retirer la photo" type="button" onClick={() => setPhotos(p => p.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full text-white flex items-center justify-center">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-caption mt-2" style={{ color: 'var(--p-muted)' }}>
                {photos.length}/5 photo{photos.length > 1 ? 's' : ''} — encore {5 - photos.length} possible{5 - photos.length > 1 ? 's' : ''}
              </p>
            </>
          )}

          {submitting && uploadProgress > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--p-muted)' }}>
                <span>Téléversement des photos…</span><span>{uploadProgress}%</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: 'var(--p-deep)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${uploadProgress}%`, background: BLUE }} />
              </div>
            </div>
          )}
        </Card>

        {/* ── Vidéo ── */}
        <Card>
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--p-text)' }}>Vidéo du bien <span className="font-normal text-xs" style={{ color: 'var(--p-muted)' }}>(optionnel)</span></p>
          <p className="text-xs mb-4" style={{ color: 'var(--p-muted)' }}>Maximum 1 vidéo (MP4, {TAILLE_MAX_VIDEO_MO} Mo au plus)</p>
          {videoErreur && <p role="alert" className="text-xs font-semibold mb-3" style={{ color: 'var(--tx-red)' }}>{videoErreur}</p>}

          {video ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border"
              style={{ borderColor: 'var(--p-border)', background: 'var(--p-deep)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: withAlpha(BLUE, '20') }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: BLUE }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="flex-1 text-sm font-semibold truncate" style={{ color: 'var(--p-text)' }}>{video.name}</span>
              <button aria-label="Retirer la vidéo" type="button" onClick={() => setVideo(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ background: 'var(--c-danger)' }}>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- zone de dépôt : le glisser-déposer s'ajoute au champ fichier, qui reste utilisable au clavier
            <label className="block border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-colors"
              style={{ borderColor: hoveredDropzone === 'video' ? BLUE : 'var(--p-border)' }}
              onMouseEnter={() => setHoveredDropzone('video')}
              onMouseLeave={() => setHoveredDropzone(null)}>
              <div className="flex justify-center mb-3">
                <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
                  style={{ color: 'var(--p-muted)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>Ajouter une vidéo (MP4)</p>
              <input type="file" accept="video/mp4" className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  if (!f) return
                  const erreur = erreurVideo(f)
                  setVideoErreur(erreur)
                  if (!erreur) setVideo(f)
                }} />
            </label>
          )}
        </Card>
      </div>
  )
}
