import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { favoritesApi } from '../../api/favoritesApi'
import BienCard from '../../components/BienCard'

export default function FavoritesPage() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [biens, setBiens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [favIds, setFavIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return }
    favoritesApi.list()
      .then(data => {
        const list = Array.isArray(data) ? data : data.data || []
        setBiens(list)
        setFavIds(new Set(list.map((f: any) => f.bien_id || f.id)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isLoggedIn])

  const handleFavToggle = (id: number, added: boolean) => {
    if (!added) {
      setBiens(prev => prev.filter(b => (b.bien_id || b.id) !== id))
      setFavIds(prev => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Supprimer tous vos favoris ? Cette action est irréversible.')) return
    const ids = Array.from(favIds)
    setBiens([])
    setFavIds(new Set())
    try { await Promise.all(ids.map(id => favoritesApi.toggle(id))) } catch (_) {}
  }

  return (
    <div className="min-h-full">
      <div className="w-full px-4 md:px-16">

        {/* Header */}
        <div className="pt-12 md:pt-10 pb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-dark">Mes favoris</h1>
            {biens.length > 0 && (
              <p className="text-sm text-text-grey mt-1">{biens.length} bien{biens.length > 1 ? 's' : ''} sauvegardé{biens.length > 1 ? 's' : ''}</p>
            )}
          </div>
          {biens.length > 0 && (
            <div className="flex items-center gap-4">
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 text-sm font-semibold text-danger hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                </svg>
                Tout supprimer
              </button>
              <button
                onClick={() => navigate('/')}
                className="hidden md:flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Ajouter des biens
              </button>
            </div>
          )}
        </div>

        {!isLoggedIn ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(75,107,255,0.10)' }}>
              <svg className="w-12 h-12 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-dark mb-2">Sauvegardez vos biens préférés</h2>
            <p className="text-text-grey text-sm mb-8 max-w-xs">
              Connectez-vous pour retrouver facilement tous les biens qui vous ont plu
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3.5 rounded-xl font-bold text-white shadow-btn hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #4B6BFF 0%, #7B4BFF 100%)' }}
            >
              Se connecter
            </button>
          </div>

        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="skeleton rounded-2xl h-52 md:h-64" />
            ))}
          </div>

        ) : biens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-surface-g flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-text-grey/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-dark mb-2">Aucun favori pour l'instant</h2>
            <p className="text-text-grey text-sm mb-8 max-w-xs">
              Explorez les annonces et tapez le cœur sur les biens qui vous plaisent
            </p>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white shadow-btn hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #4B6BFF 0%, #7B4BFF 100%)' }}
            >
              Explorer les annonces
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 pb-24 md:pb-8">
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
    </div>
  )
}
