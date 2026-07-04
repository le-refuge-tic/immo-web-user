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
}

export default function BienCard({ bien, favoriteIds, onFavoriteToggle }: Props) {
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
    maison: 'Maison',
    appart_vide: 'Appartement vide',
    appart_meuble: 'Appartement meublé',
    guesthouse: 'Guesthouse',
    terrain: 'Terrain',
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
      className="bg-white rounded-2xl shadow-card overflow-hidden cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-44 md:h-52 img-zoom">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={label}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-surface-g flex items-center justify-center">
            <svg className="w-12 h-12 text-text-grey" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white ${isLocation ? 'bg-primary' : 'bg-secondary'}`}>
            {isLocation ? 'À LOUER' : 'À VENDRE'}
          </span>
        </div>
        <button
          onClick={handleFav}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow transition-transform hover:scale-110 ${favPopped ? 'fav-pop' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill={isFav ? '#FF6B35' : 'none'} stroke={isFav ? '#FF6B35' : '#9E9E9E'} strokeWidth={2} className="w-4 h-4 transition-colors duration-200">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <p className="text-base md:text-lg font-bold text-text-dark leading-tight">
          {Number(bien.prix).toLocaleString('fr-FR')}{' '}
          <span className="text-sm font-medium text-text-grey">FCFA{isLocation ? '/mois' : ''}</span>
        </p>
        <p className="text-sm font-medium text-text-dark mt-0.5">{label}</p>
        <div className="flex items-center gap-1 mt-1.5">
          <svg className="w-3.5 h-3.5 text-text-grey flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-xs text-text-grey truncate">
            {bien.localisation?.quartier ? `${bien.localisation.quartier}, ` : ''}{bien.localisation?.ville || '—'}
          </p>
        </div>
        {/* Frais visite desktop (visible sur md+) */}
        {bien.frais_visite && Number(bien.frais_visite) > 0 && (
          <p className="hidden md:block text-xs text-text-grey mt-2 pt-2 border-t border-divider">
            Frais visite : <span className="font-semibold text-secondary">{Number(bien.frais_visite).toLocaleString('fr-FR')} FCFA</span>
          </p>
        )}
      </div>
    </div>
  )
}
