import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { biensApi } from '../../api/biensApi'
import { favoritesApi } from '../../api/favoritesApi'
import BienCard from '../../components/BienCard'
import Reveal from '../../components/Reveal'
import HERO_IMG from '../../assets/hero-interior.jpg'

function norm(s: string) {
  return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

function matchLoc(bien: any, query: string) {
  if (!query) return true
  const q = norm(query)
  const fields = [
    bien.localisation?.ville,
    bien.localisation?.quartier,
    bien.localisation?.commune,
    bien.localisation?.adresse,
  ].filter(Boolean).map((f: string) => norm(f))
  return fields.some(f => f.includes(q))
}

type Category = { key: string; label: string }
const CATEGORIES: Category[] = [
  { key: 'Tous',        label: 'Tous' },
  { key: 'location',    label: 'À louer' },
  { key: 'vente',       label: 'À vendre' },
  { key: 'maison',      label: 'Maison' },
  { key: 'appartement', label: 'Appartement' },
  { key: 'terrain',     label: 'Terrain' },
  { key: 'guesthouse',  label: 'Guesthouse' },
]

const BUDGET_PRESETS = [
  { label: '< 50k',  max: 50_000 },
  { label: '< 150k', max: 150_000 },
  { label: '< 500k', max: 500_000 },
  { label: '< 1M',   max: 1_000_000 },
  { label: '< 5M',   max: 5_000_000 },
]

const FilterIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)
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

