import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { biensApi } from '../../api/biensApi'
import { favoritesApi } from '../../api/favoritesApi'
import BienCard from '../../components/BienCard'

type Category = { key: string; label: string }
const CATEGORIES: Category[] = [
  { key: 'Tous',        label: 'Tous' },
  { key: 'maison',      label: 'Maison' },
  { key: 'appartement', label: 'Appartement' },
  { key: 'terrain',     label: 'Terrain' },
  { key: 'guesthouse',  label: 'Guesthouse' },
]

const LayersIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
)
const HomeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)
const BuildingIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)
const LandscapeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const VillaIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 7l9-4 9 4M4 11h16v10H4V11zM9 11v10M15 11v10M9 7h6" />
  </svg>
)
const SearchIcon = () => (
  <svg className="w-5 h-5 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)
const CloseIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const PersonIcon = () => (
  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const EmptyIcon = () => (
  <svg className="w-16 h-16 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const CAT_ICONS: Record<string, React.ReactNode> = {
  'Tous':        <LayersIcon />,
  'maison':      <HomeIcon />,
  'appartement': <BuildingIcon />,
  'terrain':     <LandscapeIcon />,
  'guesthouse':  <VillaIcon />,
}

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
  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()
  const catLabel = CATEGORIES.find(c => c.key === category)?.label || 'Annonces'

  return (
    <div className="min-h-full bg-app-bg">

      {/* ── MOBILE header (caché sur desktop) ── */}
      <div className="md:hidden bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/60 text-sm">Bonjour,</p>
            <h1 className="text-white text-xl font-bold">
              {isLoggedIn ? firstName : 'Bienvenue'}
            </h1>
          </div>
          <button
            onClick={() => navigate(isLoggedIn ? '/profil' : '/login')}
            className="w-10 h-10 rounded-[13px] flex items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #4B6BFF 0%, #7B4BFF 100%)' }}
          >
            {isLoggedIn && user?.photo_profil ? (
              <img src={user.photo_profil} className="w-10 h-10 object-cover" alt="" />
            ) : isLoggedIn ? (
              <span className="text-white font-bold text-sm">{initials}</span>
            ) : (
              <PersonIcon />
            )}
          </button>
        </div>
        <div className="bg-white rounded-2xl flex items-center px-4 py-3 gap-3 shadow-card">
          <SearchIcon />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une ville, quartier…"
            className="flex-1 bg-transparent text-sm text-text-dark placeholder-text-grey outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-text-grey"><CloseIcon /></button>
          )}
          <button
            onClick={() => navigate('/search')}
            className="bg-primary text-white px-3 py-1.5 rounded-xl text-xs font-semibold"
          >
            Filtres
          </button>
        </div>
      </div>

      {/* ── DESKTOP hero (caché sur mobile) ── */}
      <div
        className="hidden md:block"
        style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1B2838 45%, #0F3460 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest"
                style={{ background: 'rgba(75,107,255,0.2)', color: '#7B9BFF' }}
              >
                Bénin
              </span>
              <span className="text-white/40 text-xs">•</span>
              <span className="text-white/50 text-xs">Des centaines d'annonces vérifiées</span>
            </div>
            <h1 className="text-white text-5xl font-bold leading-[1.1] tracking-tight mb-4">
              Trouvez votre<br />
              <span style={{ color: '#7B9BFF' }}>logement idéal</span><br />
              au Bénin
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-8">
              Maisons, appartements, terrains — achetez ou louez en toute confiance à Cotonou, Abomey-Calavi et partout au Bénin.
            </p>

            {/* Search bar desktop */}
            <div className="bg-white rounded-2xl flex items-center gap-3 p-2 shadow-2xl">
              <div className="flex-1 flex items-center gap-3 px-3">
                <SearchIcon />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Ville, quartier, type de bien…"
                  className="flex-1 bg-transparent text-sm text-text-dark placeholder-text-grey outline-none py-2"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="text-text-grey"><CloseIcon /></button>
                )}
              </div>
              <button
                onClick={() => navigate('/search')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold text-sm"
                style={{ background: '#4B6BFF' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Rechercher
              </button>
            </div>

            {/* Stats rapides */}
            <div className="flex items-center gap-6 mt-6">
              {[
                { val: biens.length > 0 ? `${biens.length}+` : '---', label: 'Annonces' },
                { val: '5', label: 'Villes' },
                { val: '100%', label: 'Vérifiés' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-white font-bold text-xl">{s.val}</p>
                  <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenu principal (catégories + grille) ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-4 md:mb-6" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                category === cat.key
                  ? 'bg-primary text-white shadow-btn'
                  : 'bg-white text-text-grey border border-divider hover:border-primary/40'
              }`}
            >
              {CAT_ICONS[cat.key]}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Section title */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-bold text-text-dark">
            {category === 'Tous' ? 'Toutes les annonces' : catLabel}
            {biens.length > 0 && (
              <span className="text-text-grey font-normal text-sm ml-2">({biens.length})</span>
            )}
          </h2>
          <button onClick={() => navigate('/search')} className="text-primary text-sm font-semibold">
            Voir tout
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="bg-white rounded-2xl h-52 md:h-64 animate-pulse" />
            ))}
          </div>
        ) : biens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 opacity-30"><EmptyIcon /></div>
            <p className="text-text-grey text-sm font-medium">Aucun bien trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
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
