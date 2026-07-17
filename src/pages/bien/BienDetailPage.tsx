import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { biensApi } from '../../api/biensApi'
import { favoritesApi } from '../../api/favoritesApi'
import { infosLogementRows, infosTerrainRows, actifLabels, type InfoRow } from '../../utils/amenites'

const BACKEND = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1').replace('/api/v1', '') + '/'

function resolveUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return BACKEND + url
}

const TYPE_LABELS: Record<string, string> = {
  maison: 'Maison', appart_vide: 'Appartement vide',
  appart_meuble: 'Appartement meublé', guesthouse: 'Guesthouse', terrain: 'Terrain',
}

export default function BienDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [bien, setBien] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [photoIdx, setPhotoIdx] = useState(0)
  const [isFav, setIsFav] = useState(false)
  const [tab, setTab] = useState<'desc'|'pieces'|'amenites'>('desc')

  useEffect(() => {
    biensApi.byId(Number(id))
      .then(d => setBien(d))
      .catch(() => setError('Bien introuvable'))
      .finally(() => setLoading(false))
  }, [id])

  const toggleFav = async () => {
    if (!isLoggedIn) { navigate('/login'); return }
    try {
      if (isFav) { await favoritesApi.remove(Number(id)); setIsFav(false) }
      else { await favoritesApi.add(Number(id)); setIsFav(true) }
    } catch (_) {}
  }

  if (loading) return (
    <div className="min-h-full flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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

  const photos: any[] = bien.photos || []
  const allUrls = photos.map((p: any) => resolveUrl(p.url))
  const isLocation = bien.transaction === 'location'
  const typeLabel = TYPE_LABELS[bien.type] || bien.type
  const prix = Number(bien.prix).toLocaleString('fr-FR')

  const am = bien.amenites
  const ameniteLabels: string[] = am ? actifLabels(am) : []
  const voisinageLabels: string[] = am?.voisinage && Array.isArray(am.voisinage) ? am.voisinage : []
  const logementRows: InfoRow[] = am ? infosLogementRows(am) : []
  const terrainRows: InfoRow[] = am ? infosTerrainRows(am) : []
  const hasAmenitesInfo = ameniteLabels.length > 0 || voisinageLabels.length > 0 || logementRows.length > 0 || terrainRows.length > 0

  return (
    <div className="min-h-full pb-28 md:pb-0">

      {/* ── MOBILE header / galerie ── */}
      <div className="md:hidden relative h-72" style={{ background: 'rgba(0,0,0,0.04)' }}>
        {allUrls.length > 0 ? (
          <img src={allUrls[photoIdx]} alt="photo" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <svg className="w-20 h-20 text-text-grey/30" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}
        <button onClick={() => navigate(-1)} className="absolute top-12 left-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button onClick={toggleFav} className="absolute top-12 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
          <svg viewBox="0 0 24 24" fill={isFav ? '#FF6B35' : 'none'} stroke="white" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        {allUrls.length > 1 && (
          <>
            <button onClick={() => setPhotoIdx(i => (i - 1 + allUrls.length) % allUrls.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => setPhotoIdx(i => (i + 1) % allUrls.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-medium">
              {photoIdx + 1} / {allUrls.length}
            </div>
          </>
        )}
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden md:block w-full px-6 md:px-16 py-8">
        {/* Breadcrumb / back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-grey hover:text-primary transition-colors mb-6 group text-sm font-medium">
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Retour aux annonces
        </button>

        <div className="grid grid-cols-[1fr_400px] gap-8 items-start">

          {/* ── Galerie desktop ── */}
          <div>
            <div className="relative rounded-2xl overflow-hidden" style={{ height: 480, background: 'rgba(0,0,0,0.04)' }}>
              {allUrls.length > 0 ? (
                <img src={allUrls[photoIdx]} alt="photo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.04)' }}>
                  <svg className="w-24 h-24 text-text-grey/30" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              )}
              {allUrls.length > 1 && (
                <>
                  <button onClick={() => setPhotoIdx(i => (i - 1 + allUrls.length) % allUrls.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => setPhotoIdx(i => (i + 1) % allUrls.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1.5 rounded-full font-medium backdrop-blur-sm">
                    {photoIdx + 1} / {allUrls.length}
                  </div>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {allUrls.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {allUrls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIdx(i)}
                    className={`flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === photoIdx ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Tabs desktop — description / pièces / amenités */}
            <div className="mt-8">
              <div className="flex border-b border-divider mb-5">
                {([['desc','Description'],['pieces','Pièces'],['amenites','Aménités']] as const).map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${tab === k ? 'border-primary text-primary' : 'border-transparent text-text-grey hover:text-text-dark'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {tab === 'desc' && (
                <div>
                  {bien.description ? (
                    <p className="text-text-grey leading-relaxed text-sm">{bien.description}</p>
                  ) : (
                    <p className="text-text-grey text-sm italic">Aucune description disponible.</p>
                  )}
                  {(bien.details_maison || bien.details_terrain) && (
                    <div className="flex flex-wrap gap-3 mt-5">
                      {bien.details_maison?.superficie > 0 && <Chip label={`${bien.details_maison.superficie} m²`} sub="Superficie" color="#4B6BFF" />}
                      {bien.details_terrain?.superficie > 0 && <Chip label={`${bien.details_terrain.superficie} m²`} sub="Superficie" color="#4B6BFF" />}
                      {bien.details_maison?.cloture && <Chip label="Clôturé" color="#4CAF50" />}
                      {bien.details_appart?.entree_personnelle && <Chip label="Entrée perso." color="#9C27B0" />}
                    </div>
                  )}
                </div>
              )}

              {tab === 'pieces' && (
                <div>
                  {bien.pieces && bien.pieces.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {bien.pieces.map((p: any) => (
                        <div key={p.id} className="glass-card rounded-xl p-3.5">
                          <p className="text-sm font-semibold text-text-dark">{p.nom}</p>
                          {p.surface > 0 && <p className="text-xs text-text-grey mt-0.5">{p.surface} m²</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-text-grey text-sm italic">Aucune pièce renseignée.</p>
                  )}
                  {bien.pieces?.some((p: any) => p.photos?.length > 0) && (
                    <div className="mt-5">
                      <p className="text-sm font-semibold text-text-dark mb-3">Photos par pièce</p>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {bien.pieces.flatMap((p: any) =>
                          (p.photos || []).map((ph: any, i: number) => (
                            <img key={`${p.id}-${i}`} src={resolveUrl(ph.url)} alt={p.nom} className="w-32 h-24 rounded-xl object-cover flex-shrink-0 hover:scale-105 transition-transform cursor-pointer" />
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'amenites' && (
                <div className="space-y-6">
                  {!hasAmenitesInfo ? (
                    <p className="text-text-grey text-sm italic">Aucune aménité renseignée.</p>
                  ) : (
                    <>
                      <InfoRowsSection title="Informations logement" rows={logementRows} />
                      <InfoRowsSection title="Informations terrain" rows={terrainRows} />
                      {ameniteLabels.length > 0 && (
                        <div>
                          <h3 className="font-bold text-text-dark text-sm mb-3">Équipements &amp; atouts</h3>
                          <div className="flex flex-wrap gap-2">
                            {ameniteLabels.map((a, i) => (
                              <span key={i} className="bg-primary/8 text-primary text-sm font-medium px-4 py-2 rounded-full border border-primary/15">
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {voisinageLabels.length > 0 && (
                        <div>
                          <h3 className="font-bold text-text-dark text-sm mb-3">Voisinage &amp; environnement</h3>
                          <div className="flex flex-wrap gap-2">
                            {voisinageLabels.map((a, i) => (
                              <span key={i} className="bg-secondary/8 text-secondary text-sm font-medium px-4 py-2 rounded-full border border-secondary/15">
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Panneau infos sticky desktop ── */}
          <div className="sticky top-20">
            <div className="glass-card rounded-2xl p-6">
              {/* Badges */}
              <div className="flex gap-2 mb-4">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold text-white ${isLocation ? 'bg-primary' : 'bg-secondary'}`}>
                  {isLocation ? 'À LOUER' : 'À VENDRE'}
                </span>
                <span className="px-3 py-1.5 rounded-full text-xs font-bold glass-btn text-text-dark">
                  {typeLabel}
                </span>
              </div>

              {/* Prix */}
              <div className="mb-5">
                <p className="text-3xl font-bold text-text-dark">
                  {prix} <span className="text-base font-medium text-text-grey">FCFA{isLocation ? '/mois' : ''}</span>
                </p>
                {bien.frais_visite && Number(bien.frais_visite) > 0 && (
                  <p className="text-sm text-text-grey mt-1.5 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Frais de visite : <strong className="text-secondary">{Number(bien.frais_visite).toLocaleString('fr-FR')} FCFA</strong>
                  </p>
                )}
              </div>

              <div className="h-px bg-divider mb-5" />

              {/* Localisation */}
              <div className="flex items-start gap-3 mb-5">
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

              {/* Favoris */}
              <button
                onClick={toggleFav}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold mb-3 transition-all ${isFav ? 'border-[#FF6B35] text-[#FF6B35] bg-[#FF6B35]/5' : 'border-divider text-text-grey hover:border-primary hover:text-primary'}`}
              >
                <svg viewBox="0 0 24 24" fill={isFav ? '#FF6B35' : 'none'} stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {isFav ? 'Retiré des favoris' : 'Ajouter aux favoris'}
              </button>

              {/* CTA principal */}
              <button
                onClick={() => { if (!isLoggedIn) { navigate('/login'); return } navigate(`/reservation/${bien.id}`) }}
                className="w-full py-4 rounded-xl font-bold text-white text-sm shadow-btn transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #4B6BFF 0%, #7B4BFF 100%)' }}
              >
                {isLocation ? 'Réserver une visite' : 'Demander une visite'}
              </button>

              <p className="text-xs text-text-grey text-center mt-3">
                Sans engagement · Réponse sous 24h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE content ── */}
      <div className="md:hidden px-4 py-5 space-y-4">
        <div>
          <div className="flex gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${isLocation ? 'bg-primary' : 'bg-secondary'}`}>
              {isLocation ? 'À LOUER' : 'À VENDRE'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold glass-btn text-text-dark">{typeLabel}</span>
          </div>
          <p className="text-2xl font-bold text-text-dark">
            {prix} FCFA{isLocation && <span className="text-base font-medium text-text-grey">/mois</span>}
          </p>
          {bien.frais_visite && Number(bien.frais_visite) > 0 && (
            <p className="text-sm text-text-grey mt-1">Frais de visite : <strong className="text-secondary">{Number(bien.frais_visite).toLocaleString('fr-FR')} FCFA</strong></p>
          )}
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-dark">{bien.localisation?.quartier && `${bien.localisation.quartier}, `}{bien.localisation?.ville}</p>
            {bien.localisation?.adresse && <p className="text-xs text-text-grey mt-0.5">{bien.localisation.adresse}</p>}
          </div>
        </div>

        {bien.description && (
          <div className="glass-card rounded-2xl p-4">
            <h3 className="font-bold text-text-dark text-sm mb-2">Description</h3>
            <p className="text-sm text-text-grey leading-relaxed">{bien.description}</p>
          </div>
        )}

        {bien.pieces && bien.pieces.length > 0 && (
          <div className="glass-card rounded-2xl p-4">
            <h3 className="font-bold text-text-dark text-sm mb-3">Pièces ({bien.pieces.length})</h3>
            <div className="grid grid-cols-2 gap-2">
              {bien.pieces.map((p: any) => (
                <div key={p.id} className="glass-card rounded-xl p-3">
                  <p className="text-sm font-semibold text-text-dark">{p.nom}</p>
                  {p.surface > 0 && <p className="text-xs text-text-grey">{p.surface} m²</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {(logementRows.length > 0 || terrainRows.length > 0) && (
          <div className="glass-card rounded-2xl p-4 space-y-4">
            <InfoRowsSection title="Informations logement" rows={logementRows} compact />
            <InfoRowsSection title="Informations terrain" rows={terrainRows} compact />
          </div>
        )}

        {ameniteLabels.length > 0 && (
          <div className="glass-card rounded-2xl p-4">
            <h3 className="font-bold text-text-dark text-sm mb-3">Aménités</h3>
            <div className="flex flex-wrap gap-2">
              {ameniteLabels.map((a, i) => (
                <span key={i} className="bg-primary/8 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/15">{a}</span>
              ))}
            </div>
          </div>
        )}

        {voisinageLabels.length > 0 && (
          <div className="glass-card rounded-2xl p-4">
            <h3 className="font-bold text-text-dark text-sm mb-3">Voisinage &amp; environnement</h3>
            <div className="flex flex-wrap gap-2">
              {voisinageLabels.map((a, i) => (
                <span key={i} className="bg-secondary/8 text-secondary text-xs font-semibold px-3 py-1.5 rounded-full border border-secondary/15">{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* CTA inline — au-dessus du BottomNav dans le scroll */}
        <button
          onClick={() => { if (!isLoggedIn) { navigate('/login'); return } navigate(`/reservation/${bien.id}`) }}
          className="w-full py-4 rounded-xl font-bold text-white shadow-btn"
          style={{ background: 'linear-gradient(135deg, #4B6BFF 0%, #7B4BFF 100%)' }}
        >
          {isLocation ? 'Réserver une visite' : 'Demander une visite'}
        </button>
      </div>
    </div>
  )
}

function Chip({ label, sub, color }: { label: string; sub?: string; color: string }) {
  return (
    <div className="rounded-xl px-4 py-2.5 text-center" style={{ background: color + '15', border: `1px solid ${color}30` }}>
      <p className="text-sm font-bold" style={{ color }}>{label}</p>
      {sub && <p className="text-xs text-text-grey mt-0.5">{sub}</p>}
    </div>
  )
}

function InfoRowsSection({ title, rows, compact }: { title: string; rows: InfoRow[]; compact?: boolean }) {
  if (rows.length === 0) return null
  return (
    <div>
      <h3 className={`font-bold text-text-dark mb-3 ${compact ? 'text-sm' : 'text-sm'}`}>{title}</h3>
      <div className="divide-y divide-divider">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-text-grey">{r.label}</span>
            <span className="font-semibold text-text-dark text-right ml-4">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