const PersonIcon = () => (
  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const EmptyIcon = () => (
  <svg className="w-16 h-16" style={{ color: 'rgba(0,0,0,0.2)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
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
  const [showFilters, setShowFilters] = useState(false)
  const [budgetMax, setBudgetMax] = useState<number | null>(null)
  const [prixMin, setPrixMin] = useState('')
  const [prixMax, setPrixMax] = useState('')

  const loadBiens = async (params?: any) => {
    setLoading(true)
    try {
      const hasTransactionFilter = params?.transaction
      const hasTypeFilter = params?.type

      if (!hasTransactionFilter && !hasTypeFilter) {
        const [locData, venteData] = await Promise.all([
          biensApi.list({ ...params, transaction: 'location', limit: 100 }),
          biensApi.list({ ...params, transaction: 'vente',    limit: 100 }),
        ])
        const loc   = Array.isArray(locData)   ? locData   : locData.data   || []
        const vente = Array.isArray(venteData)  ? venteData : venteData.data || []
        setBiens([...loc, ...vente])
      } else {
        const data = await biensApi.list({ ...params, limit: 100 })
        const list = Array.isArray(data) ? data : data.data || []
        setBiens(list)
      }
    } catch (_) {
    }
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
    const params: any = {}
    if (category === 'location' || category === 'vente') {
      params.transaction = category
    } else if (category !== 'Tous') {
      if (category === 'appartement') params.type = 'appart_vide'
      else params.type = category
    }
    loadBiens(params)
  }, [category])

  // Filtrage par ville/quartier côté client — la recherche texte porte sur
  // les biens déjà chargés, sans dépendre d'un filtre "ville" backend qui
  // ne matche jamais un nom de quartier (ex: recherche "Godomey").
  const minVal = prixMin ? Number(prixMin) : null
  const maxVal = budgetMax ?? (prixMax ? Number(prixMax) : null)
  const displayedBiens = biens
    .filter(b => !search.trim() || matchLoc(b, search.trim()))
    .filter(b => minVal == null || Number(b.prix) >= minVal)
    .filter(b => maxVal == null || Number(b.prix) <= maxVal)

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

  const goToSearch = () => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    if (category === 'location' || category === 'vente') params.set('transaction', category)
    else if (category !== 'Tous') params.set('type', category === 'appartement' ? 'appart_vide' : category)
    if (minVal != null) params.set('prix_min', String(minVal))
    if (maxVal != null) params.set('prix_max', String(maxVal))
    const qs = params.toString()
    navigate(qs ? `/search?${qs}` : '/search')
  }

  return (
    <div className="min-h-full overflow-x-hidden">

      {/* ── MOBILE header (caché sur desktop) ── */}
      <div className="md:hidden relative px-4 pt-12 pb-6 overflow-hidden rounded-b-3xl" style={{ background: '#0a0a0a' }}>
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.65))' }} />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest">REFUGE</p>
              <h1 className="text-white text-2xl font-bold mt-1">
                {isLoggedIn ? `Bonjour, ${firstName}` : 'Trouvez votre bien'}
              </h1>
            </div>
            <button
              onClick={() => navigate(isLoggedIn ? '/profil' : '/login')}
              className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)', boxShadow: '0 4px 12px rgba(75,107,255,0.4)' }}
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
          {/* Barre recherche mobile — glass sur image sombre */}
          <div className="w-full rounded-xl flex items-center px-4 py-3.5 gap-3"
            style={{
              background: 'rgba(255,255,255,0.16)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.25)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            <svg className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.6)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') goToSearch() }}
              placeholder="Ville, quartier, type de bien…"
              className="flex-1 text-sm bg-transparent outline-none text-white placeholder-white/50"
            />
          </div>
        </div>
      </div>

      {/* ── DESKTOP hero image pleine largeur ── */}
      <div className="hidden md:flex relative w-full flex-col justify-end -mt-16" style={{ minHeight: '88vh' }}>
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.40) 50%, rgba(0,0,0,0.20) 100%)' }} />

        <div className="relative z-10 w-full px-16 pb-16">
          <p className="text-white/60 text-sm uppercase tracking-widest font-medium mb-4 anim-fade-up">
            Immobilier au Bénin — Annonces vérifiées
          </p>
          <h1 className="text-white font-bold leading-[1.05] tracking-tight mb-5 anim-blur-up d-100" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
            Trouvez votre logement idéal.<br />Habitez en confiance.
          </h1>
          <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-xl anim-fade-up d-300">
            Maisons, appartements, terrains — à Cotonou, Abomey-Calavi et partout au Bénin.
          </p>

          {/* Barre de recherche — glass clair sur fond sombre de l'image */}
          <div className="flex items-center w-full max-w-2xl rounded-2xl overflow-hidden anim-scale-in d-400"
            style={{
              background: 'rgba(255,255,255,0.16)',
              backdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.28)',
              boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.35), 0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <div className="flex items-center gap-3 px-5 py-4 flex-1">
              <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') goToSearch() }}
                placeholder="Ville, quartier, type de bien…"
                className="flex-1 text-sm bg-transparent outline-none text-white placeholder-white/50"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-12 mt-10 pt-10 anim-fade-in d-600" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            {[
              { val: biens.length > 0 ? `${biens.length}+` : '500+', label: 'Annonces disponibles' },
              { val: '5',    label: 'Villes couvertes' },
              { val: '100%', label: 'Biens vérifiés' },
              { val: '24h',  label: 'Réponse garantie' },
            ].map((s, i) => (
              <div key={s.label} className="anim-fade-up" style={{ animationDelay: `${600 + i * 80}ms` }}>
                <p className="text-white font-bold text-3xl tracking-tight">{s.val}</p>
                <p className="text-white/50 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contenu principal (catégories + grille) ── */}
      <div className="w-full px-4 md:px-16 py-4 md:py-8">

        {/* Categories */}
        <Reveal animation="anim-slide-left" className="flex items-center gap-2 overflow-x-auto pb-1 mb-4 md:mb-6 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all pill-hover"
              style={category === cat.key ? {
                background: 'rgba(75,107,255,0.14)',
                border: '1px solid rgba(75,107,255,0.35)',
                color: '#4B6BFF',
                boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.9), 0 2px 12px rgba(75,107,255,0.15)',
                backdropFilter: 'blur(20px)',
              } : {
                background: 'rgba(255,255,255,0.70)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.88)',
                color: 'rgba(0,0,0,0.55)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              {CAT_ICONS[cat.key]}
              <span>{cat.label}</span>
            </button>
          ))}
          <button
            onClick={() => setShowFilters(s => !s)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all pill-hover"
            style={showFilters || budgetMax != null || prixMin || prixMax ? {
              background: 'rgba(75,107,255,0.14)',
              border: '1px solid rgba(75,107,255,0.35)',
              color: '#4B6BFF',
              boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.9), 0 2px 12px rgba(75,107,255,0.15)',
              backdropFilter: 'blur(20px)',
            } : {
              background: 'rgba(255,255,255,0.70)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.88)',
              color: 'rgba(0,0,0,0.55)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <FilterIcon />
            <span>Filtres</span>
          </button>
        </Reveal>

        {/* Budget — panneau repliable */}
        {showFilters && (
          <Reveal animation="anim-fade-up" className="glass-card rounded-2xl p-4 mb-4">
            <p className="text-xs font-bold text-text-dark uppercase tracking-wide mb-2.5">Budget (FCFA)</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {BUDGET_PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => { setBudgetMax(prev => prev === p.max ? null : p.max); setPrixMin(''); setPrixMax('') }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                  style={budgetMax === p.max
                    ? { background: '#4B6BFF', color: '#fff', borderColor: '#4B6BFF' }
                    : { background: '#fff', color: '#6E6E73', borderColor: 'rgba(0,0,0,0.08)' }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number" min={0} value={prixMin}
                onChange={e => { setPrixMin(e.target.value); setBudgetMax(null) }}
                placeholder="Minimum"
                className="flex-1 border border-divider rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-surface-g"
              />
              <span className="text-text-grey text-sm">—</span>
              <input
                type="number" min={0} value={prixMax}
                onChange={e => { setPrixMax(e.target.value); setBudgetMax(null) }}
                placeholder="Maximum"
                className="flex-1 border border-divider rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-surface-g"
              />
              {(budgetMax != null || prixMin || prixMax) && (
                <button onClick={() => { setBudgetMax(null); setPrixMin(''); setPrixMax('') }} className="text-xs font-semibold text-primary flex-shrink-0">
                  Effacer
                </button>
              )}
            </div>
          </Reveal>
        )}

        {/* Section title */}
        <Reveal animation="anim-fade-up" className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-bold text-text-dark">
            {category === 'Tous' ? 'Toutes les annonces' : catLabel}
            {displayedBiens.length > 0 && (
              <span className="font-normal text-sm ml-2 text-text-grey">({displayedBiens.length})</span>
            )}
          </h2>
          <button onClick={goToSearch} className="text-sm font-semibold text-primary">
            Voir tout
          </button>
        </Reveal>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="skeleton rounded-2xl h-52 md:h-64" />
            ))}
          </div>
        ) : displayedBiens.length === 0 ? (
          <Reveal animation="anim-fade-in" className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 opacity-50"><EmptyIcon /></div>
            <p className="text-text-grey text-sm font-medium">Aucun bien trouvé</p>
          </Reveal>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {displayedBiens.map((bien, idx) => (
              <Reveal
                key={bien.id}
                animation="anim-scale-in"
                delay={Math.min(idx * 60, 360)}
                className="card-lift"
              >
                <BienCard
                  bien={bien}
                  favoriteIds={favIds}
                  onFavoriteToggle={handleFavToggle}
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
