import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { biensApi } from '../../api/biensApi'
import { favoritesApi } from '../../api/favoritesApi'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import BienCard from '../../components/BienCard'
import Reveal from '../../components/Reveal'
import { rechercherQuartiers, trouverQuartierExact, type Quartier, VILLES_AVEC_QUARTIERS } from '../../data/quartiers'
import { getQuartierCoords, haversineKm, distanceEntreQuartiers } from '../../data/quartierProximite'

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

const BUDGET_TOLERANCE = 10_000
const PROXIMITY_MAX_KM = 3

function inBudgetRange(bien: any, prixMin: string, prixMax: string) {
  const p = Number(bien.prix)
  if (prixMin && p < Number(prixMin)) return false
  if (prixMax && p > Number(prixMax)) return false
  return true
}

function isBudgetVoisin(bien: any, prixMin: string, prixMax: string) {
  const p = Number(bien.prix)
  if (prixMin && p < Number(prixMin) && p >= Number(prixMin) - BUDGET_TOLERANCE) return true
  if (prixMax && p > Number(prixMax) && p <= Number(prixMax) + BUDGET_TOLERANCE) return true
  return false
}

const TRANSACTIONS = [
  { key: '',         label: 'Tous' },
  { key: 'location', label: 'À louer' },
  { key: 'vente',    label: 'À vendre' },
]

const TYPES = [
  { key: '',              label: 'Tous' },
  { key: 'maison',        label: 'Maison' },
  { key: 'appart_vide',   label: 'Appart. vide' },
  { key: 'appart_meuble', label: 'Appart. meublé' },
  { key: 'terrain',       label: 'Terrain' },
  { key: 'guesthouse',    label: 'Guesthouse' },
]

const SOUS_TYPES = [
  { key: 'chambre_salon',       label: 'Chambre-Salon' },
  { key: 'entree_coucher',      label: 'Entrée-Coucher' },
  { key: 'appartement',         label: 'Appartement' },
  { key: 'appart_meuble',       label: 'Appart. meublé' },
  { key: 'villa',               label: 'Villa' },
  { key: 'maison_individuelle', label: 'Maison individuelle' },
  { key: 'boutique',            label: 'Boutique' },
  { key: 'terrain',             label: 'Terrain' },
]

const SORTS = [
  { key: 'pertinence', label: 'Pertinence' },
  { key: 'prix_asc',   label: 'Prix croissant' },
  { key: 'prix_desc',  label: 'Prix décroissant' },
]

const BUDGET_PRESETS = [
  { label: '< 50K',  max: 50_000 },
  { label: '< 150K', max: 150_000 },
  { label: '< 500K', max: 500_000 },
  { label: '< 1M',   max: 1_000_000 },
  { label: '< 5M',   max: 5_000_000 },
]

/* ── Icônes SVG ── */
const PinIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const XIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const BackIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)
const FilterIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)
const SortAscIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m8 0l4-4m0 0l4 4m-4-4v12" />
  </svg>
)
const SortDescIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m8 4l4 4m0 0l4-4m-4 4V8" />
  </svg>
)
const SortRelevanceIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/>
  </svg>
)
const ClearIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const SORT_ICONS: Record<string, React.ReactNode> = {
  pertinence: <SortRelevanceIcon />,
  prix_asc:   <SortAscIcon />,
  prix_desc:  <SortDescIcon />,
}

function fmtFcfa(v: string) {
  const n = Number(v.replace(/\D/g, ''))
  if (!n) return ''
  return n.toLocaleString('fr-FR')
}

/* ── Tokens thème centralisés ── */
function useTokens(isDark: boolean) {
  return {
    sidebarBg:      isDark ? 'rgba(14,14,24,0.97)'    : 'rgba(255,255,255,0.90)',
    sidebarBdr:     isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    fieldBg:        isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.80)',
    fieldBdr:       isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)',
    divider:        isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    textClr:        isDark ? '#E8E8EF'                : '#1D1D1F',
    labelClr:       isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.42)',
    pageBg:         isDark ? 'rgba(15,15,20,1)'       : 'rgba(245,245,247,1)',
    headerBg:       isDark ? 'rgba(14,14,24,0.97)'    : 'rgba(245,245,247,0.96)',
    headerBdr:      isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    suggestBg:      isDark ? 'rgba(20,20,32,0.98)'    : '#ffffff',
    suggestBdr:     isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
    suggestHover:   isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    pillIdle: {
      background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.70)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.09)'}`,
      color: isDark ? 'rgba(255,255,255,0.52)' : 'rgba(0,0,0,0.52)',
      boxShadow: isDark ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
    } as React.CSSProperties,
    pillActive: {
      background: 'rgba(75,107,255,0.14)',
      border: '1px solid rgba(75,107,255,0.40)',
      color: '#4B6BFF',
      boxShadow: isDark ? '0 0 0 1px rgba(75,107,255,0.20)' : 'inset 0 1.5px 0 rgba(255,255,255,0.9)',
    } as React.CSSProperties,
    chipStyle: {
      background: 'rgba(75,107,255,0.12)',
      border: '1px solid rgba(75,107,255,0.30)',
      color: '#4B6BFF',
    } as React.CSSProperties,
  }
}

