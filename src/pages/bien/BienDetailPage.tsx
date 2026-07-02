import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { biensApi } from '../../api/biensApi'
import { favoritesApi } from '../../api/favoritesApi'

const BACKEND = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1').replace('/api/v1', '') + '/'

function resolveUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return BACKEND + url
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
  const [showReserve, setShowReserve] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await biensApi.byId(Number(id))
        setBien(data)
      } catch (_) {
        setError('Bien introuvable')
      }
      setLoading(false)
    }
    load()
  }, [id])

  const toggleFav = async () => {
    if (!isLoggedIn) { navigate('/login'); return }
    try {
      if (isFav) { await favoritesApi.remove(Number(id)); setIsFav(false) }
      else { await favoritesApi.add(Number(id)); setIsFav(true) }
    } catch (_) {}
  }

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (error || !bien) return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6">
      <svg className="w-16 h-16 text-text-grey opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-text-grey text-sm">{error || 'Bien introuvable'}</p>
      <button onClick={() => navigate(-1)} className="text-primary font-semibold flex items-center gap-1">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Retour
      </button>
    </div>
  )

  const photos: any[] = bien.photos || []
  const allUrls = photos.map((p: any) => resolveUrl(p.url))
  const isLocation = bien.transaction === 'location'

  const typeLabel: Record<string, string> = {
    maison: 'Maison', appart_vide: 'Appartement vide',
    appart_meuble: 'Appartement meublé', guesthouse: 'Guesthouse', terrain: 'Terrain',
  }

  const ameniteLabels: string[] = []
  const am = bien.amenites
  if (am) {
    if (am.cour) ameniteLabels.push('Cour')
    if (am.arriere_cour) ameniteLabels.push('Arrière-cour')
    if (am.parking) ameniteLabels.push(am.parking_capacite ? `Parking (${am.parking_capacite} véh.)` : 'Parking')
    if (am.boyerie) ameniteLabels.push(am.boyerie_type ? `Boyerie (${am.boyerie_type})` : 'Boyerie')
    if (am.boutique) ameniteLabels.push(am.boutique_position ? `Boutique (${am.boutique_position})` : 'Boutique')
    if (am.armoires_chambre) ameniteLabels.push('Armoires chambre')
    if (am.compteur_eau === 'soneb') ameniteLabels.push('Eau SONEB')
    else if (am.compteur_eau === 'forage') ameniteLabels.push('Forage')
    if (am.compteur_elec === 'personnel') ameniteLabels.push('Compteur personnel')
    else if (am.compteur_elec === 'decompte') ameniteLabels.push('Élec. décomptée')
    if (Array.isArray(am.equipements)) ameniteLabels.push(...am.equipements)
    if (Array.isArray(am.voisinage)) ameniteLabels.push(...am.voisinage)
  }

  return (
    <div className="min-h-dvh bg-app-bg pb-28">
      {/* Gallery */}
      <div className="relative h-72 bg-surface-g">
        {allUrls.length > 0 ? (
          <img
            src={allUrls[photoIdx]}
            alt="photo"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/40 to-primary/20">
            <svg className="w-20 h-20 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Fav button */}
        <button
          onClick={toggleFav}
          className="absolute top-4 right-4 w-10 h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm"
        >
          <svg viewBox="0 0 24 24" fill={isFav ? '#FF6B35' : 'none'} stroke="white" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Photo nav */}
        {allUrls.length > 1 && (
          <>
            <button
              onClick={() => setPhotoIdx(i => (i - 1 + allUrls.length) % allUrls.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setPhotoIdx(i => (i + 1) % allUrls.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {photoIdx + 1} / {allUrls.length}
            </div>
          </>
        )}
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Badges + Prix */}
        <div>
          <div className="flex gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${isLocation ? 'bg-primary' : 'bg-secondary'}`}>
              {isLocation ? 'À LOUER' : 'À VENDRE'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-text-dark/70">
              {typeLabel[bien.type] || bien.type}
            </span>
          </div>
          <p className="text-2xl font-bold text-text-dark">
            {Number(bien.prix).toLocaleString('fr-FR')} FCFA
            {isLocation && <span className="text-base font-medium text-text-grey">/mois</span>}
          </p>
          {bien.frais_visite && Number(bien.frais_visite) > 0 && (
            <p className="text-sm text-text-grey mt-1">
              Frais de visite : {Number(bien.frais_visite).toLocaleString('fr-FR')} FCFA
            </p>
          )}
        </div>

        {/* Localisation */}
        <div className="bg-white rounded-2xl p-4">
          <h3 className="font-bold text-text-dark text-sm mb-2">Localisation</h3>
          <p className="text-sm text-text-grey">
            {bien.localisation?.quartier && `${bien.localisation.quartier}, `}
            {bien.localisation?.ville}
          </p>
          {bien.localisation?.adresse && (
            <p className="text-xs text-text-grey mt-0.5">{bien.localisation.adresse}</p>
          )}
        </div>

        {/* Description */}
        {bien.description && (
          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-bold text-text-dark text-sm mb-2">Description</h3>
            <p className="text-sm text-text-grey leading-relaxed">{bien.description}</p>
          </div>
        )}

        {/* Pièces */}
        {bien.pieces && bien.pieces.length > 0 && (
          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-bold text-text-dark text-sm mb-3">Pieces ({bien.pieces.length})</h3>
            <div className="grid grid-cols-2 gap-2">
              {bien.pieces.map((p: any) => (
                <div key={p.id} className="bg-surface-g rounded-xl p-3">
                  <p className="text-sm font-semibold text-text-dark">{p.nom}</p>
                  {p.surface > 0 && (
                    <p className="text-xs text-text-grey mt-0.5">{p.surface} m²</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Détails */}
        {(bien.details_maison || bien.details_terrain) && (
          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-bold text-text-dark text-sm mb-2">Details</h3>
            <div className="flex flex-wrap gap-3">
              {bien.details_maison?.superficie > 0 && (
                <div className="bg-primary-l rounded-xl px-3 py-2 text-center">
                  <p className="text-sm font-bold text-primary">{bien.details_maison.superficie} m²</p>
                  <p className="text-xs text-text-grey">Superficie</p>
                </div>
              )}
              {bien.details_terrain?.superficie > 0 && (
                <div className="bg-primary-l rounded-xl px-3 py-2 text-center">
                  <p className="text-sm font-bold text-primary">{bien.details_terrain.superficie} m²</p>
                  <p className="text-xs text-text-grey">Superficie</p>
                </div>
              )}
              {bien.details_maison?.cloture && (
                <div className="bg-success/10 text-success rounded-xl px-3 py-2 text-center">
                  <p className="text-sm font-bold">Cloture</p>
                </div>
              )}
              {bien.details_appart?.entree_personnelle && (
                <div className="bg-surface-g rounded-xl px-3 py-2 text-center">
                  <p className="text-sm font-bold text-text-dark">Entree perso.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aménités */}
        {ameniteLabels.length > 0 && (
          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-bold text-text-dark text-sm mb-3">Amenites</h3>
            <div className="flex flex-wrap gap-2">
              {ameniteLabels.map((a, i) => (
                <span key={i} className="bg-primary-l text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Photos par pièce */}
        {bien.pieces?.some((p: any) => p.photos?.length > 0) && (
          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-bold text-text-dark text-sm mb-3">Photos par piece</h3>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {bien.pieces.flatMap((p: any) =>
                (p.photos || []).map((ph: any, i: number) => (
                  <img
                    key={`${p.id}-${i}`}
                    src={resolveUrl(ph.url)}
                    alt={p.nom}
                    className="w-24 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* CTA bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-divider px-4 py-3 safe-bottom">
        <button
          onClick={() => { if (!isLoggedIn) { navigate('/login'); return } setShowReserve(true) }}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-btn"
        >
          {isLocation ? 'Réserver une visite' : 'Demander une visite'}
        </button>
      </div>

      {/* Modal réservation */}
      {showReserve && (
        <ReservationModal bien={bien} onClose={() => setShowReserve(false)} />
      )}
    </div>
  )
}

function ReservationModal({ bien, onClose }: { bien: any; onClose: () => void }) {
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl p-6 w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-divider rounded-full mx-auto mb-5" />
        <h3 className="text-base font-bold text-text-dark mb-2">Réserver une visite</h3>
        <p className="text-sm text-text-grey mb-5">
          {bien.frais_visite && Number(bien.frais_visite) > 0
            ? `Frais de visite : ${Number(bien.frais_visite).toLocaleString('fr-FR')} FCFA`
            : 'Visite gratuite'}
        </p>
        <button
          onClick={() => { onClose(); navigate(`/mes-visites?bienId=${bien.id}`) }}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-btn"
        >
          Choisir un créneau
        </button>
        <button onClick={onClose} className="w-full mt-3 text-text-grey py-3 text-sm">Annuler</button>
      </div>
    </div>
  )
}
