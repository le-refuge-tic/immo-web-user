import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { biensApi } from '../../api/biensApi'
import { favoritesApi } from '../../api/favoritesApi'
import BienCard from '../../components/BienCard'

type Category = { key: string; label: string; icon: string }
const CATEGORIES: Category[] = [
  { key: 'Tous', label: 'Tous', icon: '🏘️' },
  { key: 'maison', label: 'Maison', icon: '🏠' },
  { key: 'appartement', label: 'Appartement', icon: '🏢' },
  { key: 'terrain', label: 'Terrain', icon: '🌿' },
  { key: 'guesthouse', label: 'Guesthouse', icon: '🏡' },
]

export default function HomePage() {
  const { isLoggedIn, user } = useAuth()
  const navigate = useNavigate()
  const [category, setCategory] = useState('Tous')
  const [search, setSearch] = useState('')
  const [biens, setBiens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [favIds, setFavIds] = useState<Set<number>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadBiens = async (params?: any) => {
    setLoading(true)
    try {
      const data = await biensApi.list(params)
      setBiens(Array.isArray(data) ? data : data.data || [])
    } catch (_) {}
    setLoading(false)
  }

  const loadFavs = async () => {
    if (!isLoggedIn) return
    try {
      const data = await favoritesApi.list()
      const list = Array.isArray(data) ? data : data.data || []
      setFavIds(new Set(list.map((f: any) => f.bien_id || f.id)))
    } catch (_) {}
  }

  useEffect(() => {
    loadBiens()
    loadFavs()
  }, [isLoggedIn])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params: any = {}
      if (category !== 'Tous') {
        if (category === 'appartement') params.type = 'appart_vide'
        else params.type = category
      }
      if (search.trim()) params.ville = search.trim()
      loadBiens(params)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [category, search])

  const handleFavToggle = (id: number, added: boolean) => {
    setFavIds(prev => {
      const next = new Set(prev)
      if (added) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const firstName = user?.prenom || user?.nom || 'vous'

  return (
    <div className="min-h-full bg-app-bg">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-[#7B4BFF] px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/80 text-sm">Bonjour 👋</p>
            <h1 className="text-white text-xl font-bold">
              {isLoggedIn ? firstName : 'Bienvenue !'}
            </h1>
          </div>
          <button
            onClick={() => navigate(isLoggedIn ? '/profil' : '/login')}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            {isLoggedIn && user?.photo_profil ? (
              <img src={user.photo_profil} className="w-10 h-10 rounded-full object-cover" alt="" />
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Search bar */}
        <div className="bg-white rounded-2xl flex items-center px-4 py-3 gap-3 shadow-card">
          <svg className="w-5 h-5 text-text-grey flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une ville, quartier…"
            className="flex-1 bg-transparent text-sm text-text-dark placeholder-text-grey outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-text-grey">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            onClick={() => navigate('/search')}
            className="bg-primary text-white px-3 py-1.5 rounded-xl text-xs font-semibold"
          >
            Filtres
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                category === cat.key
                  ? 'bg-primary text-white shadow-btn'
                  : 'bg-white text-text-grey border border-divider'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section: Annonces */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-text-dark">
            {category === 'Tous' ? 'Toutes les annonces' : CATEGORIES.find(c => c.key === category)?.label}
            {biens.length > 0 && <span className="text-text-grey font-normal text-sm ml-2">({biens.length})</span>}
          </h2>
          <button
            onClick={() => navigate('/search')}
            className="text-primary text-sm font-semibold"
          >
            Voir tout
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(n => (
              <div key={n} className="bg-white rounded-2xl h-52 animate-pulse" />
            ))}
          </div>
        ) : biens.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🏚️</div>
            <p className="text-text-grey text-sm">Aucun bien trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {biens.map(bien => (
              <BienCard
                key={bien.id}
                bien={bien}
                favoriteIds={favIds}
                onFavoriteToggle={handleFavToggle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