/* ══════════════════════════════════════════════════════════════
   Composant principal
   ══════════════════════════════════════════════════════════════ */
export default function SearchPage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const tk = useTokens(isDark)

  const initialParams = new URLSearchParams(window.location.search)
  const [query,         setQuery]         = useState(initialParams.get('q') || '')
  const [transaction,   setTransaction]   = useState(initialParams.get('transaction') || '')
  const [type,          setType]          = useState(initialParams.get('type') || '')
  const [prixMin,       setPrixMin]       = useState(initialParams.get('prix_min') || '')
  const [prixMax,       setPrixMax]       = useState(initialParams.get('prix_max') || '')
  const [sousType,      setSousType]      = useState(initialParams.get('sous_type') || '')
  const [chambresMin,   setChambresMin]   = useState('')
  const [salonsMin,     setSalonsMin]     = useState('')
  const [superficieMin, setSuperficieMin] = useState('')
  const [superficieMax, setSuperficieMax] = useState('')
  const [sortBy,        setSortBy]        = useState<'pertinence' | 'prix_asc' | 'prix_desc'>('pertinence')

  const [allBiens,    setAllBiens]    = useState<any[]>([])
  const [wideBiens,   setWideBiens]   = useState<any[]>([])
  const [favIds,      setFavIds]      = useState<Set<number>>(new Set())
  const [loading,     setLoading]     = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [showSuggest, setShowSuggest] = useState(false)
  const [showAllAutres, setShowAllAutres] = useState(false)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sidebarRef   = useRef<HTMLElement>(null)
  const scrollTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const el = sidebarRef.current
    if (!el) return
    const onScroll = () => {
      el.classList.add('is-scrolling')
      if (scrollTimer.current) clearTimeout(scrollTimer.current)
      scrollTimer.current = setTimeout(() => el.classList.remove('is-scrolling'), 800)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => { el.removeEventListener('scroll', onScroll); if (scrollTimer.current) clearTimeout(scrollTimer.current) }
  }, [])

  useEffect(() => {
    biensApi.list({ limit: 200 })
      .then(data => { setWideBiens(Array.isArray(data) ? data : data.data || []) })
      .catch(() => {})
  }, [])

  useEffect(() => { setShowAllAutres(false) }, [allBiens])

  const suggestions: Quartier[] = query.trim().length >= 1 ? rechercherQuartiers(query) : []
  const pickSuggestion = (q: Quartier) => { setQuery(q.nom); setShowSuggest(false) }

  useEffect(() => {
    if (!isLoggedIn) return
    favoritesApi.list()
      .then(d => {
        const l = Array.isArray(d) ? d : d.data || []
        setFavIds(new Set(l.map((f: any) => f.bien_id || f.id)))
      })
      .catch(() => {})
  }, [isLoggedIn])

  const countPiece = (bien: any, nom: string) => (bien.pieces || []).filter((p: any) => p.nom === nom).length

  const nonLocationFilters = useCallback((biens: any[]) => {
    let filtered = biens
    if (sousType) filtered = filtered.filter(b => b.amenites?.sous_type === sousType)
    if (chambresMin) filtered = filtered.filter(b => countPiece(b, 'Chambre') >= Number(chambresMin))
    if (salonsMin) filtered = filtered.filter(b => countPiece(b, 'Salon') >= Number(salonsMin))
    if (superficieMin || superficieMax) {
      filtered = filtered.filter(b => {
        const s = b.details_terrain?.superficie || b.details_maison?.superficie
        if (!s) return false
        if (superficieMin && s < Number(superficieMin)) return false
        if (superficieMax && s > Number(superficieMax)) return false
        return true
      })
    }
    return filtered
  }, [sousType, chambresMin, salonsMin, superficieMin, superficieMax])

  const applySort = useCallback((biens: any[], q: string) => {
    if (sortBy === 'prix_asc')  return [...biens].sort((a, b) => Number(a.prix) - Number(b.prix))
    if (sortBy === 'prix_desc') return [...biens].sort((a, b) => Number(b.prix) - Number(a.prix))
    if (!q) return biens
    const nq = norm(q)
    const score = (b: any) => {
      if (b.localisation?.quartier && norm(b.localisation.quartier).includes(nq)) return 2
      if (b.localisation?.ville && norm(b.localisation.ville).includes(nq)) return 1
      return 0
    }
    return [...biens].sort((a, b) => score(b) - score(a))
  }, [sortBy])

  const matchedQuartier = useMemo(() => {
    const q = query.trim()
    return q.length >= 2 ? trouverQuartierExact(q) : undefined
  }, [query])

  const search = useMemo(() => {
    const base     = nonLocationFilters(allBiens)
    const wideBase = nonLocationFilters(wideBiens)
    const inBudget = base.filter(b => inBudgetRange(b, prixMin, prixMax))

    let mainResults: any[] = [], environs: any[] = [], environsLabel = ''
    let isProximityFallback = false
    let quartierRecherche: string | undefined
    const environsDist = new Map<number, number>()

    if (matchedQuartier) {
      quartierRecherche = matchedQuartier.nom
      const qn    = norm(matchedQuartier.nom)
      const exact = inBudget.filter(b => norm(b.localisation?.quartier || '') === qn)

      if (exact.length > 0) {
        mainResults = applySort(exact, '')
        const restVille = inBudget.filter(b =>
          norm(b.localisation?.ville || '') === norm(matchedQuartier.ville) &&
          norm(b.localisation?.quartier || '') !== qn
        )
        environs = applySort(restVille, '')
        environsLabel = `Autres biens à ${matchedQuartier.ville}`
      } else {
        const withDist: { bien: any; km: number }[] = []
        for (const b of inBudget) {
          const bq = b.localisation?.quartier
          if (!bq) continue
          const km = distanceEntreQuartiers(matchedQuartier.nom, bq)
          if (km != null && km <= PROXIMITY_MAX_KM) withDist.push({ bien: b, km })
        }
        withDist.sort((a, z) => a.km - z.km)
        if (withDist.length > 0) {
          isProximityFallback = true
          environs = withDist.map(x => x.bien)
          withDist.forEach(x => environsDist.set(x.bien.id, x.km))
          environsLabel = `Quartiers à moins de ${PROXIMITY_MAX_KM} km`
        } else {
          const cityFallback = inBudget.filter(b =>
            norm(b.localisation?.ville || '') === norm(matchedQuartier.ville)
          )
          environs = applySort(cityFallback, '')
          environsLabel = cityFallback.length > 0 ? `Biens disponibles à ${matchedQuartier.ville}` : ''
        }
      }
    } else {
      mainResults = applySort(
        base.filter(b => matchLoc(b, query.trim())).filter(b => inBudgetRange(b, prixMin, prixMax)),
        query.trim()
      )
    }

    const shownIds       = new Set([...mainResults, ...environs].map((b: any) => b.id))
    const widePool       = [...wideBase, ...base.filter(b => !wideBase.some((w: any) => w.id === b.id))]
    const pool           = widePool.filter(b => !shownIds.has(b.id))
    const budgetSimilar  = (prixMin || prixMax) ? pool.filter(b => isBudgetVoisin(b, prixMin, prixMax)) : []
    const budgetSimilarIds = new Set(budgetSimilar.map(b => b.id))
    const autres         = pool.filter(b => !budgetSimilarIds.has(b.id))

    const distFromQuartier = (b: any): number | null => {
      if (!matchedQuartier) return null
      const bq = b.localisation?.quartier
      if (!bq) return null
      return distanceEntreQuartiers(matchedQuartier.nom, bq)
    }

    return { mainResults, environs, environsLabel, environsDist, budgetSimilar, autres, distFromQuartier, isProximityFallback, quartierRecherche }
  }, [allBiens, wideBiens, matchedQuartier, query, prixMin, prixMax, nonLocationFilters, applySort])

  const results = search.mainResults

  const refCoords = !matchedQuartier && query.trim().length >= 2 ? getQuartierCoords(query.trim()) : null
  const distanceFor = (bien: any): number | null => {
    if (matchedQuartier) return search.distFromQuartier(bien)
    if (!refCoords) return null
    const q = bien.localisation?.quartier
    if (!q) return null
    const c = getQuartierCoords(q)
    if (!c) return null
    return haversineKm(refCoords.lat, refCoords.lng, c.lat, c.lng)
  }

  const fetchBiens = useCallback(async (params: any) => {
    setLoading(true)
    try {
      const data = await biensApi.list(params)
      setAllBiens(Array.isArray(data) ? data : data.data || [])
    } catch (_) { setAllBiens([]) }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params: any = { limit: 150 }
      if (transaction) params.transaction = transaction
      if (type)        params.type        = type
      const nq = norm(query.trim())
      const matchedVille = VILLES_AVEC_QUARTIERS.find(v => norm(v).includes(nq) || nq.includes(norm(v)))
      if (nq.length >= 2 && matchedVille) params.ville = norm(matchedVille)
      fetchBiens(params)
    }, 420)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, transaction, type, fetchBiens])

  const reset = () => {
    setQuery(''); setTransaction(''); setType(''); setPrixMin(''); setPrixMax('')
    setSousType(''); setChambresMin(''); setSalonsMin(''); setSuperficieMin(''); setSuperficieMax(''); setSortBy('pertinence')
  }

  type Chip = { label: string; onRemove: () => void }
  const chips: Chip[] = []
  if (query)         chips.push({ label: query,                                                       onRemove: () => setQuery('') })
  if (transaction)   chips.push({ label: TRANSACTIONS.find(t => t.key === transaction)?.label ?? transaction, onRemove: () => setTransaction('') })
  if (type)          chips.push({ label: TYPES.find(t => t.key === type)?.label ?? type,              onRemove: () => setType('') })
  if (prixMin)       chips.push({ label: `≥ ${fmtFcfa(prixMin)} FCFA`,                               onRemove: () => setPrixMin('') })
  if (prixMax)       chips.push({ label: `≤ ${fmtFcfa(prixMax)} FCFA`,                               onRemove: () => setPrixMax('') })
  if (sousType)      chips.push({ label: SOUS_TYPES.find(t => t.key === sousType)?.label ?? sousType, onRemove: () => setSousType('') })
  if (chambresMin)   chips.push({ label: `≥ ${chambresMin} chambre${Number(chambresMin) > 1 ? 's' : ''}`, onRemove: () => setChambresMin('') })
  if (salonsMin)     chips.push({ label: `≥ ${salonsMin} salon${Number(salonsMin) > 1 ? 's' : ''}`,       onRemove: () => setSalonsMin('') })
  if (superficieMin) chips.push({ label: `≥ ${superficieMin} m²`, onRemove: () => setSuperficieMin('') })
  if (superficieMax) chips.push({ label: `≤ ${superficieMax} m²`, onRemove: () => setSuperficieMax('') })
  const hasFilters = chips.length > 0

  const fp = {
    isDark, tk, transaction, setTransaction, type, setType,
    prixMin, setPrixMin, prixMax, setPrixMax,
    sousType, setSousType, chambresMin, setChambresMin,
    salonsMin, setSalonsMin, superficieMin, setSuperficieMin, superficieMax, setSuperficieMax,
  }

  const sharedResults = { search, loading, favIds, isDark, tk, showAllAutres, setShowAllAutres, mainDistanceFor: distanceFor }
  const onFavToggle   = (id: number, added: boolean) => setFavIds(prev => { const n = new Set(prev); added ? n.add(id) : n.delete(id); return n })

  return (
    <div className="min-h-full">

      {/* ══════════════ MOBILE ══════════════ */}
      <div className="lg:hidden">

        {/* Header sticky */}
        <div className="sticky top-0 z-30 px-4 pt-3 pb-3"
          style={{
            background: tk.headerBg,
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderBottom: `1px solid ${tk.headerBdr}`,
          }}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <button onClick={() => navigate(-1)}
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl transition-all"
              style={{ background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}`, color: tk.textClr }}
            >
              <BackIcon />
            </button>

            <div className="flex-1 relative">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
                style={{ background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}`, color: tk.textClr }}
              >
                <span style={{ color: tk.labelClr }}><PinIcon /></span>
                <input
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowSuggest(true) }}
                  onFocus={() => setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                  placeholder="Ville ou quartier…"
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm"
                  style={{ color: tk.textClr }}
                />
                {query && (
                  <button onClick={() => setQuery('')} style={{ color: tk.labelClr }}>
                    <ClearIcon />
                  </button>
                )}
              </div>
              {suggestions.length > 0 && showSuggest && (
                <SuggestDropdown suggestions={suggestions} onPick={pickSuggestion} tk={tk} />
              )}
            </div>

            <button
              onClick={() => setMobileOpen(o => !o)}
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl relative transition-all"
              style={hasFilters ? tk.pillActive : { background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}`, color: tk.textClr }}
            >
              <FilterIcon />
              {hasFilters && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                  style={{ background: '#4B6BFF' }}>
                  {chips.length}
                </span>
              )}
            </button>
          </div>

          {chips.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {chips.map(chip => (
                <button key={chip.label} onClick={chip.onRemove}
                  className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={tk.chipStyle}
                >
                  {chip.label}<XIcon />
                </button>
              ))}
              <button onClick={reset} className="flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full" style={{ color: tk.labelClr }}>
                Tout effacer
              </button>
            </div>
          )}
        </div>

        {mobileOpen && (
          <div className="px-4 pb-4 pt-4 border-b anim-fade-down"
            style={{
              background: isDark ? 'rgba(16,16,26,0.99)' : 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(40px)',
              borderColor: tk.sidebarBdr,
            }}
          >
            <FilterPanel {...fp} />
          </div>
        )}

        <div className="px-4 md:px-6 py-4">
          <ResultHeader
            count={results.length} loading={loading} hasFilters={hasFilters} reset={reset}
            sortBy={sortBy} setSortBy={setSortBy} tk={tk}
          />
          <GuidedResults {...sharedResults} onFavToggle={onFavToggle} cols="grid-cols-1 sm:grid-cols-2 md:grid-cols-3" />
        </div>
      </div>

      {/* ══════════════ DESKTOP ══════════════ */}
      <div className="hidden lg:flex min-h-full">

        {/* Sidebar filtres */}
        <aside
          ref={sidebarRef}
          className="w-[280px] xl:w-[300px] flex-shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto scrollbar-auto"
          style={{
            background: tk.sidebarBg,
            backdropFilter: 'blur(48px)',
            WebkitBackdropFilter: 'blur(48px)',
            borderRight: `1px solid ${tk.sidebarBdr}`,
          }}
        >
          {/* En-tête sidebar sticky */}
          <div className="sticky top-0 z-10 px-5 pt-5 pb-3"
            style={{
              background: tk.sidebarBg,
              backdropFilter: 'blur(48px)',
              WebkitBackdropFilter: 'blur(48px)',
              borderBottom: `1px solid ${tk.divider}`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(75,107,255,0.14)', color: '#4B6BFF' }}>
                  <FilterIcon />
                </div>
                <h2 className="font-bold text-sm" style={{ color: tk.textClr }}>Filtres</h2>
              </div>
              {hasFilters && (
                <button onClick={reset}
                  className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-all"
                  style={{ color: '#4B6BFF', background: 'rgba(75,107,255,0.10)' }}>
                  <ClearIcon />Effacer
                </button>
              )}
            </div>

            {/* Chips filtres actifs */}
            {chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-1">
                {chips.map(chip => (
                  <button key={chip.label} onClick={chip.onRemove}
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                    style={tk.chipStyle}
                  >
                    {chip.label}<XIcon />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-5">
            {/* Localisation */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: tk.labelClr }}>
                Localisation
              </label>
              <div className="relative">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
                  style={{ background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}` }}>
                  <span style={{ color: tk.labelClr }}><PinIcon /></span>
                  <input
                    value={query}
                    onChange={e => { setQuery(e.target.value); setShowSuggest(true) }}
                    onFocus={() => setShowSuggest(true)}
                    onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                    placeholder="Cotonou, Adovié, Akpakpa…"
                    className="flex-1 min-w-0 bg-transparent outline-none text-sm"
                    style={{ color: tk.textClr }}
                  />
                  {query && (
                    <button onClick={() => setQuery('')} style={{ color: tk.labelClr }}>
                      <ClearIcon />
                    </button>
                  )}
                </div>
                {suggestions.length > 0 && showSuggest && (
                  <SuggestDropdown suggestions={suggestions} onPick={pickSuggestion} tk={tk} />
                )}
              </div>
            </div>

            <div className="h-px mb-4" style={{ background: tk.divider }} />

            <FilterPanel {...fp} />
          </div>
        </aside>

        {/* Zone résultats */}
        <div className="flex-1 px-6 py-5 min-w-0">
          <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold" style={{ color: tk.textClr }}>Recherche avancée</h1>
              <p className="text-xs mt-0.5" style={{ color: tk.labelClr }}>Tous les biens disponibles au Bénin</p>
            </div>
            <ResultHeader
              count={results.length} loading={loading} hasFilters={hasFilters} reset={reset}
              sortBy={sortBy} setSortBy={setSortBy} inline tk={tk}
            />
          </div>

          <GuidedResults {...sharedResults} onFavToggle={onFavToggle} cols="grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
        </div>
      </div>
    </div>
  )
}

