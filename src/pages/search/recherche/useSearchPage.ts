import { useState, useEffect, useRef, useCallback, useMemo, useDeferredValue } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Bien } from '../../../types/api'
import type { BienFavori } from '../../../types/recherche'
import { biensApi, type BiensListParams } from '../../../api/biensApi'
import { favoritesApi } from '../../../api/favoritesApi'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import { rechercherQuartiers, trouverQuartierExact, type Quartier, VILLES_AVEC_QUARTIERS } from '../../../data/quartiers'
import { getQuartierCoords, haversineKm, distanceEntreQuartiers } from '../../../data/quartierProximite'
import { useScrollRestoration } from '../../../hooks/useScrollRestoration'
import { readSearchFilters, writeSearchFilters, type SortKey } from '../../../utils/searchFilters'
import { norm, matchLoc, inBudgetRange, isBudgetVoisin, fmtFcfa } from './helpers'
import { TRANSACTIONS, TYPES, SOUS_TYPES, PAGE_SIZE, PROXIMITY_MAX_KM } from './options'
import { useTokens } from './tokens'

/** État, filtres synchronisés avec l'URL, chargement et calcul des résultats de la page de recherche. */
export function useSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isLoggedIn } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const tk = useTokens(isDark)

  // Tous les filtres vivent dans l'URL (lien partageable, Retour fidèle) : FE-B-009
  const [initial] = useState(() => readSearchFilters(searchParams))
  const [query,         setQuery]         = useState(initial.q)
  const [transaction,   setTransaction]   = useState(initial.transaction)
  const [type,          setType]          = useState(initial.type)
  const [prixMin,       setPrixMin]       = useState(initial.prixMin)
  const [prixMax,       setPrixMax]       = useState(initial.prixMax)
  const [sousType,      setSousType]      = useState(initial.sousType)
  const [chambresMin,   setChambresMin]   = useState(initial.chambresMin)
  const [salonsMin,     setSalonsMin]     = useState(initial.salonsMin)
  const [superficieMin, setSuperficieMin] = useState(initial.superficieMin)
  const [superficieMax, setSuperficieMax] = useState(initial.superficieMax)
  const [sortBy,        setSortBy]        = useState<SortKey>(initial.sortBy)

  useEffect(() => {
    setSearchParams(
      writeSearchFilters({ q: query, transaction, type, prixMin, prixMax, sousType, chambresMin, salonsMin, superficieMin, superficieMax, sortBy }),
      { replace: true },
    )
  }, [query, transaction, type, prixMin, prixMax, sousType, chambresMin, salonsMin, superficieMin, superficieMax, sortBy, setSearchParams])

  // Sens inverse : Précédent / Suivant ou un lien interne vers une autre recherche mettent l'état à jour
  const filtersKey = JSON.stringify(writeSearchFilters({ q: query, transaction, type, prixMin, prixMax, sousType, chambresMin, salonsMin, superficieMin, superficieMax, sortBy }))
  useEffect(() => {
    const fromUrl = readSearchFilters(searchParams)
    if (JSON.stringify(writeSearchFilters(fromUrl)) === filtersKey) return
    setQuery(fromUrl.q); setTransaction(fromUrl.transaction); setType(fromUrl.type)
    setPrixMin(fromUrl.prixMin); setPrixMax(fromUrl.prixMax); setSousType(fromUrl.sousType)
    setChambresMin(fromUrl.chambresMin); setSalonsMin(fromUrl.salonsMin)
    setSuperficieMin(fromUrl.superficieMin); setSuperficieMax(fromUrl.superficieMax); setSortBy(fromUrl.sortBy)
    // Déclenché par l'URL seulement : filtersKey reflète l'état courant au moment du changement d'URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const [allBiens,    setAllBiens]    = useState<Bien[]>([])
  const [total,       setTotal]       = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState(false)
  const lastParamsRef = useRef<Record<string, unknown>>({})
  const pageRef       = useRef(1)
  // Incrémenté à chaque nouvelle recherche : une réponse arrivée après coup est ignorée
  const generationRef = useRef(0)
  const [wideBiens,   setWideBiens]   = useState<Bien[]>([])
  const [favIds,      setFavIds]      = useState<Set<number>>(new Set())
  const [loading,     setLoading]     = useState(false)
  const [fetchError,  setFetchError]  = useState(false)
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

  // Critères hors localisation, appliqués par le serveur : la liste des biens ne charge pas les pièces,
  // un comptage local des chambres/salons rejetterait donc tout (résultats vides dès qu'on filtre les pièces)
  const filterParams = useMemo(() => {
    const params: BiensListParams = {}
    if (sousType) params.sous_type = sousType
    // Nombres normalisés (virgule décimale) ; une valeur illisible est ignorée plutôt que de casser la recherche
    const num = (v: string) => { const n = Number(v.replace(',', '.')); return Number.isFinite(n) && n >= 0 ? n : null }
    const chambres = num(chambresMin), salons = num(salonsMin), supMin = num(superficieMin), supMax = num(superficieMax)
    if (chambresMin && chambres !== null)     params.chambres_min   = Math.floor(chambres)
    if (salonsMin && salons !== null)         params.salons_min     = Math.floor(salons)
    if (superficieMin && supMin !== null)     params.superficie_min = supMin
    if (superficieMax && supMax !== null)     params.superficie_max = supMax
    return params
  }, [sousType, chambresMin, salonsMin, superficieMin, superficieMax])
  const filterParamsKey = JSON.stringify(filterParams)

  // Vivier des suggestions « autres biens » : mêmes critères hors localisation, filtrés par le serveur
  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      biensApi.list({ ...JSON.parse(filterParamsKey), limit: PAGE_SIZE })
        .then(data => { if (!cancelled) setWideBiens(Array.isArray(data) ? data : data.data || []) })
        .catch(() => {})
    }, 420)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [filterParamsKey])

  useEffect(() => { setShowAllAutres(false) }, [allBiens])

  const suggestions: Quartier[] = query.trim().length >= 1 ? rechercherQuartiers(query) : []
  const pickSuggestion = (q: Quartier) => { setQuery(q.nom); setShowSuggest(false) }

  useEffect(() => {
    if (!isLoggedIn) return
    favoritesApi.list()
      .then(d => {
        const l = Array.isArray(d) ? d : d.data || []
        setFavIds(new Set(l.map((f: BienFavori) => f.bien_id || f.id)))
      })
      .catch(() => {})
  }, [isLoggedIn])

  const applySort = useCallback((biens: Bien[], q: string) => {
    if (sortBy === 'prix_asc')  return [...biens].sort((a, b) => Number(a.prix) - Number(b.prix))
    if (sortBy === 'prix_desc') return [...biens].sort((a, b) => Number(b.prix) - Number(a.prix))
    if (!q) return biens
    const nq = norm(q)
    const score = (b: Bien) => {
      if (b.localisation?.quartier && norm(b.localisation.quartier).includes(nq)) return 2
      if (b.localisation?.ville && norm(b.localisation.ville).includes(nq)) return 1
      return 0
    }
    return [...biens].sort((a, b) => score(b) - score(a))
  }, [sortBy])

  // Recalcul filtres/tris/distances différé : la saisie reste fluide sur mobile (FE-D-006)
  const deferredQuery = useDeferredValue(query)

  const matchedQuartier = useMemo(() => {
    const q = deferredQuery.trim()
    return q.length >= 2 ? trouverQuartierExact(q) : undefined
  }, [deferredQuery])

  const search = useMemo(() => {
    // Déjà filtrés par le serveur (type de bien, pièces, superficie) : seuls la localisation et le prix restent locaux
    const base     = allBiens
    const wideBase = wideBiens
    const inBudget = base.filter(b => inBudgetRange(b, prixMin, prixMax))

    let mainResults: Bien[] = [], environs: Bien[] = [], environsLabel = ''
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
        const withDist: { bien: Bien; km: number }[] = []
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
        base.filter(b => matchLoc(b, deferredQuery.trim())).filter(b => inBudgetRange(b, prixMin, prixMax)),
        deferredQuery.trim()
      )
    }

    const shownIds       = new Set([...mainResults, ...environs].map(b => b.id))
    const widePool       = [...wideBase, ...base.filter(b => !wideBase.some(w => w.id === b.id))]
    const pool           = widePool.filter(b => !shownIds.has(b.id))
    const budgetSimilar  = (prixMin || prixMax) ? pool.filter(b => isBudgetVoisin(b, prixMin, prixMax)) : []
    const budgetSimilarIds = new Set(budgetSimilar.map(b => b.id))
    const autres         = pool.filter(b => !budgetSimilarIds.has(b.id))

    const distFromQuartier = (b: Bien): number | null => {
      if (!matchedQuartier) return null
      const bq = b.localisation?.quartier
      if (!bq) return null
      return distanceEntreQuartiers(matchedQuartier.nom, bq)
    }

    return { mainResults, environs, environsLabel, environsDist, budgetSimilar, autres, distFromQuartier, isProximityFallback, quartierRecherche }
  }, [allBiens, wideBiens, matchedQuartier, deferredQuery, prixMin, prixMax, applySort])

  const results = search.mainResults

  const refCoords = !matchedQuartier && deferredQuery.trim().length >= 2 ? getQuartierCoords(deferredQuery.trim()) : null
  const distanceFor = (bien: Bien): number | null => {
    if (matchedQuartier) return search.distFromQuartier(bien)
    if (!refCoords) return null
    const q = bien.localisation?.quartier
    if (!q) return null
    const c = getQuartierCoords(q)
    if (!c) return null
    return haversineKm(refCoords.lat, refCoords.lng, c.lat, c.lng)
  }

  const fetchBiens = useCallback(async (params: BiensListParams) => {
    const generation = ++generationRef.current
    setLoading(true)
    setFetchError(false)
    setLoadMoreError(false)
    setLoadingMore(false)
    lastParamsRef.current = params
    pageRef.current = 1
    try {
      const data = await biensApi.list({ ...params, page: 1 })
      if (generation !== generationRef.current) return
      const list = Array.isArray(data) ? data : data.data || []
      setAllBiens(list)
      setTotal(Array.isArray(data) ? list.length : Number(data.total ?? list.length))
    } catch {
      if (generation !== generationRef.current) return
      // Échec : on n'affiche plus la liste de l'ancienne recherche, ni son total
      setAllBiens([])
      setTotal(0)
      setFetchError(true)
    }
    if (generation === generationRef.current) setLoading(false)
  }, [])

  // Page suivante : s'ajoute à la liste affichée (jamais de troncature silencieuse, FE-D-005)
  const loadMore = useCallback(async () => {
    if (loadingMore || loading) return
    const generation = generationRef.current
    setLoadingMore(true)
    setLoadMoreError(false)
    try {
      const next = pageRef.current + 1
      const data = await biensApi.list({ ...lastParamsRef.current, page: next })
      if (generation !== generationRef.current) return
      const list = Array.isArray(data) ? data : data.data || []
      pageRef.current = next
      setAllBiens(prev => {
        const known = new Set(prev.map(b => b.id))
        return [...prev, ...list.filter(b => !known.has(b.id))]
      })
      if (!Array.isArray(data) && data.total !== undefined) setTotal(Number(data.total))
    } catch {
      // Erreur propre à la page suivante : la liste déjà chargée reste affichée
      if (generation === generationRef.current) setLoadMoreError(true)
    }
    if (generation === generationRef.current) setLoadingMore(false)
  }, [loadingMore, loading])

  const buildParams = useCallback(() => {
    // Filtrés par le serveur : le total et les pages restent justes (FE-D-005).
    // Le prix reste local : il alimente les suggestions « budget voisin ».
    const params: BiensListParams = { ...filterParams, limit: PAGE_SIZE }
    if (transaction) params.transaction = transaction
    if (type)        params.type        = type
    if (sortBy !== 'pertinence') params.tri = sortBy
    const nq = norm(query.trim())
    const matchedVille = VILLES_AVEC_QUARTIERS.find(v => norm(v).includes(nq) || nq.includes(norm(v)))
    if (nq.length >= 2 && matchedVille) params.ville = norm(matchedVille)
    return params
  }, [query, transaction, type, filterParams, sortBy])

  // Clé des paramètres réellement envoyés : taper dans la recherche sans changer de ville ne recharge rien
  const paramsKey = JSON.stringify(buildParams())

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { fetchBiens(JSON.parse(paramsKey)) }, 420)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [paramsKey, fetchBiens])

  const retryFetch = useCallback(() => { fetchBiens(JSON.parse(paramsKey)) }, [paramsKey, fetchBiens])

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

  useScrollRestoration(!loading && allBiens.length > 0)
  // Seul le filtre de prix s'applique encore sur les annonces déjà chargées
  const localFiltersActive = !!(prixMin || prixMax)

  const sharedResults = { search, loading, fetchError, retryFetch, favIds, isDark, tk, showAllAutres, setShowAllAutres, mainDistanceFor: distanceFor }
  const onFavToggle   = (id: number, added: boolean) => setFavIds(prev => { const n = new Set(prev); if (added) n.add(id); else n.delete(id); return n })

  return {
    tk, isDark, query, setQuery, showSuggest, setShowSuggest, suggestions, pickSuggestion,
    mobileOpen, setMobileOpen, sidebarRef, chips, hasFilters, reset, fp,
    results, loading, fetchError, sortBy, setSortBy, sharedResults, onFavToggle,
    allBiens, total, loadingMore, loadMoreError, localFiltersActive, loadMore,
  }
}
