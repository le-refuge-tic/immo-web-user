import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { favoritesApi } from '../api/favoritesApi'

const BACKEND = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1').replace('/api/v1', '') + '/'

function resolveUrl(url: string) {
  if (!url) return '/placeholder.jpg'
  if (url.startsWith('http')) return url
  return BACKEND + url
}

type Props = {
  bien: any
  favoriteIds?: Set<number>
  onFavoriteToggle?: (id: number, added: boolean) => void
  distanceKm?: number | null
}

export default function BienCard({ bien, favoriteIds, onFavoriteToggle, distanceKm }: Props) {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [isFav, setIsFav] = useState(favoriteIds?.has(bien.id) ?? false)
  const [toggling, setToggling] = useState(false)
  const [favPopped, setFavPopped] = useState(false)

  useEffect(() => {
    setIsFav(favoriteIds?.has(bien.id) ?? false)
  }, [favoriteIds, bien.id])

  const cover = bien.photos?.find((p: any) => p.is_cover) || bien.photos?.[0]
  const coverUrl = cover ? resolveUrl(cover.url) : null

  const isLocation = bien.transaction === 'location'
  const typeLabel: Record<string, string> = {
    maison:         'Maison',
    appart_vide:    'Appartement vide',
    appart_meuble:  'Appartement meublé',
    guesthouse:     'Guesthouse',
    terrain:        'Terrain',
  }
  const label = typeLabel[bien.type] || bien.type

  const handleFav = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isLoggedIn) { navigate('/login'); return }
    if (toggling) return
    setToggling(true)
    setFavPopped(true)
    setTimeout(() => setFavPopped(false), 400)
    try {
      if (isFav) {
        await favoritesApi.remove(bien.id)
        setIsFav(false)
        onFavoriteToggle?.(bien.id, false)
      } else {
        await favoritesApi.add(bien.id)
        setIsFav(true)
        onFavoriteToggle?.(bien.id, true)
      }
    } catch (_) {}
    setToggling(false)
  }

  return (
    <div
      onClick={() => navigate(`/biens/${bien.id}`)}
      className="glass-card rounded-2xl overflow-hidden cursor-pointer group"
      style={{ transition: 'transform 0.25s cubic-bezier(0.22,0.61,0.36,1), box-shadow 0.25s ease' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 48px rgba(0,0,0,0.12), inset 0 1.5px 0 rgba(255,255,255,0.95)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = ''
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = ''
      }}
    >
      {/* Image */}
      <div className="relative h-44 md:h-52 img-zoom">
        {coverUrl ? (
          <img src={coverUrl} alt={label} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <svg className="w-12 h-12" style={{ color: 'rgba(0,0,0,0.18)' }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        )}

        {/* Badge transaction */}
        <div className="absolute top-3 left-3">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-bold text-white"
            style={{
              background: isLocation ? 'rgba(75,107,255,0.88)' : 'rgba(255,107,53,0.88)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            {isLocation ? 'À LOUER' : 'À VENDRE'}
          </span>
        </div>

        {/* Bouton favori */}
        <button
          onClick={handleFav}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${favPopped ? 'fav-pop' : ''}`}
          style={{
            background: 'rgba(255,255,255,0.80)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.95)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,1), 0 2px 8px rgba(0,0,0,0.10)',
          }}
        >
          <svg viewBox="0 0 24 24" fill={isFav ? '#FF3B30' : 'none'} stroke={isFav ? '#FF3B30' : 'rgba(0,0,0,0.5)'} strokeWidth={2} className="w-4 h-4 transition-colors duration-200">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Gradient bottom pour lisibilité du texte */}
        <div className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)' }} />
      </div>

      {/* Infos */}
      <div className="p-3.5">
        <p className="text-base md:text-lg font-bold leading-tight" style={{ color: '#1D1D1F' }}>
          {Number(bien.prix).toLocaleString('fr-FR')}{' '}
          <span className="text-sm font-medium" style={{ color: 'rgba(0,0,0,0.38)' }}>
            FCFA{isLocation ? '/mois' : ''}
          </span>
        </p>
        <p className="text-sm font-medium mt-0.5" style={{ color: 'rgba(0,0,0,0.58)' }}>{label}</p>
        <div className="flex items-center gap-1 mt-1.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(0,0,0,0.30)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-xs truncate" style={{ color: 'rgba(0,0,0,0.42)' }}>
            {bien.localisation?.quartier ? `${bien.localisation.quartier}, ` : ''}{bien.localisation?.ville || '—'}
            {distanceKm != null && (
              <span style={{ color: '#4B6BFF', fontWeight: 600 }}> · à {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}</span>
            )}
          </p>
        </div>
        {bien.frais_visite && Number(bien.frais_visite) > 0 && (
          <p className="hidden md:block text-xs mt-2 pt-2" style={{ color: 'rgba(0,0,0,0.30)', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            Frais visite : <span className="font-semibold" style={{ color: '#FF6B35' }}>{Number(bien.frais_visite).toLocaleString('fr-FR')} FCFA</span>
          </p>
        )}
      </div>
    </div>
  )
}