/* ── Dropdown suggestions ── */
function SuggestDropdown({ suggestions, onPick, tk }: {
  suggestions: Quartier[]; onPick: (q: Quartier) => void; tk: ReturnType<typeof useTokens>
}) {
  return (
    <div className="absolute z-40 mt-1 w-full rounded-2xl overflow-hidden"
      style={{
        background: tk.suggestBg,
        border: `1px solid ${tk.suggestBdr}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        backdropFilter: 'blur(32px)',
      }}
    >
      {suggestions.map((q, i) => (
        <button key={`${q.nom}-${i}`} type="button" onClick={() => onPick(q)}
          className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors"
          style={{
            color: tk.textClr,
            borderBottom: i < suggestions.length - 1 ? `1px solid ${tk.suggestBdr}` : 'none',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = tk.suggestHover)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span className="font-semibold">{q.nom}</span>
          <span className="text-xs flex-shrink-0" style={{ color: tk.labelClr }}>{q.ville}</span>
        </button>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   FilterPanel
   ══════════════════════════════════════════════════════════════ */
type FilterPanelProps = {
  isDark: boolean; tk: ReturnType<typeof useTokens>
  transaction: string; setTransaction: (v: string) => void
  type: string; setType: (v: string) => void
  prixMin: string; setPrixMin: (v: string) => void
  prixMax: string; setPrixMax: (v: string) => void
  sousType: string; setSousType: (v: string) => void
  chambresMin: string; setChambresMin: (v: string) => void
  salonsMin: string; setSalonsMin: (v: string) => void
  superficieMin: string; setSuperficieMin: (v: string) => void
  superficieMax: string; setSuperficieMax: (v: string) => void
}

function FilterPanel({
  isDark, tk, transaction, setTransaction, type, setType, prixMin, setPrixMin, prixMax, setPrixMax,
  sousType, setSousType, chambresMin, setChambresMin, salonsMin, setSalonsMin,
  superficieMin, setSuperficieMin, superficieMax, setSuperficieMax,
}: FilterPanelProps) {
  const showSuperficie = type === 'terrain' || sousType === 'terrain'

  return (
    <div className="space-y-4">

      {/* Transaction */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: tk.labelClr }}>
          Transaction
        </label>
        <div className="flex gap-1.5">
          {TRANSACTIONS.map(t => (
            <button key={t.key} onClick={() => setTransaction(t.key)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={transaction === t.key ? tk.pillActive : tk.pillIdle}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type de bien */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: tk.labelClr }}>
          Type de bien
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setType(t.key)}
              className="flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={type === t.key ? tk.pillActive : tk.pillIdle}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sous-type */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: tk.labelClr }}>
          Sous-type
        </label>
        <div className="flex flex-wrap gap-1.5">
          {SOUS_TYPES.map(t => (
            <button key={t.key} onClick={() => setSousType(sousType === t.key ? '' : t.key)}
              className="flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={sousType === t.key ? tk.pillActive : tk.pillIdle}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pièces */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: tk.labelClr }}>
          Pièces minimum
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Stepper label="Chambres" value={chambresMin} onChange={setChambresMin} tk={tk} />
          <Stepper label="Salons"   value={salonsMin}   onChange={setSalonsMin}   tk={tk} />
        </div>
      </div>

      {/* Superficie */}
      {showSuperficie && (
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: tk.labelClr }}>
            Superficie (m²)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Min', value: superficieMin, set: setSuperficieMin, ph: '0' },
              { label: 'Max', value: superficieMax, set: setSuperficieMax, ph: '∞' },
            ].map(f => (
              <div key={f.label}>
                <p className="text-[10px] mb-1 font-medium" style={{ color: tk.labelClr }}>{f.label}</p>
                <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl"
                  style={{ background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}` }}>
                  <input type="number" value={f.value} onChange={e => f.set(e.target.value)}
                    placeholder={f.ph} min={0}
                    className="flex-1 bg-transparent outline-none text-sm min-w-0"
                    style={{ color: tk.textClr }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: tk.labelClr }}>
          Budget (FCFA)
        </label>
        <div className="flex flex-wrap gap-1.5 pb-1 mb-3">
          {BUDGET_PRESETS.map(p => {
            const active = prixMax === String(p.max)
            return (
              <button key={p.max}
                onClick={() => { setPrixMin(''); setPrixMax(active ? '' : String(p.max)) }}
                className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={active ? {
                  background: 'rgba(255,107,53,0.14)',
                  border: '1px solid rgba(255,107,53,0.40)',
                  color: '#FF6B35',
                } : tk.pillIdle}
              >
                {p.label}
              </button>
            )
          })}
        </div>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Min', value: prixMin, set: setPrixMin, ph: '0' },
            { label: 'Max', value: prixMax, set: setPrixMax, ph: '∞' },
          ].map(f => (
            <div key={f.label}>
              <p className="text-[10px] mb-1 font-medium" style={{ color: tk.labelClr }}>{f.label}</p>
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl"
                style={{ background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}` }}>
                <input type="number" value={f.value} onChange={e => f.set(e.target.value)}
                  placeholder={f.ph} min={0}
                  className="flex-1 bg-transparent outline-none text-sm min-w-0"
                  style={{ color: tk.textClr }} />
                <span className="text-[10px] flex-shrink-0 font-medium" style={{ color: tk.labelClr }}>FCFA</span>
              </div>
            </div>
          ))}
        </div>
        {(prixMin || prixMax) && (
          <p className="text-xs mt-2" style={{ color: tk.labelClr }}>
            {prixMin && prixMax
              ? `De ${Number(prixMin).toLocaleString('fr-FR')} à ${Number(prixMax).toLocaleString('fr-FR')} FCFA`
              : prixMin
              ? `À partir de ${Number(prixMin).toLocaleString('fr-FR')} FCFA`
              : `Jusqu'à ${Number(prixMax).toLocaleString('fr-FR')} FCFA`}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Stepper ── */
function Stepper({ label, value, onChange, tk }: {
  label: string; value: string; onChange: (v: string) => void; tk: ReturnType<typeof useTokens>
}) {
  const n = Number(value) || 0
  return (
    <div>
      <p className="text-[10px] mb-1 font-medium" style={{ color: tk.labelClr }}>{label}</p>
      <div className="flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-xl"
        style={{ background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}` }}>
        <button type="button" onClick={() => onChange(n > 0 ? String(n - 1) : '')}
          className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold"
          style={{ background: tk.pillIdle.background as string, color: tk.textClr }}>
          −
        </button>
        <span className="text-sm font-semibold min-w-[1.5rem] text-center" style={{ color: tk.textClr }}>
          {n || '—'}
        </span>
        <button type="button" onClick={() => onChange(String(n + 1))}
          className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold"
          style={{ background: 'rgba(75,107,255,0.14)', color: '#4B6BFF' }}>
          +
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   ResultHeader — tri avec icônes directionnelles
   ══════════════════════════════════════════════════════════════ */
type ResultHeaderProps = {
  count: number; loading: boolean; hasFilters: boolean; reset: () => void; inline?: boolean
  sortBy: 'pertinence' | 'prix_asc' | 'prix_desc'; setSortBy: (v: 'pertinence' | 'prix_asc' | 'prix_desc') => void
  tk: ReturnType<typeof useTokens>
}

function ResultHeader({ count, loading, hasFilters, reset, inline, sortBy, setSortBy, tk }: ResultHeaderProps) {
  if (loading) return (
    <div className={inline ? 'flex items-center' : 'mb-3'}>
      <div className="w-32 h-4 rounded-lg skeleton" />
    </div>
  )
  return (
    <div className={`flex items-center gap-2 flex-wrap ${inline ? '' : 'mb-4'}`}>
      <p className="text-sm font-medium" style={{ color: tk.labelClr }}>
        <strong style={{ color: tk.textClr }} className="font-bold">{count}</strong>{' '}
        résultat{count !== 1 ? 's' : ''}
        {hasFilters && ` trouvé${count !== 1 ? 's' : ''}`}
      </p>
      {hasFilters && count === 0 && (
        <button onClick={reset} className="text-xs font-semibold underline" style={{ color: '#4B6BFF' }}>
          Effacer les filtres
        </button>
      )}

      {/* Tri */}
      <div className="ml-auto flex items-center gap-1 rounded-xl p-1"
        style={{ background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}` }}>
        {SORTS.map(s => {
          const active = sortBy === s.key
          return (
            <button key={s.key}
              onClick={() => setSortBy(s.key as any)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all"
              style={active ? tk.pillActive : { color: tk.labelClr }}
              title={s.label}
            >
              {SORT_ICONS[s.key]}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   ResultGrid
   ══════════════════════════════════════════════════════════════ */
type ResultGridProps = {
  biens: any[]; loading: boolean; favIds: Set<number>; isDark: boolean; tk: ReturnType<typeof useTokens>
  onFavToggle: (id: number, added: boolean) => void; cols: string
  distanceFor?: (bien: any) => number | null
}

function ResultGrid({ biens, loading, favIds, onFavToggle, cols, distanceFor, isDark, tk }: ResultGridProps) {
  if (loading) return (
    <div className={`grid ${cols} gap-3`}>
      {[1, 2, 3, 4, 5, 6].map(n => (
        <div key={n} className="skeleton rounded-2xl h-56" />
      ))}
    </div>
  )

  if (biens.length === 0) return (
    <Reveal animation="anim-fade-in" className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
          style={{ color: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.20)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <p className="font-bold text-sm" style={{ color: tk.textClr }}>Aucun résultat</p>
      <p className="text-xs mt-1 max-w-xs" style={{ color: tk.labelClr }}>
        Aucun bien ne correspond à vos critères. Essayez d'élargir la recherche.
      </p>
    </Reveal>
  )

  return (
    <div className={`grid ${cols} gap-3`}>
      {biens.map((b, i) => (
        <Reveal key={b.id} animation="anim-scale-in" delay={Math.min(i * 50, 300)} className="card-lift">
          <BienCard bien={b} favoriteIds={favIds} onFavoriteToggle={onFavToggle} distanceKm={distanceFor?.(b) ?? null} />
        </Reveal>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   GuidedResults
   ══════════════════════════════════════════════════════════════ */
const AUTRES_PAGE_SIZE = 12

type GuidedSearch = {
  mainResults: any[]; environs: any[]; environsLabel: string; environsDist: Map<number, number>
  budgetSimilar: any[]; autres: any[]; distFromQuartier: (bien: any) => number | null
  isProximityFallback: boolean; quartierRecherche: string | undefined
}

function SectionHeader({ title, subtitle, tk }: { title: string; subtitle?: string; tk: ReturnType<typeof useTokens> }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-bold" style={{ color: tk.textClr }}>{title}</h2>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: tk.labelClr }}>{subtitle}</p>}
    </div>
  )
}

function FallbackBanner({ quartier, isProximity, isDark }: { quartier: string; isProximity: boolean; isDark: boolean }) {
  return (
    <div className="rounded-2xl border-l-4 p-3.5 mb-2"
      style={{
        background: isDark ? 'rgba(245,158,11,0.08)' : '#FFF8E7',
        borderLeftColor: '#F59E0B',
      }}>
      <div className="flex items-start gap-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div>
          <p className="text-sm font-semibold" style={{ color: isDark ? '#FCD34D' : '#92400E' }}>
            Aucun bien disponible à « {quartier} »
          </p>
          <p className="text-xs mt-0.5" style={{ color: isDark ? '#FDE68A' : '#B45309' }}>
            {isProximity
              ? `Biens à moins de ${PROXIMITY_MAX_KM} km — triés par distance`
              : 'Voici les biens disponibles dans les environs'}
          </p>
        </div>
      </div>
    </div>
  )
}

function GuidedResults({
  search, loading, favIds, onFavToggle, cols, showAllAutres, setShowAllAutres, mainDistanceFor, isDark, tk,
}: {
  search: GuidedSearch; loading: boolean; favIds: Set<number>; isDark: boolean; tk: ReturnType<typeof useTokens>
  onFavToggle: (id: number, added: boolean) => void; cols: string
  showAllAutres: boolean; setShowAllAutres: (v: boolean) => void
  mainDistanceFor?: (bien: any) => number | null
}) {
  if (loading) return <ResultGrid biens={[]} loading favIds={favIds} onFavToggle={onFavToggle} cols={cols} isDark={isDark} tk={tk} />

  const { mainResults, environs, environsLabel, environsDist, budgetSimilar, autres, distFromQuartier, isProximityFallback, quartierRecherche } = search
  const hasMain      = mainResults.length > 0
  const nothingAtAll = !hasMain && environs.length === 0 && budgetSimilar.length === 0 && autres.length === 0
  const autresToShow = showAllAutres ? autres : autres.slice(0, AUTRES_PAGE_SIZE)
  const gridProps    = { loading: false, favIds, onFavToggle, isDark, tk }

  return (
    <div className="space-y-8">
      {hasMain ? (
        <ResultGrid biens={mainResults} {...gridProps} cols={cols} distanceFor={mainDistanceFor} />
      ) : nothingAtAll ? (
        <ResultGrid biens={[]} {...gridProps} cols={cols} />
      ) : quartierRecherche ? (
        <FallbackBanner quartier={quartierRecherche} isProximity={isProximityFallback} isDark={isDark} />
      ) : (
        <p className="text-sm" style={{ color: tk.labelClr }}>
          Aucun bien ne correspond exactement — voici ce qui s'en rapproche.
        </p>
      )}

      {environs.length > 0 && (
        <section>
          <SectionHeader title={environsLabel} subtitle={isProximityFallback ? 'Distances depuis le quartier recherché' : undefined} tk={tk} />
          <ResultGrid biens={environs} {...gridProps} cols={cols} distanceFor={b => environsDist.get(b.id) ?? distFromQuartier(b)} />
        </section>
      )}

      {budgetSimilar.length > 0 && (
        <section>
          <SectionHeader
            title="Légèrement hors budget"
            subtitle={`± ${BUDGET_TOLERANCE.toLocaleString('fr-FR')} FCFA${quartierRecherche ? ` depuis « ${quartierRecherche} »` : ''}`}
            tk={tk}
          />
          <ResultGrid biens={budgetSimilar} {...gridProps} cols={cols} distanceFor={distFromQuartier} />
        </section>
      )}

      {autres.length > 0 && (
        <section>
          <SectionHeader title="Autres biens disponibles" tk={tk} />
          <ResultGrid biens={autresToShow} {...gridProps} cols={cols} distanceFor={distFromQuartier} />
          {!showAllAutres && autres.length > AUTRES_PAGE_SIZE && (
            <button onClick={() => setShowAllAutres(true)}
              className="mt-4 w-full py-2.5 rounded-2xl text-sm font-semibold transition-all"
              style={{ border: `1px solid ${tk.sidebarBdr}`, color: tk.labelClr, background: tk.fieldBg }}>
              Voir {autres.length - AUTRES_PAGE_SIZE} autres biens
            </button>
          )}
        </section>
      )}
    </div>
  )
}
