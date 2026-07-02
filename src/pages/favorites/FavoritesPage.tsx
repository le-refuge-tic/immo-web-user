import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { favoritesApi } from '../../api/favoritesApi'
import BienCard from '../../components/BienCard'

const HeartBrokenIcon = () => (
  <svg className="w-16 h-16 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
)
const HeartIcon = () => (
  <svg className="w-16 h-16 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
)

export default function FavoritesPage() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [biens, setBiens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [favIds, setFavIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return }
    const load = async () => {
      try {
        const data = await favoritesApi.list()
        const list = Array.isArray(data) ? data : data.data || []
        setBiens(list)
        setFavIds(new Set(list.map((f: any) => f.bien_id || f.id)))
      } catch (_) {}
      setLoading(false)
    }
    load()
  }, [isLoggedIn])

  const handleFavToggle = (id: number, added: boolean) => {
    if (!added) {
      setBiens(prev => prev.filter(b => (b.bien_id || b.id) !== id))
      setFavIds(prev => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  return (
    <div className="min-h-full bg-app-bg">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-text-dark">Mes favoris</h1>
      </div>

      {!isLoggedIn ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="mb-4 opacity-30">
            <HeartIcon />
          </div>
          <p className="text-text-dark font-semibold mb-2">Retrouvez vos favoris</p>
          <p className="text-text-grey text-sm mb-6">Connectez-vous pour sauvegarder vos biens préférés</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-btn"
          >
            Se connecter
          </button>
        </div>
      ) : loading ? (
        <div className="px-4 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-white rounded-2xl h-52 animate-pulse" />
          ))}
        </div>
      ) : biens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="mb-4 opacity-30">
            <HeartBrokenIcon />
          </div>
          <p className="text-text-dark font-semibold mb-1">Aucun favori</p>
          <p className="text-text-grey text-sm mb-5">Ajoutez des biens à vos favoris depuis la page d'accueil</p>
          <button
            onClick={() => navigate('/')}
            className="text-primary font-bold text-sm flex items-center gap-1"
          >
            <span>Explorer les annonces</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="px-4 grid grid-cols-2 gap-3">
          {biens.map(f => {
            const bien = f.bien || f
            return (
              <BienCard
                key={bien.id}
                bien={bien}
                favoriteIds={favIds}
                onFavoriteToggle={handleFavToggle}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
