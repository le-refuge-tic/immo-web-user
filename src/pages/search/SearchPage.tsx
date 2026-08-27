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
  { key: 'prix_asc',   label: 'Prix ↑' },
  { key: 'prix_desc',  label: 'Prix ↓' },
]

const BUDGET_PRESETS = [
  { label: '< 50K',  max: 50_000 },
  { label: '< 150K', max: 150_000 },
  { label: '< 500K', max: 500_000 },
  { label: '< 1M',   max: 1_000_000 },
  { label: '< 5M',   max: 5_000_000 },
]

/* ── Icônes ── */
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
const SortIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M6 12h12M9 17h6" />
  </svg>
)
const ClearIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

function fmtFcfa(v: string) {
  const n = Number(v.replace(/\D/g, ''))
  if (!n) return ''
  return n.toLocaleString('fr-FR')
}

/* ══════════════════════════════════════════════════════════════
   Composant principal
   ══════════════════════════════════════════════════════════════ */
export default function SearchPage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

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

  const [allBiens,      setAllBiens]      = useState<any[]>([])
  const [wideBiens,     setWideBiens]     = useState<any[]>([])
  const [favIds,        setFavIds]        = useState<Set<number>>(new Set())
  const [loading,       setLoading]       = useState(false)
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [showSuggest,   setShowSuggest]   = useState(false)
  const [showAllAutres, setShowAllAutres] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── Tokens thème ── */
  const sidebarBg      = isDark ? 'rgba(14,14,24,0.96)'    : 'rgba(255,255,255,0.88)'
  const sidebarBdr     = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const fieldBg        = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.80)'
  const fieldBdr       = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'
  const textClr        = isDark ? '#E8E8EF'                : '#1D1D1F'
  const labelClr       = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.40)'
  const pillIdle: React.CSSProperties = {
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'}`,
    color: isDark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.50)',
    boxShadow: isDark ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
  }
  const pillActive: React.CSSProperties = {
    background: 'rgba(75,107,255,0.14)',
    border: '1px solid rgba(75,107,255,0.40)',
    color: '#4B6BFF',
    boxShadow: isDark ? '0 0 0 1px rgba(75,107,255,0.20)' : 'inset 0 1.5px 0 rgba(255,255,255,0.9)',
  }
  const chipStyle: React.CSSProperties = {
    background: 'rgba(75,107,255,0.12)',
    border: '1px solid rgba(75,107,255,0.30)',
    color: '#4B6BFF',
  }
  const mobileHeaderBg  = isDark ? 'rgba(14,14,24,0.96)'    : 'rgba(245,245,247,0.94)'
  const mobileHeaderBdr = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const suggestBg       = isDark ? 'rgba(20,20,32,0.98)'    : '#ffffff'
  const suggestBdr      = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'
  const suggestHover    = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'

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

    const shownIds        = new Set([...mainResults, ...environs].map((b: any) => b.id))
    const widePool        = [...wideBase, ...base.filter(b => !wideBase.some((w: any) => w.id === b.id))]
    const pool            = widePool.filter(b => !shownIds.has(b.id))
    const budgetSimilar   = (prixMin || prixMax) ? pool.filter(b => isBudgetVoisin(b, prixMin, prixMax)) : []
    const budgetSimilarIds = new Set(budgetSimilar.map(b => b.id))
    const autres          = pool.filter(b => !budgetSimilarIds.has(b.id))

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
  if (query)         chips.push({ label: query,                                            onRemove: () => setQuery('') })
  if (transaction)   chips.push({ label: TRANSACTIONS.find(t => t.key === transaction)?.label ?? transaction, onRemove: () => setTransaction('') })
  if (type)          chips.push({ label: TYPES.find(t => t.key === type)?.label ?? type,   onRemove: () => setType('') })
  if (prixMin)       chips.push({ label: `≥ ${fmtFcfa(prixMin)} FCFA`,                     onRemove: () => setPrixMin('') })
  if (prixMax)       chips.push({ label: `≤ ${fmtFcfa(prixMax)} FCFA`,                     onRemove: () => setPrixMax('') })
  if (sousType)      chips.push({ label: SOUS_TYPES.find(t => t.key === sousType)?.label ?? sousType, onRemove: () => setSousType('') })
  if (chambresMin)   chips.push({ label: `≥ ${chambresMin} chambre${Number(chambresMin) > 1 ? 's' : ''}`, onRemove: () => setChambresMin('') })
  if (salonsMin)     chips.push({ label: `≥ ${salonsMin} salon${Number(salonsMin) > 1 ? 's' : ''}`,       onRemove: () => setSalonsMin('') })
  if (superficieMin) chips.push({ label: `≥ ${superficieMin} m²`, onRemove: () => setSuperficieMin('') })
  if (superficieMax) chips.push({ label: `≤ ${superficieMax} m²`, onRemove: () => setSuperficieMax('') })
  const hasFilters = chips.length > 0

  const fp = {
    isDark, transaction, setTransaction, type, setType,
    prixMin, setPrixMin, prixMax, setPrixMax,
    sousType, setSousType, chambresMin, setChambresMin,
    salonsMin, setSalonsMin, superficieMin, setSuperficieMin, superficieMax, setSuperficieMax,
    pillIdle, pillActive,
  }

  const sharedResults = { search, loading, favIds, isDark, textClr, labelClr, showAllAutres, setShowAllAutres, mainDistanceFor: distanceFor }
  const onFavToggle   = (id: number, added: boolean) => setFavIds(prev => { const n = new Set(prev); added ? n.add(id) : n.delete(id); return n })

  return (
    <div className="min-h-full">

      {/* ══════════════ MOBILE ══════════════ */}
      <div className="lg:hidden">

        {/* Header sticky */}
        <div className="sticky top-0 z-30 px-4 pt-10 pb-3"
          style={{
            background: mobileHeaderBg,
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderBottom: `1px solid ${mobileHeaderBdr}`,
          }}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <button onClick={() => navigate(-1)}
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl transition-all"
              style={{
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'}`,
                color: textClr,
              }}
            >
              <BackIcon />
            </button>

            <div className="flex-1 relative">
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all"
                style={{ background: fieldBg, border: `1px solid ${fieldBdr}`, color: textClr }}
              >
                <span style={{ color: labelClr }}><PinIcon /></span>
                <input
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowSuggest(true) }}
                  onFocus={() => setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                  placeholder="Ville ou quartier…"
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder-gray-400"
                  style={{ color: textClr }}
                />
                {query && (
                  <button onClick={() => setQuery('')} style={{ color: labelClr }}>
                    <ClearIcon />
                  </button>
                )}
              </div>
              {suggestions.length > 0 && showSuggest && (
                <SuggestDropdown suggestions={suggestions} onPick={pickSuggestion} suggestBg={suggestBg} suggestBdr={suggestBdr} suggestHover={suggestHover} textClr={textClr} labelClr={labelClr} isDark={isDark} />
              )}
            </div>

            <button
              onClick={() => setMobileOpen(o => !o)}
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl relative transition-all"
              style={hasFilters ? { ...pillActive, width: 36, height: 36 } : {
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'}`,
                color: textClr,
              }}
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
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {chips.map(chip => (
                <button key={chip.label} onClick={chip.onRemove}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={chipStyle}
                >
                  {chip.label}
                  <XIcon />
                </button>
              ))}
              <button onClick={reset} className="flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full" style={{ color: labelClr }}>
                Tout effacer
              </button>
            </div>
          )}
        </div>

        {mobileOpen && (
          <div className="px-4 pb-5 pt-4 border-b anim-fade-down"
            style={{
              background: isDark ? 'rgba(18,18,28,0.98)' : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(40px)',
              borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
            }}
          >
            <FilterPanel {...fp} />
          </div>
        )}

        <div className="px-4 md:px-8 py-4 md:py-6">
          <ResultHeader
            count={results.length} loading={loading} hasFilters={hasFilters} reset={reset}
            sortBy={sortBy} setSortBy={setSortBy} isDark={isDark} textClr={textClr} labelClr={labelClr}
            pillIdle={pillIdle} pillActive={pillActive}
          />
          <GuidedResults {...sharedResults} onFavToggle={onFavToggle} cols="grid-cols-1 sm:grid-cols-2 md:grid-cols-3" />
        </div>
      </div>

      {/* ══════════════ DESKTOP ══════════════ */}
      <div className="hidden lg:flex min-h-full">

        <aside
          className="w-[300px] xl:w-[320px] flex-shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto scrollbar-auto"
          style={{
            background: sidebarBg,
            backdropFilter: 'blur(48px)',
            WebkitBackdropFilter: 'blur(48px)',
            borderRight: `1px solid ${sidebarBdr}`,
          }}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(75,107,255,0.14)', color: '#4B6BFF' }}>
                  <FilterIcon />
                </div>
                <h2 className="font-bold text-base" style={{ color: textClr }}>Filtres</h2>
              </div>
              {hasFilters && (
                <button onClick={reset}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
                  style={{ color: '#4B6BFF', background: 'rgba(75,107,255,0.10)' }}>
                  <ClearIcon />
                  Effacer
                </button>
              )}
            </div>

            {/* Localisation */}
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: labelClr }}>
                Ville ou quartier
              </label>
              <div className="relative">
                <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all"
                  style={{
                    background: fieldBg,
                    border: `1px solid ${fieldBdr}`,
                    boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : 'inset 0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <span style={{ color: labelClr }}><PinIcon /></span>
                  <input
                    value={query}
                    onChange={e => { setQuery(e.target.value); setShowSuggest(true) }}
                    onFocus={() => setShowSuggest(true)}
                    onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                    placeholder="Ex: Cotonou, Adovié, Akpakpa…"
                    className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder-gray-400"
                    style={{ color: textClr }}
                  />
                  {query && (
                    <button onClick={() => setQuery('')} style={{ color: labelClr }}>
                      <ClearIcon />
                    </button>
                  )}
                </div>
                {suggestions.length > 0 && showSuggest && (
                  <SuggestDropdown suggestions={suggestions} onPick={pickSuggestion} suggestBg={suggestBg} suggestBdr={suggestBdr} suggestHover={suggestHover} textClr={textClr} labelClr={labelClr} isDark={isDark} />
                )}
              </div>
            </div>

            <div className="h-px mb-5" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

            <FilterPanel {...fp} />

            {chips.length > 0 && (
              <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: labelClr }}>Filtres actifs</p>
                <div className="flex flex-wrap gap-2">
                  {chips.map(chip => (
                    <button key={chip.label} onClick={chip.onRemove}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={chipStyle}
                    >
                      {chip.label}
                      <XIcon />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="flex-1 px-8 py-8 min-w-0">
          <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: textClr }}>Recherche avancée</h1>
              <p className="text-sm mt-1" style={{ color: labelClr }}>Tous les biens disponibles au Bénin</p>
            </div>
            <ResultHeader
              count={results.length} loading={loading} hasFilters={hasFilters} reset={reset}
              sortBy={sortBy} setSortBy={setSortBy} inline isDark={isDark}
              textClr={textClr} labelClr={labelClr} pillIdle={pillIdle} pillActive={pillActive}
            />
          </div>

          <GuidedResults {...sharedResults} onFavToggle={onFavToggle} cols="grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
        </div>
      </div>
    </div>
  )
}

/* ── Dropdown suggestions ── */
function SuggestDropdown({ suggestions, onPick, suggestBg, suggestBdr, suggestHover, textClr, labelClr, isDark }: {
  suggestions: Quartier[]; onPick: (q: Quartier) => void
  suggestBg: string; suggestBdr: string; suggestHover: string; textClr: string; labelClr: string; isDark: boolean
}) {
  return (
    <div className="absolute z-40 mt-1.5 w-full rounded-2xl overflow-hidden"
      style={{
        background: suggestBg,
        border: `1px solid ${suggestBdr}`,
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)' : '0 8px 32px rgba(0,0,0,0.12)',
        backdropFilter: 'blur(32px)',
      }}
    >
      {suggestions.map((q, i) => (
        <button key={`${q.nom}-${i}`} type="button" onClick={() => onPick(q)}
          className="w-full text-left px-4 py-3 text-sm flex items-center justify-between gap-2 transition-colors"
          style={{
            color: textClr,
            borderBottom: i < suggestions.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}` : 'none',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = suggestHover)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span className="font-semibold">{q.nom}</span>
          <span className="text-xs flex-shrink-0" style={{ color: labelClr }}>{q.ville}</span>
        </button>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   FilterPanel
   ══════════════════════════════════════════════════════════════ */
type FilterPanelProps = {
  isDark: boolean
  transaction: string; setTransaction: (v: string) => void
  type: string; setType: (v: string) => void
  prixMin: string; setPrixMin: (v: string) => void
  prixMax: string; setPrixMax: (v: string) => void
  sousType: string; setSousType: (v: string) => void
  chambresMin: string; setChambresMin: (v: string) => void
  salonsMin: string; setSalonsMin: (v: string) => void
  superficieMin: string; setSuperficieMin: (v: string) => void
  superficieMax: string; setSuperficieMax: (v: string) => void
  pillIdle: React.CSSProperties
  pillActive: React.CSSProperties
}

function FilterPanel({
  isDark, transaction, setTransaction, type, setType, prixMin, setPrixMin, prixMax, setPrixMax,
  sousType, setSousType, chambresMin, setChambresMin, salonsMin, setSalonsMin,
  superficieMin, setSuperficieMin, superficieMax, setSuperficieMax, pillIdle, pillActive,
}: FilterPanelProps) {
  const labelClr = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.40)'
  const textClr  = isDark ? '#E8E8EF' : '#1D1D1F'
  const fieldBg  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.80)'
  const fieldBdr = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'
  const showSuperficie = type === 'terrain' || sousType === 'terrain'

  return (
    <div className="space-y-6">

      {/* Transaction */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: labelClr }}>
          Transaction
        </label>
        <div className="flex gap-2">
          {TRANSACTIONS.map(t => (
            <button key={t.key} onClick={() => setTransaction(t.key)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={transaction === t.key ? pillActive : pillIdle}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type de bien */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: labelClr }}>
          Type de bien
        </label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setType(t.key)}
              className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={type === t.key ? pillActive : pillIdle}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sous-type */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: labelClr }}>
          Sous-type
        </label>
        <div className="flex flex-wrap gap-2">
          {SOUS_TYPES.map(t => (
            <button key={t.key} onClick={() => setSousType(sousType === t.key ? '' : t.key)}
              className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={sousType === t.key ? pillActive : pillIdle}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pièces */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: labelClr }}>
          Pièces minimum
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Stepper label="Chambres" value={chambresMin} onChange={setChambresMin} isDark={isDark} />
          <Stepper label="Salons"   value={salonsMin}   onChange={setSalonsMin}   isDark={isDark} />
        </div>
      </div>

      {/* Superficie */}
      {showSuperficie && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: labelClr }}>
            Superficie (m²)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Minimum', value: superficieMin, set: setSuperficieMin, ph: '0' },
              { label: 'Maximum', value: superficieMax, set: setSuperficieMax, ph: 'Illimité' },
            ].map(f => (
              <div key={f.label}>
                <p className="text-[11px] mb-1" style={{ color: labelClr }}>{f.label}</p>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: fieldBg, border: `1px solid ${fieldBdr}` }}>
                  <input type="number" value={f.value} onChange={e => f.set(e.target.value)}
                    placeholder={f.ph} min={0}
                    className="flex-1 bg-transparent outline-none text-sm min-w-0 placeholder-gray-400"
                    style={{ color: textClr }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: labelClr }}>
          Budget (FCFA)
        </label>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 mb-3">
          {BUDGET_PRESETS.map(p => {
            const active = prixMax === String(p.max)
            return (
              <button key={p.max}
                onClick={() => { setPrixMin(''); setPrixMax(active ? '' : String(p.max)) }}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={active ? {
                  background: 'rgba(255,107,53,0.14)',
                  border: '1px solid rgba(255,107,53,0.40)',
                  color: '#FF6B35',
                } : pillIdle}
              >
                {p.label}
              </button>
            )
          })}
        </div>
        <div className="flex flex-col gap-2.5">
          {[
            { label: 'Minimum', value: prixMin, set: setPrixMin, ph: '0' },
            { label: 'Maximum', value: prixMax, set: setPrixMax, ph: 'Illimité' },
          ].map(f => (
            <div key={f.label}>
              <p className="text-[11px] mb-1" style={{ color: labelClr }}>{f.label}</p>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{
                  background: fieldBg,
                  border: `1px solid ${fieldBdr}`,
                  boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : 'inset 0 1px 3px rgba(0,0,0,0.04)',
                }}>
                <input type="number" value={f.value} onChange={e => f.set(e.target.value)}
                  placeholder={f.ph} min={0}
                  className="flex-1 bg-transparent outline-none text-sm min-w-0 placeholder-gray-400"
                  style={{ color: textClr }} />
                <span className="text-[11px] flex-shrink-0" style={{ color: labelClr }}>FCFA</span>
              </div>
            </div>
          ))}
        </div>
        {(prixMin || prixMax) && (
          <p className="text-xs mt-2 pl-1" style={{ color: labelClr }}>
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
function Stepper({ label, value, onChange, isDark }: { label: string; value: string; onChange: (v: string) => void; isDark: boolean }) {
  const n = Number(value) || 0
  const textClr  = isDark ? '#E8E8EF' : '#1D1D1F'
  const labelClr = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.40)'
  const fieldBg  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.80)'
  const fieldBdr = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'
  return (
    <div>
      <p className="text-[11px] mb-1" style={{ color: labelClr }}>{label}</p>
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl"
        style={{ background: fieldBg, border: `1px solid ${fieldBdr}` }}>
        <button type="button" onClick={() => onChange(n > 0 ? String(n - 1) : '')}
          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold"
          style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', color: textClr }}>
          −
        </button>
        <span className="text-sm font-semibold" style={{ color: textClr }}>{n || 'Tout'}</span>
        <button type="button" onClick={() => onChange(String(n + 1))}
          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold"
          style={{ background: 'rgba(75,107,255,0.14)', color: '#4B6BFF' }}>
          +
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   ResultHeader — tri custom (pas de <select> natif)
   ══════════════════════════════════════════════════════════════ */
type ResultHeaderProps = {
  count: number; loading: boolean; hasFilters: boolean; reset: () => void; inline?: boolean
  sortBy: 'pertinence' | 'prix_asc' | 'prix_desc'; setSortBy: (v: 'pertinence' | 'prix_asc' | 'prix_desc') => void
  isDark: boolean; textClr: string; labelClr: string
  pillIdle: React.CSSProperties; pillActive: React.CSSProperties
}

function ResultHeader({ count, loading, hasFilters, reset, inline, sortBy, setSortBy, isDark: _isDark, textClr, labelClr, pillIdle, pillActive }: ResultHeaderProps) {
  if (loading) return (
    <div className={inline ? 'flex items-center' : 'mb-4'}>
      <div className="w-32 h-4 rounded-lg skeleton" />
    </div>
  )
  return (
    <div className={`flex items-center gap-3 flex-wrap ${inline ? '' : 'mb-5'}`}>
      <p className="text-sm font-medium" style={{ color: labelClr }}>
        <strong style={{ color: textClr }} className="font-bold">{count}</strong> résultat{count !== 1 ? 's' : ''}
        {hasFilters && ' trouvé' + (count !== 1 ? 's' : '')}
      </p>
      {hasFilters && count === 0 && (
        <button onClick={reset} className="text-xs font-semibold underline" style={{ color: '#4B6BFF' }}>
          Effacer les filtres
        </button>
      )}
      <div className="ml-auto flex items-center gap-1.5">
        <SortIcon />
        <div className="flex gap-1">
          {SORTS.map(s => (
            <button key={s.key}
              onClick={() => setSortBy(s.key as any)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all"
              style={sortBy === s.key ? pillActive : { ...pillIdle, padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   ResultGrid
   ══════════════════════════════════════════════════════════════ */
type ResultGridProps = {
  biens: any[]; loading: boolean; favIds: Set<number>; isDark: boolean
  onFavToggle: (id: number, added: boolean) => void; cols: string
  distanceFor?: (bien: any) => number | null; textClr: string; labelClr: string
}

function ResultGrid({ biens, loading, favIds, onFavToggle, cols, distanceFor, isDark, textClr, labelClr }: ResultGridProps) {
  if (loading) return (
    <div className={`grid ${cols} gap-3 md:gap-4`}>
      {[1, 2, 3, 4, 5, 6].map(n => (
        <div key={n} className="skeleton rounded-2xl h-56 md:h-64" />
      ))}
    </div>
  )

  if (biens.length === 0) return (
    <Reveal animation="anim-fade-in" className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
        <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
          style={{ color: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.18)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <p className="font-bold text-base" style={{ color: textClr }}>Aucun résultat</p>
      <p className="text-sm mt-1.5 max-w-xs" style={{ color: labelClr }}>
        Aucun bien ne correspond à vos critères. Essayez d'élargir la recherche.
      </p>
    </Reveal>
  )

  return (
    <div className={`grid ${cols} gap-3 md:gap-4`}>
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

function SectionHeader({ title, subtitle, textClr, labelClr }: { title: string; subtitle?: string; textClr: string; labelClr: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base md:text-lg font-bold" style={{ color: textClr }}>{title}</h2>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: labelClr }}>{subtitle}</p>}
    </div>
  )
}

function FallbackBanner({ quartier, isProximity, isDark }: { quartier: string; isProximity: boolean; isDark: boolean }) {
  return (
    <div className="rounded-2xl border-l-4 p-4 mb-2"
      style={{
        background: isDark ? 'rgba(245,158,11,0.08)' : '#FFF8E7',
        borderLeftColor: '#F59E0B',
      }}>
      <div className="flex items-start gap-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div>
          <p className="text-sm font-semibold" style={{ color: isDark ? '#FCD34D' : '#92400E' }}>
            Aucun bien disponible à « {quartier} »
          </p>
          <p className="text-xs mt-0.5" style={{ color: isDark ? '#FDE68A' : '#B45309' }}>
            {isProximity
              ? `Voici les biens disponibles dans la fourchette souhaitée à moins de ${PROXIMITY_MAX_KM} km — triés par distance`
              : 'Voici les biens disponibles dans les environs'}
          </p>
        </div>
      </div>
    </div>
  )
}

function GuidedResults({
  search, loading, favIds, onFavToggle, cols, showAllAutres, setShowAllAutres, mainDistanceFor, isDark, textClr, labelClr,
}: {
  search: GuidedSearch; loading: boolean; favIds: Set<number>; isDark: boolean
  onFavToggle: (id: number, added: boolean) => void; cols: string
  showAllAutres: boolean; setShowAllAutres: (v: boolean) => void
  mainDistanceFor?: (bien: any) => number | null; textClr: string; labelClr: string
}) {
  if (loading) return <ResultGrid biens={[]} loading favIds={favIds} onFavToggle={onFavToggle} cols={cols} isDark={isDark} textClr={textClr} labelClr={labelClr} />

  const { mainResults, environs, environsLabel, environsDist, budgetSimilar, autres, distFromQuartier, isProximityFallback, quartierRecherche } = search
  const hasMain      = mainResults.length > 0
  const nothingAtAll = !hasMain && environs.length === 0 && budgetSimilar.length === 0 && autres.length === 0
  const autresToShow = showAllAutres ? autres : autres.slice(0, AUTRES_PAGE_SIZE)
  const gridProps    = { loading: false, favIds, onFavToggle, isDark, textClr, labelClr }

  return (
    <div className="space-y-10">
      {hasMain ? (
        <ResultGrid biens={mainResults} {...gridProps} cols={cols} distanceFor={mainDistanceFor} />
      ) : nothingAtAll ? (
        <ResultGrid biens={[]} {...gridProps} cols={cols} />
      ) : quartierRecherche ? (
        <FallbackBanner quartier={quartierRecherche} isProximity={isProximityFallback} isDark={isDark} />
      ) : (
        <p className="text-sm" style={{ color: labelClr }}>
          Aucun bien ne correspond exactement à votre recherche — voici ce qui s'en rapproche.
        </p>
      )}

      {environs.length > 0 && (
        <section>
          <SectionHeader title={environsLabel} subtitle={isProximityFallback ? 'Distances calculées depuis le quartier recherché' : undefined} textClr={textClr} labelClr={labelClr} />
          <ResultGrid biens={environs} {...gridProps} cols={cols} distanceFor={b => environsDist.get(b.id) ?? distFromQuartier(b)} />
        </section>
      )}

      {budgetSimilar.length > 0 && (
        <section>
          <SectionHeader
            title="Légèrement hors budget"
            subtitle={`À ± ${BUDGET_TOLERANCE.toLocaleString('fr-FR')} FCFA de votre budget${quartierRecherche ? ` — distances depuis « ${quartierRecherche} »` : ''}`}
            textClr={textClr} labelClr={labelClr}
          />
          <ResultGrid biens={budgetSimilar} {...gridProps} cols={cols} distanceFor={distFromQuartier} />
        </section>
      )}

      {autres.length > 0 && (
        <section>
          <SectionHeader title="Autres biens disponibles" textClr={textClr} labelClr={labelClr} />
          <ResultGrid biens={autresToShow} {...gridProps} cols={cols} distanceFor={distFromQuartier} />
          {!showAllAutres && autres.length > AUTRES_PAGE_SIZE && (
            <button onClick={() => setShowAllAutres(true)}
              className="mt-5 w-full py-3 rounded-2xl text-sm font-semibold transition-all"
              style={{
                border: '1px solid rgba(75,107,255,0.35)',
                color: '#4B6BFF',
                background: 'rgba(75,107,255,0.06)',
              }}>
              Voir plus ({autres.length - AUTRES_PAGE_SIZE} autres)
            </button>
          )}
        </section>
      )}
    </div>
  )
}
