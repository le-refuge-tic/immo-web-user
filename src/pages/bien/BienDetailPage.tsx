import { useNavigate } from 'react-router-dom'
import type { Amenites } from '../../types/amenites'
import type { Photo, Piece } from '../../types/api'
import { infosLogementRows, infosTerrainRows, type InfoRow } from '../../utils/amenites'
import EditBienModal from './EditBienModal'
import ShareSheet from '../../components/ShareSheet'
import { bienTypeLabel } from '../../utils/bienType'
import { resolveUrl, buildComposition } from './bien-detail/helpers'
import { useBienDetail } from './bien-detail/useBienDetail'
import { DetailContent } from './bien-detail/DetailSections'
import { BottomCta } from './bien-detail/BottomCta'
import { GalleryMobile, GalleryDesktop } from './bien-detail/Galleries'
import { SimilairesDesktop, SimilairesMobile } from './bien-detail/Similaires'
import ErrorState from '../../components/ErrorState'

export default function BienDetailPage({ showOwnBack = true }: { showOwnBack?: boolean }) {
  const navigate = useNavigate()
  const {
    bien, setBien, loading, error, loadError, actionError, recharger, bienTitle, isLoggedIn, isOwnBien,
    photoIdx, setPhotoIdx,
    visitesPlanifiees, visitesConfirmees,
    visiteActive, visiteCancellee, visiteEchouee, annulerBusy,
    isOccupeLocal, togglingStatut,
    editing, setEditing, shareOpen, setShareOpen,
    similaires, partager, toggleDisponibilite, annulerVisite,
  } = useBienDetail()

  if (loading) return (
    <div className="min-h-full flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (loadError && !bien) return (
    <div className="min-h-full flex flex-col items-center justify-center">
      <ErrorState title="Impossible de charger ce bien" onRetry={recharger} />
      <button onClick={() => navigate(-1)} className="text-primary font-semibold text-sm mb-8">Retour</button>
    </div>
  )
  if (error || !bien) return (
    <div className="min-h-full flex flex-col items-center justify-center gap-4 px-6">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-2" style={{ background: 'rgba(75,107,255,0.10)' }}>
        <svg className="w-10 h-10 text-text-grey" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-text-dark font-semibold">Bien introuvable</p>
      <button onClick={() => navigate(-1)} className="text-primary font-semibold flex items-center gap-1 text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Retour
      </button>
    </div>
  )

  const photos: Photo[] = bien.photos || []
  const allUrls = photos.map((p: Photo) => resolveUrl(p.url))
  const isLocation = bien.transaction === 'location'
  const typeLabel = bienTypeLabel(bien)
  /** Titre auto-généré (le bien n'a pas de champ "titre" saisi) : Type — Quartier. */
  const title = bien.localisation?.quartier ? `${typeLabel} — ${bien.localisation.quartier}` : typeLabel
  const prix = Number(bien.prix).toLocaleString('fr-FR')
  const accentColor = isLocation ? 'var(--c-brand)' : 'var(--c-orange-dark)'
  const prixPromoNum = bien.prix_promo != null ? Number(bien.prix_promo) : null
  const hasPromo = prixPromoNum != null && prixPromoNum > 0 && prixPromoNum < Number(bien.prix)
  const prixPromo = hasPromo ? prixPromoNum!.toLocaleString('fr-FR') : null
  const promoPct = hasPromo ? Math.round((1 - prixPromoNum! / Number(bien.prix)) * 100) : 0

  const am = bien.amenites as Amenites | null | undefined
  const voisinageLabels: string[] = am?.voisinage && Array.isArray(am.voisinage) ? am.voisinage : []
  const logementRows: InfoRow[] = am ? infosLogementRows(am) : []
  const terrainRows: InfoRow[] = am ? infosTerrainRows(am) : []
  const composition = buildComposition(bien)

  const chambres = (bien.pieces || []).filter((p: Piece) => p.nom?.toLowerCase().includes('chambre')).length
  const superficie = bien.details_maison?.superficie || bien.details_terrain?.superficie || 0
  const nbConsultations = bien.nb_consultations ?? 0

  const modBadge = isOwnBien ? (() => {
    const mod = bien.statut_moderation || 'en_attente'
    if (mod === 'approuve')     return { label: 'Publié',       bg: 'var(--c-success)' }
    if (mod === 'rejete')       return { label: 'Rejeté',       bg: 'var(--c-danger)' }
    if (mod === 'conditionnel') return { label: 'Conditionnel', bg: 'var(--c-amber-dark)' }
    return                               { label: 'En attente',  bg: 'var(--c-amber-dark)' }
  })() : null

  return (
    <div className="min-h-full pb-32 lg:pb-0">
      {actionError && (
        <div role="alert" className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md rounded-xl px-4 py-3 text-sm font-semibold text-white" style={{ background: 'var(--c-danger)' }}>
          {actionError}
        </div>
      )}

      {/* ── MOBILE header / galerie ── */}
      <GalleryMobile allUrls={allUrls} photoIdx={photoIdx} setPhotoIdx={setPhotoIdx} altText={bienTitle || 'Photo du bien'} showOwnBack={showOwnBack} onBack={() => navigate(-1)} />

      {/* ── DESKTOP layout ── */}
      <div className="hidden lg:block w-full px-6 md:px-16 py-8">
        {showOwnBack && (
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-grey hover:text-primary transition-colors mb-6 group text-sm font-medium">
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Retour aux annonces
          </button>
        )}

        <div className="grid grid-cols-[1fr_400px] gap-8 items-start">
          <div>
            <GalleryDesktop allUrls={allUrls} photoIdx={photoIdx} setPhotoIdx={setPhotoIdx} altText={bienTitle || 'Photo du bien'} />

            <div className="mt-8">
              <DetailContent
                bien={bien} isOwnBien={isOwnBien} isLocation={isLocation}
                composition={composition} logementRows={logementRows} terrainRows={terrainRows}
                voisinageLabels={voisinageLabels}
                visitesPlanifiees={visitesPlanifiees} visitesConfirmees={visitesConfirmees}
              />
            </div>
          </div>

          {/* ── Panneau infos sticky desktop ── */}
          <div className="sticky top-20">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold text-white ${isLocation ? 'bg-primary' : 'bg-orange-700'}`}>
                  {isLocation ? 'À LOUER' : 'À VENDRE'}
                </span>
                <span className="px-3 py-1.5 rounded-full text-xs font-bold glass-btn text-text-dark">{typeLabel}</span>
                {bien.statut === 'occupe' && (
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white bg-danger">Occupé</span>
                )}
                {modBadge && (
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ background: modBadge.bg }}>
                    {modBadge.label}
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-text-dark mb-3">{title}</p>

              <div className="mb-5">
                {hasPromo && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md text-caption font-bold text-white" style={{ background: 'var(--c-danger)' }}>PROMO -{promoPct}%</span>
                    <span className="text-sm text-text-grey line-through">{prix} FCFA</span>
                  </div>
                )}
                <p className="text-3xl font-bold" style={{ color: hasPromo ? 'var(--c-danger)' : accentColor }}>
                  {hasPromo ? prixPromo : prix} <span className="text-base font-medium text-text-grey">FCFA{isLocation ? '/mois' : ''}</span>
                </p>
              </div>

              <div className="h-px bg-divider mb-5" />

              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-dark">
                    {bien.localisation?.quartier && `${bien.localisation.quartier}, `}{bien.localisation?.ville}
                  </p>
                  {bien.localisation?.adresse && (
                    <p className="text-xs text-text-grey mt-0.5">{bien.localisation.adresse}</p>
                  )}
                </div>
              </div>

              {(chambres > 0 || superficie > 0 || isOwnBien) && (
                <div className="flex items-center gap-3 mb-5 text-xs text-text-grey">
                  {chambres > 0 && <span>{chambres} ch</span>}
                  {superficie > 0 && <span>{superficie} m²</span>}
                  {isOwnBien && <span className="ml-auto flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {nbConsultations} vue{nbConsultations !== 1 ? 's' : ''}
                  </span>}
                </div>
              )}

              <BottomCta
                isOwnBien={isOwnBien} isOccupeLocal={isOccupeLocal} togglingStatut={togglingStatut}
                onToggleDisponibilite={toggleDisponibilite}
                visiteActive={visiteActive} visiteCancellee={visiteCancellee} visiteEchouee={visiteEchouee}
                onAnnuler={annulerVisite} annulerBusy={annulerBusy}
                onProposerVisite={() => { if (!isLoggedIn) { sessionStorage.setItem('post_login_redirect', `/reservation/${bien.id}`); navigate('/login'); return } navigate(`/reservation/${bien.id}`) }}
                onModifier={() => setEditing(true)}
                fraisVisite={bien.frais_visite}
              />

              <button onClick={partager}
                className="w-full mt-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-divider text-text-grey hover:text-text-dark hover:border-text-grey/40 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342a2.996 2.996 0 000-2.684m0 2.684a3 3 0 100 2.684m0-2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.368-2.684 3 3 0 00-5.368 2.684zm0 9.632a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                Partager ce bien
              </button>
            </div>

          {/* Biens à proximité */}
          {!isOwnBien && similaires.length > 0 && (
            <SimilairesDesktop similaires={similaires} onOpen={bienId => navigate(`/biens/${bienId}`)} />
          )}
        </div>
        </div>
      </div>

      {/* ── MOBILE content ── */}
      <div className="lg:hidden px-4 md:px-8 py-5 md:py-8 space-y-4 md:max-w-2xl md:mx-auto">
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${isLocation ? 'bg-primary' : 'bg-orange-700'}`}>
              {isLocation ? 'À LOUER' : 'À VENDRE'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold text-text-dark" style={{ background: 'rgba(0,0,0,0.05)' }}>{typeLabel}</span>
            {bien.statut === 'occupe' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-danger">Occupé</span>
            )}
            {modBadge && (
              <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: modBadge.bg }}>
                {modBadge.label}
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-text-dark mb-1">{title}</h1>
          {hasPromo && (
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md text-caption font-bold text-white" style={{ background: 'var(--c-danger)' }}>PROMO -{promoPct}%</span>
              <span className="text-sm text-text-grey line-through">{prix} FCFA</span>
            </div>
          )}
          <p className="text-2xl font-bold" style={{ color: hasPromo ? 'var(--c-danger)' : accentColor }}>
            {hasPromo ? prixPromo : prix} FCFA{isLocation && <span className="text-base font-medium text-text-grey">/mois</span>}
          </p>
        </div>

        <div className="card-soft rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-dark">{bien.localisation?.quartier && `${bien.localisation.quartier}, `}{bien.localisation?.ville}</p>
            {bien.localisation?.adresse && <p className="text-xs text-text-grey mt-0.5">{bien.localisation.adresse}</p>}
            {(chambres > 0 || superficie > 0 || isOwnBien) && (
              <div className="flex items-center gap-3 mt-1.5 text-xs text-text-grey">
                {chambres > 0 && <span>{chambres} ch</span>}
                {superficie > 0 && <span>{superficie} m²</span>}
                {isOwnBien && <span className="ml-auto">{nbConsultations} vue{nbConsultations !== 1 ? 's' : ''}</span>}
              </div>
            )}
          </div>
        </div>

        <DetailContent
          bien={bien} isOwnBien={isOwnBien} isLocation={isLocation}
          composition={composition} logementRows={logementRows} terrainRows={terrainRows}
          voisinageLabels={voisinageLabels}
          visitesPlanifiees={visitesPlanifiees} visitesConfirmees={visitesConfirmees}
        />

        {!isOwnBien && similaires.length > 0 && (
          <SimilairesMobile similaires={similaires} onOpen={bienId => navigate(`/biens/${bienId}`)} />
        )}
      </div>

      {/* ── Barre CTA fixe (mobile/tablette) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-divider px-5 py-3 safe-bottom">
        <BottomCta
          isOwnBien={isOwnBien} isOccupeLocal={isOccupeLocal} togglingStatut={togglingStatut}
          onToggleDisponibilite={toggleDisponibilite}
          visiteActive={visiteActive} visiteCancellee={visiteCancellee} visiteEchouee={visiteEchouee}
          onAnnuler={annulerVisite} annulerBusy={annulerBusy}
          onProposerVisite={() => { if (!isLoggedIn) { sessionStorage.setItem('post_login_redirect', `/reservation/${bien.id}`); navigate('/login'); return } navigate(`/reservation/${bien.id}`) }}
          onModifier={() => setEditing(true)}
          fraisVisite={bien.frais_visite}
        />
      </div>

      {editing && (
        <EditBienModal bien={bien} onClose={() => setEditing(false)}
          onSaved={updated => { setBien(prev => ({ ...prev, ...updated })); setEditing(false) }} />
      )}

      {shareOpen && <ShareSheet bien={bien} onClose={() => setShareOpen(false)} />}
    </div>
  )
}