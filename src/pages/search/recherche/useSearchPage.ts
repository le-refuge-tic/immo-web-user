import { useState, useEffect, useRef, useCallback, useMemo, useDeferredValue } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Bien } from '../../../types/api'
import type { BiensListParams } from '../../../api/biensApi'
import { useFavoriIds } from '../../../hooks/useFavoris'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import { rechercherQuartiers, trouverQuartierExact, type Quartier, VILLES_AVEC_QUARTIERS } from '../../../data/quartiers'
import { getQuartierCoords, haversineKm, distanceEntreQuartiers } from '../../../data/quartierProximite'
import { useScrollRestoration } from '../../../hooks/useScrollRestoration'
import { readSearchFilters, writeSearchFilters, piecesQuery, piecesLabel, type SortKey } from '../../../utils/searchFilters'
import { norm, matchLoc, inBudgetRange, isBudgetVoisin, fmtFcfa } from './helpers'
import { TRANSACTIONS, TYPES, SOUS_TYPES, PAGE_SIZE, PROXIMITY_MAX_KM, EQUIPEMENTS_CLES } from './options'
import { useTokens } from './tokens'
import { useBiensPages, useDebouncedValue } from './useBiensPages'

const NO_BIENS: Bien[] = []

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
  const [pieces,        setPieces]        = useState(initial.pieces)
  const [superficieMin, setSuperficieMin] = useState(initial.superficieMin)
  const [superficieMax, setSuperficieMax] = useState(initial.superficieMax)
  const [sortBy,        setSortBy]        = useState<SortKey>(initial.sortBy)
  const [capaciteMin,   setCapaciteMin]   = useState(initial.capaciteMin)
  const [equipements,   setEquipements]   = useState<string[]>(initial.equipements)
  const [garage,        setGarage]        = useState(initial.garage)

  useEffect(() => {
    setSearchParams(
      writeSearchFilters({ q: query, transaction, type, prixMin, prixMax, sousType, pieces, superficieMin, superficieMax, sortBy, capaciteMin, equipements, garage }),
      { replace: true },
    )
  }, [query, transaction, type, prixMin, prixMax, sousType, pieces, superficieMin, superficieMax, sortBy, capaciteMin, equipements, garage, setSearchParams])

  // Sens inverse : Précédent / Suivant ou un lien interne vers une autre recherche mettent l'état à jour
  const filtersKey = JSON.stringify(writeSearchFilters({ q: query, transaction, type, prixMin, prixMax, sousType, pieces, superficieMin, superficieMax, sortBy, capaciteMin, equipements, garage }))
  useEffect(() => {
    const fromUrl = readSearchFilters(searchParams)
    if (JSON.stringify(writeSearchFilters(fromUrl)) === filtersKey) return
    setQuery(fromUrl.q); setTransaction(fromUrl.transaction); setType(fromUrl.type)
    setPrixMin(fromUrl.prixMin); setPrixMax(fromUrl.prixMax); setSousType(fromUrl.sousType)
    setPieces(fromUrl.pieces)
    setSuperficieMin(fromUrl.superficieMin); setSuperficieMax(fromUrl.superficieMax); setSortBy(fromUrl.sortBy)
    setCapaciteMin(fromUrl.capaciteMin); setEquipements(fromUrl.equipements); setGarage(fromUrl.garage)
    // Déclenché par l'URL seulement : filtersKey reflète l'état courant au moment du changement d'URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [showSuggest, setShowSuggest] = useState(false)
  const [showAllAutres, setShowAllAutres] = useState(false)
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
    const supMin = num(superficieMin), supMax = num(superficieMax)
    Object.assign(params, piecesQuery(pieces))
    if (superficieMin && supMin !== null)     params.superficie_min = supMin
    if (superficieMax && supMax !== null)     params.superficie_max = supMax
    // Critères propres aux guesthouses : envoyés seulement quand ce type est choisi
    if (type === 'guesthouse') {
      if (capaciteMin)        params.capacite_min = Number(capaciteMin)
      if (equipements.length) params.equipements  = equipements.join(',')
      if (garage)             params.garage       = 'true'
    }
    return params
  }, [sousType, pieces, superficieMin, superficieMax, type, capaciteMin, equipements, garage])

  // Clé des paramètres réellement envoyés : taper dans la recherche sans changer de ville ne recharge rien.
  const paramsKey = useMemo(() => {
    // Filtrés par le serveur : le total et les pages restent justes (FE-D-005).
    // Le prix reste local : il alimente les suggestions « budget voisin ».
    const params: BiensListParams = { ...filterParams, limit: PAGE_SIZE }
    if (transaction) params.transaction = transaction
    if (type)        params.type        = type
    if (sortBy !== 'pertinence') params.tri = sortBy
    const nq = norm(query.trim())
    const matchedVille = VILLES_AVEC_QUARTIERS.find(v => norm(v).includes(nq) || nq.includes(norm(v)))
    if (nq.length >= 2 && matchedVille) params.ville = norm(matchedVille)
    return JSON.stringify(params)
  }, [query, transaction, type, filterParams, sortBy])

  // Couche de données (FE-A-004) : cache par jeu de paramètres, annulation, jamais de réponse
  // périmée. Le vivier des suggestions « autres biens » (mêmes critères hors localisation) a la
  // même clé que la liste principale tant qu'aucune ville, transaction ou type n'est choisi :
  // une seule requête à l'ouverture de la page.
  const main = useBiensPages(useDebouncedValue(paramsKey))
  const wide = useBiensPages(useDebouncedValue(JSON.stringify({ ...filterParams, limit: PAGE_SIZE })))
  const wideBiens = wide.biens
  // Échec d'une nouvelle recherche : on n'affiche plus la liste de l'ancienne, ni son total.
  // Un échec de « page suivante » ou d'une relecture de fond (cache périmé) laisse, lui, la
  // liste déjà chargée pour ces critères.
  const fetchError    = main.query.isError && !main.query.isFetchNextPageError && !main.query.data
  const allBiens      = fetchError ? NO_BIENS : main.biens
  const total         = fetchError ? 0 : main.total
  const loading       = main.query.isPending
  const loadingMore   = main.query.isFetchingNextPage
  const loadMoreError = main.query.isFetchNextPageError

  useEffect(() => { setShowAllAutres(false) }, [allBiens])

  const suggestions: Quartier[] = query.trim().length >= 1 ? rechercherQuartiers(query) : []
  const pickSuggestion = (q: Quartier) => { setQuery(q.nom); setShowSuggest(false) }

  const { favIds, onFavToggle } = useFavoriIds(isLoggedIn)

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

  // Page suivante : s'ajoute à la liste affichée (jamais de troncature silencieuse, FE-D-005)
  const { fetchNextPage, refetch } = main.query
  const loadMore = useCallback(() => {
    if (loadingMore || loading) return
    void fetchNextPage()
  }, [loadingMore, loading, fetchNextPage])

  const retryFetch = useCallback(() => { void refetch() }, [refetch])

  const reset = () => {
    setQuery(''); setTransaction(''); setType(''); setPrixMin(''); setPrixMax('')
    setSousType(''); setPieces(''); setSuperficieMin(''); setSuperficieMax(''); setSortBy('pertinence')
    setCapaciteMin(''); setEquipements([]); setGarage(false)
  }

  type Chip = { label: string; onRemove: () => void }
  const chips: Chip[] = []
  if (query)         chips.push({ label: query,                                                       onRemove: () => setQuery('') })
  if (transaction)   chips.push({ label: TRANSACTIONS.find(t => t.key === transaction)?.label ?? transaction, onRemove: () => setTransaction('') })
  if (type)          chips.push({ label: TYPES.find(t => t.key === type)?.label ?? type,              onRemove: () => setType('') })
  if (prixMin)       chips.push({ label: `≥ ${fmtFcfa(prixMin)} FCFA`,                               onRemove: () => setPrixMin('') })
  if (prixMax)       chips.push({ label: `≤ ${fmtFcfa(prixMax)} FCFA`,                               onRemove: () => setPrixMax('') })
  if (sousType)      chips.push({ label: SOUS_TYPES.find(t => t.key === sousType)?.label ?? sousType, onRemove: () => setSousType('') })
  if (pieces)        chips.push({ label: piecesLabel(pieces), onRemove: () => setPieces('') })
  if (superficieMin) chips.push({ label: `≥ ${superficieMin} m²`, onRemove: () => setSuperficieMin('') })
  if (superficieMax) chips.push({ label: `≤ ${superficieMax} m²`, onRemove: () => setSuperficieMax('') })
  if (type === 'guesthouse') {
    if (capaciteMin) chips.push({ label: `${capaciteMin}+ voyageurs`, onRemove: () => setCapaciteMin('') })
    for (const code of equipements) {
      chips.push({ label: EQUIPEMENTS_CLES.find(e => e.code === code)?.label ?? code, onRemove: () => setEquipements(l => l.filter(c => c !== code)) })
    }
    if (garage) chips.push({ label: 'Garage', onRemove: () => setGarage(false) })
  }
  const hasFilters = chips.length > 0

  const fp = {
    isDark, tk, transaction, setTransaction, type, setType,
    prixMin, setPrixMin, prixMax, setPrixMax,
    sousType, setSousType, pieces, setPieces, superficieMin, setSuperficieMin, superficieMax, setSuperficieMax,
    capaciteMin, setCapaciteMin, equipements, setEquipements, garage, setGarage,
  }

  useScrollRestoration(!loading && allBiens.length > 0)
  // Seul le filtre de prix s'applique encore sur les annonces déjà chargées
  const localFiltersActive = !!(prixMin || prixMax)

  const sharedResults = { search, loading, fetchError, retryFetch, favIds, isDark, tk, showAllAutres, setShowAllAutres, mainDistanceFor: distanceFor }

  return {
    tk, isDark, query, setQuery, showSuggest, setShowSuggest, suggestions, pickSuggestion,
    mobileOpen, setMobileOpen, sidebarRef, chips, hasFilters, reset, fp,
    results, loading, fetchError, sortBy, setSortBy, sharedResults, onFavToggle,
    allBiens, total, loadingMore, loadMoreError, localFiltersActive, loadMore,
  }
}
