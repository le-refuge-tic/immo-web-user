import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { biensApi } from '../../api/biensApi'
import { favoritesApi } from '../../api/favoritesApi'
import { useAuth } from '../../context/AuthContext'
import BienCard from '../../components/BienCard'
import Reveal from '../../components/Reveal'
import { rechercherQuartiers, trouverQuartierExact, type Quartier, VILLES_AVEC_QUARTIERS } from '../../data/quartiers'
import { getQuartierCoords, haversineKm, distanceEntreQuartiers } from '../../data/quartierProximite'

/* ── Normalisation accent-insensible ─────────────────────────────
   "adovié" → "adovie"  /  "Cotonou" → "cotonou"
   Permet de trouver un bien même si l'orthographe exacte diffère. */
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

/* ── Recherche guidée ────────────────────────────────────────────
   Quand un quartier précis ne renvoie aucun résultat (ou pour élargir
   discrètement le choix), on propose 3 pistes au lieu d'une simple liste
   vide : le voisinage immédiat (< 3 km), une tolérance de budget de
   ± 10 000 FCFA, et le reste des biens disponibles. */
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

/* ── Types / constantes ─────────────────────────────────────────── */
const TRANSACTIONS = [
  { key: '',         label: 'Tous' },
  { key: 'location', label: 'À louer' },
  { key: 'vente',    label: 'À vendre' },
]

const TYPES = [
  { key: '',              label: 'Tous les types' },
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
  { label: '< 50 000',      max: 50_000 },
  { label: '< 150 000',     max: 150_000 },
  { label: '< 500 000',     max: 500_000 },
  { label: '< 1 000 000',   max: 1_000_000 },
  { label: '< 5 000 000',   max: 5_000_000 },
]

/* ── Icônes inline ──────────────────────────────────────────────── */
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
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)
const EmptyIcon = () => (
  <svg className="w-14 h-14" style={{ color: 'rgba(0,0,0,0.18)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)
const ClearIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

/* ── Formatage FCFA ─────────────────────────────────────────────── */
function fmtFcfa(v: string) {
  const n = Number(v.replace(/\D/g, ''))
  if (!n) return ''
  return n.toLocaleString('fr-FR')
}

/* ═══════════════════════════════════════════════════════════════════
   Composant principal
   ═════════════════════════════════════════════════════════════════ */
export default function SearchPage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  /* Filtres — préremplis depuis l'URL (ex: venant de "Voir tout" ou d'une recherche sur l'accueil) */
  const initialParams = new URLSearchParams(window.location.search)
  const [query,       setQuery]       = useState(initialParams.get('q') || '')
  const [transaction, setTransaction] = useState(initialParams.get('transaction') || '')
  const [type,        setType]        = useState(initialParams.get('type') || '')
  const [prixMin,     setPrixMin]     = useState(initialParams.get('prix_min') || '')
  const [prixMax,     setPrixMax]     = useState(initialParams.get('prix_max') || '')
  const [sousType,      setSousType]      = useState(initialParams.get('sous_type') || '')
  const [chambresMin,   setChambresMin]   = useState('')
  const [salonsMin,     setSalonsMin]     = useState('')
  const [superficieMin, setSuperficieMin] = useState('')
  const [superficieMax, setSuperficieMax] = useState('')
  const [sortBy,        setSortBy]        = useState<'pertinence' | 'prix_asc' | 'prix_desc'>('pertinence')

  /* État */
  const [allBiens,    setAllBiens]    = useState<any[]>([])
  const [favIds,      setFavIds]      = useState<Set<number>>(new Set())
  const [loading,     setLoading]     = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [showSuggest, setShowSuggest] = useState(false)
  const [showAllAutres, setShowAllAutres] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setShowAllAutres(false) }, [allBiens])

  const suggestions: Quartier[] = query.trim().length >= 1 ? rechercherQuartiers(query) : []
  const pickSuggestion = (q: Quartier) => { setQuery(q.nom); setShowSuggest(false) }

  /* ── Chargement des favs ─────────────────────────────────────── */
  useEffect(() => {
    if (!isLoggedIn) return
    favoritesApi.list()
      .then(d => {
        const l = Array.isArray(d) ? d : d.data || []
        setFavIds(new Set(l.map((f: any) => f.bien_id || f.id)))
      })
      .catch(() => {})
  }, [isLoggedIn])

  /* ── Filtrage (sous-type + pièces + superficie), indépendant de la
     localisation et du budget — sert de socle à la fois aux résultats
     principaux et aux pistes de recherche guidée ci-dessous. */
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
      const quartier = b.localisation?.quartier
      if (quartier && norm(quartier).includes(nq)) return 2
      if (b.localisation?.ville && norm(b.localisation.ville).includes(nq)) return 1
      return 0
    }
    return [...biens].sort((a, b) => score(b) - score(a))
  }, [sortBy])

  /* ── Recherche guidée ────────────────────────────────────────────
     Quand la saisie correspond exactement à un quartier connu, on
     reproduit la logique de repli de l'app mobile — mais restituée comme
     des sections web classiques plutôt que des blocs empilés façon liste
     mobile : proximité (< 3 km) ou repli ville si le quartier exact est
     vide, tolérance de budget (± 10 000 FCFA), et le reste des biens. */
  const matchedQuartier = useMemo(() => {
    const q = query.trim()
    return q.length >= 2 ? trouverQuartierExact(q) : undefined
  }, [query])

  const search = useMemo(() => {
    const base = nonLocationFilters(allBiens)
    const inBudget = base.filter(b => inBudgetRange(b, prixMin, prixMax))

    let mainResults: any[] = []
    let environs: any[] = []
    let environsLabel = ''
    const environsDist = new Map<number, number>()

    if (matchedQuartier) {
      const qn = norm(matchedQuartier.nom)
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
          environs = withDist.map(x => x.bien)
          withDist.forEach(x => environsDist.set(x.bien.id, x.km))
          environsLabel = `Biens à proximité de « ${matchedQuartier.nom} » (< ${PROXIMITY_MAX_KM} km)`
        } else {
          const cityFallback = inBudget.filter(b => norm(b.localisation?.ville || '') === norm(matchedQuartier.ville))
          environs = applySort(cityFallback, '')
          environsLabel = cityFallback.length > 0 ? `Biens à ${matchedQuartier.ville}` : ''
        }
      }
    } else {
      mainResults = applySort(base.filter(b => matchLoc(b, query.trim())).filter(b => inBudgetRange(b, prixMin, prixMax)), query.trim())
    }

    const shownIds = new Set([...mainResults, ...environs].map((b: any) => b.id))
    const pool = base.filter(b => !shownIds.has(b.id))

    const budgetSimilar = (prixMin || prixMax) ? pool.filter(b => isBudgetVoisin(b, prixMin, prixMax)) : []
    const budgetSimilarIds = new Set(budgetSimilar.map(b => b.id))
    const autres = pool.filter(b => !budgetSimilarIds.has(b.id))

    const distFromQuartier = (b: any): number | null => {
      if (!matchedQuartier) return null
      const bq = b.localisation?.quartier
      if (!bq) return null
      return distanceEntreQuartiers(matchedQuartier.nom, bq)
    }

    return { mainResults, environs, environsLabel, environsDist, budgetSimilar, autres, distFromQuartier }
  }, [allBiens, matchedQuartier, query, prixMin, prixMax, nonLocationFilters, applySort])

  const results = search.mainResults

  /* ── Distance GPS depuis le quartier recherché (repli pour une saisie
     libre non reconnue comme quartier exact — ex: nom de ville). ──── */
  const refCoords = !matchedQuartier && query.trim().length >= 2 ? getQuartierCoords(query.trim()) : null
  const distanceFor = (bien: any): number | null => {
    // Quartier recherché reconnu : distance réelle entre ce quartier et celui du bien.
    if (matchedQuartier) return search.distFromQuartier(bien)
    // Sinon (saisie libre non reconnue comme quartier exact) : repli sur les coordonnées GPS.
    if (!refCoords) return null
    const q = bien.localisation?.quartier
    if (!q) return null
    const c = getQuartierCoords(q)
    if (!c) return null
    return haversineKm(refCoords.lat, refCoords.lng, c.lat, c.lng)
  }

  /* ── Appel API avec debounce ────────────────────────────────── */
  const fetchBiens = useCallback(async (params: any) => {
    setLoading(true)
    try {
      const data = await biensApi.list(params)
      const raw = Array.isArray(data) ? data : data.data || []
      setAllBiens(raw)
    } catch (_) {
      setAllBiens([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      // Le prix n'est plus envoyé au serveur : la recherche guidée a besoin
      // du pool complet (toutes fourchettes de prix) pour pouvoir proposer
      // des biens légèrement hors budget — le filtrage prix se fait donc
      // entièrement côté client (voir `search` ci-dessus).
      const params: any = { limit: 150 }
      if (transaction) params.transaction = transaction
      if (type)        params.type        = type
      /* On n'envoie "ville" au serveur que si le texte tapé est vraiment le nom
         d'une ville connue — sinon (un quartier, ex: "Godomey") le serveur ne
         trouverait aucune correspondance puisque le champ ville du bien ne
         contient jamais le nom du quartier. La recherche fine (quartier, ville,
         adresse) se fait donc toujours côté client sur l'ensemble des biens. */
      const nq = norm(query.trim())
      const matchedVille = VILLES_AVEC_QUARTIERS.find(v => norm(v).includes(nq) || nq.includes(norm(v)))
      if (nq.length >= 2 && matchedVille) params.ville = norm(matchedVille)
      fetchBiens(params)
    }, 420)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, transaction, type, fetchBiens])

  /* ── Réinitialisation ────────────────────────────────────────── */
  const reset = () => {
    setQuery(''); setTransaction(''); setType(''); setPrixMin(''); setPrixMax('')
    setSousType(''); setChambresMin(''); setSalonsMin(''); setSuperficieMin(''); setSuperficieMax(''); setSortBy('pertinence')
  }

  /* ── Chips de filtres actifs ─────────────────────────────────── */
  type Chip = { label: string; onRemove: () => void }
  const chips: Chip[] = []
  if (query)       chips.push({ label: query,                                  onRemove: () => setQuery('') })
  if (transaction) chips.push({ label: TRANSACTIONS.find(t => t.key === transaction)?.label ?? transaction, onRemove: () => setTransaction('') })
  if (type)        chips.push({ label: TYPES.find(t => t.key === type)?.label ?? type,                      onRemove: () => setType('') })
  if (prixMin)     chips.push({ label: `≥ ${fmtFcfa(prixMin)} FCFA`,           onRemove: () => setPrixMin('') })
  if (prixMax)     chips.push({ label: `≤ ${fmtFcfa(prixMax)} FCFA`,           onRemove: () => setPrixMax('') })
  if (sousType)    chips.push({ label: SOUS_TYPES.find(t => t.key === sousType)?.label ?? sousType, onRemove: () => setSousType('') })
  if (chambresMin) chips.push({ label: `≥ ${chambresMin} chambre${Number(chambresMin) > 1 ? 's' : ''}`, onRemove: () => setChambresMin('') })
  if (salonsMin)   chips.push({ label: `≥ ${salonsMin} salon${Number(salonsMin) > 1 ? 's' : ''}`,       onRemove: () => setSalonsMin('') })
  if (superficieMin) chips.push({ label: `≥ ${superficieMin} m²`, onRemove: () => setSuperficieMin('') })
  if (superficieMax) chips.push({ label: `≤ ${superficieMax} m²`, onRemove: () => setSuperficieMax('') })

  const hasFilters = chips.length > 0

  /* ────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-full">

      {/* ══════════════════════ MOBILE ══════════════════════════ */}
      <div className="lg:hidden">

        {/* Header mobile collant */}
        <div className="sticky top-0 z-30 px-4 pt-10 pb-3"
          style={{
            background: 'rgba(245,245,247,0.88)',
            backdropFilter: 'blur(32px)',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl glass-btn flex-shrink-0">
              <BackIcon />
            </button>
            {/* Barre de recherche localisation */}
            <div className="flex-1 relative">
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl glass-input"
                style={{ border: '1px solid rgba(0,0,0,0.10)' }}
              >
                <span style={{ color: 'rgba(0,0,0,0.3)' }}><PinIcon /></span>
                <input
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowSuggest(true) }}
                  onFocus={() => setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                  placeholder="Ville ou quartier…"
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm text-text-dark placeholder-gray-400"
                />
                {query && (
                  <button onClick={() => setQuery('')} style={{ color: 'rgba(0,0,0,0.3)' }}>
                    <ClearIcon />
                  </button>
                )}
              </div>
              {showSuggest && suggestions.length > 0 && (
                <div className="absolute z-30 mt-1 w-full bg-white rounded-xl border border-divider shadow-lg max-h-56 overflow-y-auto">
                  {suggestions.map((q, i) => (
                    <button key={`${q.nom}-${i}`} type="button" onClick={() => pickSuggestion(q)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-g border-b border-divider last:border-b-0 flex items-center justify-between gap-2">
                      <span className="text-text-dark font-medium">{q.nom}</span>
                      <span className="text-text-grey text-xs flex-shrink-0">{q.ville}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Bouton filtres */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 relative transition-all"
              style={{
                background: hasFilters ? 'rgba(75,107,255,0.12)' : 'rgba(255,255,255,0.72)',
                border: hasFilters ? '1px solid rgba(75,107,255,0.35)' : '1px solid rgba(0,0,0,0.08)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
                color: hasFilters ? '#4B6BFF' : 'rgba(0,0,0,0.55)',
              }}
            >
              <FilterIcon />
              {hasFilters && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                  style={{ background: '#4B6BFF' }}>
                  {chips.length}
                </span>
              )}
            </button>
          </div>

          {/* Chips filtres actifs */}
          {chips.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {chips.map(chip => (
                <button key={chip.label}
                  onClick={chip.onRemove}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: 'rgba(75,107,255,0.10)',
                    border: '1px solid rgba(75,107,255,0.25)',
                    color: '#4B6BFF',
                  }}
                >
                  {chip.label}
                  <XIcon />
                </button>
              ))}
              <button onClick={reset} className="flex-shrink-0 text-xs font-semibold text-text-grey px-2 py-1">
                Tout effacer
              </button>
            </div>
          )}
        </div>

        {/* Drawer filtres mobile */}
        {mobileOpen && (
          <div className="px-4 pb-4 pt-3 border-b border-divider anim-fade-down"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(32px)',
            }}
          >
            <FilterPanel
              transaction={transaction} setTransaction={setTransaction}
              type={type} setType={setType}
              prixMin={prixMin} setPrixMin={setPrixMin}
              prixMax={prixMax} setPrixMax={setPrixMax}
              sousType={sousType} setSousType={setSousType}
              chambresMin={chambresMin} setChambresMin={setChambresMin}
              salonsMin={salonsMin} setSalonsMin={setSalonsMin}
              superficieMin={superficieMin} setSuperficieMin={setSuperficieMin}
              superficieMax={superficieMax} setSuperficieMax={setSuperficieMax}
            />
          </div>
        )}

        {/* Résultats */}
        <div className="px-4 md:px-8 py-4 md:py-6">
          <ResultHeader count={results.length} loading={loading} hasFilters={hasFilters} reset={reset} sortBy={sortBy} setSortBy={setSortBy} />
          <GuidedResults search={search} loading={loading} favIds={favIds}
            onFavToggle={(id, added) => setFavIds(prev => { const n = new Set(prev); added ? n.add(id) : n.delete(id); return n })}
            cols="grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
            showAllAutres={showAllAutres} setShowAllAutres={setShowAllAutres}
            mainDistanceFor={distanceFor}
          />
        </div>
      </div>

      {/* ══════════════════════ DESKTOP ═════════════════════════ */}
      <div className="hidden lg:flex min-h-full">

        {/* Sidebar filtres — collant */}
        <aside className="w-80 flex-shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto p-6"
          style={{
            background: 'rgba(255,255,255,0.78)',
            backdropFilter: 'blur(40px)',
            borderRight: '1px solid rgba(0,0,0,0.07)',
            boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.8)',
          }}
        >
          {/* Titre sidebar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(75,107,255,0.12)', color: '#4B6BFF' }}>
                <FilterIcon />
              </div>
              <h2 className="font-bold text-text-dark text-base">Filtres</h2>
            </div>
            {hasFilters && (
              <button onClick={reset}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
                style={{ color: '#4B6BFF', background: 'rgba(75,107,255,0.08)' }}>
                <ClearIcon />
                Effacer
              </button>
            )}
          </div>

          {/* Recherche localisation */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-text-grey uppercase tracking-wider mb-2.5">
              Ville ou quartier
            </label>
            <div className="relative">
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all"
                style={{
                  background: 'rgba(255,255,255,0.80)',
                  border: '1px solid rgba(0,0,0,0.10)',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <span style={{ color: 'rgba(0,0,0,0.3)' }}><PinIcon /></span>
                <input
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowSuggest(true) }}
                  onFocus={() => setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                  placeholder="Ex: Cotonou, Adovié, Akpakpa…"
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm text-text-dark placeholder-gray-400"
                />
                {query && (
                  <button onClick={() => setQuery('')} style={{ color: 'rgba(0,0,0,0.3)' }}>
                    <ClearIcon />
                  </button>
                )}
              </div>
              {showSuggest && suggestions.length > 0 && (
                <div className="absolute z-30 mt-1 w-full bg-white rounded-xl border border-divider shadow-lg max-h-56 overflow-y-auto">
                  {suggestions.map((q, i) => (
                    <button key={`${q.nom}-${i}`} type="button" onClick={() => pickSuggestion(q)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-g border-b border-divider last:border-b-0 flex items-center justify-between gap-2">
                      <span className="text-text-dark font-medium">{q.nom}</span>
                      <span className="text-text-grey text-xs flex-shrink-0">{q.ville}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[11px] text-text-grey mt-1.5 pl-1">
              La recherche tolère les variantes orthographiques
            </p>
          </div>

          <div className="h-px bg-divider mb-5" />

          <FilterPanel
            transaction={transaction} setTransaction={setTransaction}
            type={type} setType={setType}
            prixMin={prixMin} setPrixMin={setPrixMin}
            prixMax={prixMax} setPrixMax={setPrixMax}
            sousType={sousType} setSousType={setSousType}
            chambresMin={chambresMin} setChambresMin={setChambresMin}
            salonsMin={salonsMin} setSalonsMin={setSalonsMin}
            superficieMin={superficieMin} setSuperficieMin={setSuperficieMin}
            superficieMax={superficieMax} setSuperficieMax={setSuperficieMax}
          />

          {/* Chips récap en bas de sidebar */}
          {chips.length > 0 && (
            <div className="mt-5 pt-5 border-t border-divider">
              <p className="text-xs font-bold text-text-grey uppercase tracking-wider mb-2.5">Filtres actifs</p>
              <div className="flex flex-wrap gap-2">
                {chips.map(chip => (
                  <button key={chip.label} onClick={chip.onRemove}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: 'rgba(75,107,255,0.10)',
                      border: '1px solid rgba(75,107,255,0.25)',
                      color: '#4B6BFF',
                    }}
                  >
                    {chip.label}
                    <XIcon />
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Zone résultats */}
        <div className="flex-1 px-8 py-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-text-dark">Recherche avancée</h1>
              <p className="text-sm text-text-grey mt-1">Tous les biens disponibles au Bénin</p>
            </div>
            <ResultHeader count={results.length} loading={loading} hasFilters={hasFilters} reset={reset} sortBy={sortBy} setSortBy={setSortBy} inline />
          </div>

          <GuidedResults search={search} loading={loading} favIds={favIds}
            onFavToggle={(id, added) => setFavIds(prev => { const n = new Set(prev); added ? n.add(id) : n.delete(id); return n })}
            cols="grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            showAllAutres={showAllAutres} setShowAllAutres={setShowAllAutres}
            mainDistanceFor={distanceFor}
          />
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   Panneau de filtres partagé mobile/desktop
   ═════════════════════════════════════════════════════════════════ */
type FilterPanelProps = {
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
  transaction, setTransaction, type, setType, prixMin, setPrixMin, prixMax, setPrixMax,
  sousType, setSousType, chambresMin, setChambresMin, salonsMin, setSalonsMin,
  superficieMin, setSuperficieMin, superficieMax, setSuperficieMax,
}: FilterPanelProps) {
  const showSuperficie = type === 'terrain' || sousType === 'terrain'
  return (
    <div className="space-y-6">

      {/* Transaction */}
      <div>
        <label className="block text-xs font-bold text-text-grey uppercase tracking-wider mb-2.5">
          Transaction
        </label>
        <div className="flex gap-2">
          {TRANSACTIONS.map(t => (
            <button key={t.key} onClick={() => setTransaction(t.key)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={transaction === t.key ? {
                background: 'rgba(75,107,255,0.14)',
                border: '1px solid rgba(75,107,255,0.35)',
                color: '#4B6BFF',
                boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.9)',
              } : {
                background: 'rgba(255,255,255,0.65)',
                border: '1px solid rgba(0,0,0,0.08)',
                color: 'rgba(0,0,0,0.50)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type de bien */}
      <div>
        <label className="block text-xs font-bold text-text-grey uppercase tracking-wider mb-2.5">
          Type de bien
        </label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setType(t.key)}
              className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={type === t.key ? {
                background: 'rgba(75,107,255,0.14)',
                border: '1px solid rgba(75,107,255,0.35)',
                color: '#4B6BFF',
                boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.9)',
              } : {
                background: 'rgba(255,255,255,0.65)',
                border: '1px solid rgba(0,0,0,0.08)',
                color: 'rgba(0,0,0,0.50)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sous-type */}
      <div>
        <label className="block text-xs font-bold text-text-grey uppercase tracking-wider mb-2.5">
          Sous-type
        </label>
        <div className="flex flex-wrap gap-2">
          {SOUS_TYPES.map(t => (
            <button key={t.key} onClick={() => setSousType(sousType === t.key ? '' : t.key)}
              className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={sousType === t.key ? {
                background: 'rgba(75,107,255,0.14)',
                border: '1px solid rgba(75,107,255,0.35)',
                color: '#4B6BFF',
                boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.9)',
              } : {
                background: 'rgba(255,255,255,0.65)',
                border: '1px solid rgba(0,0,0,0.08)',
                color: 'rgba(0,0,0,0.50)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pièces */}
      <div>
        <label className="block text-xs font-bold text-text-grey uppercase tracking-wider mb-2.5">
          Pièces minimum
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Stepper label="Chambres" value={chambresMin} onChange={setChambresMin} />
          <Stepper label="Salons" value={salonsMin} onChange={setSalonsMin} />
        </div>
      </div>

      {/* Superficie (terrain) */}
      {showSuperficie && (
        <div>
          <label className="block text-xs font-bold text-text-grey uppercase tracking-wider mb-2.5">
            Superficie (m²)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[11px] text-text-grey mb-1">Minimum</p>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(0,0,0,0.10)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)' }}>
                <input type="number" value={superficieMin} onChange={e => setSuperficieMin(e.target.value)}
                  placeholder="0" className="flex-1 bg-transparent outline-none text-sm text-text-dark min-w-0 placeholder-gray-400" min={0} />
              </div>
            </div>
            <div>
              <p className="text-[11px] text-text-grey mb-1">Maximum</p>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(0,0,0,0.10)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)' }}>
                <input type="number" value={superficieMax} onChange={e => setSuperficieMax(e.target.value)}
                  placeholder="Illimité" className="flex-1 bg-transparent outline-none text-sm text-text-dark min-w-0 placeholder-gray-400" min={0} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget */}
      <div>
        <label className="block text-xs font-bold text-text-grey uppercase tracking-wider mb-2.5">
          Budget (FCFA)
        </label>

        {/* Presets rapides */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 mb-3">
          {BUDGET_PRESETS.map(p => {
            const active = prixMax === String(p.max)
            return (
              <button key={p.max}
                onClick={() => { setPrixMin(''); setPrixMax(active ? '' : String(p.max)) }}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={active ? {
                  background: 'rgba(255,107,53,0.14)',
                  border: '1px solid rgba(255,107,53,0.35)',
                  color: '#FF6B35',
                } : {
                  background: 'rgba(255,255,255,0.65)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  color: 'rgba(0,0,0,0.50)',
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Saisie libre */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[11px] text-text-grey mb-1">Minimum</p>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.80)',
                border: '1px solid rgba(0,0,0,0.10)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <input
                type="number"
                value={prixMin}
                onChange={e => setPrixMin(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent outline-none text-sm text-text-dark min-w-0 placeholder-gray-400"
                min={0}
              />
            </div>
          </div>
          <div>
            <p className="text-[11px] text-text-grey mb-1">Maximum</p>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.80)',
                border: '1px solid rgba(0,0,0,0.10)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <input
                type="number"
                value={prixMax}
                onChange={e => setPrixMax(e.target.value)}
                placeholder="Illimité"
                className="flex-1 bg-transparent outline-none text-sm text-text-dark min-w-0 placeholder-gray-400"
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Affichage budget formaté */}
        {(prixMin || prixMax) && (
          <p className="text-xs text-text-grey mt-2 pl-1">
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

/* ── Compteur incrémental (chambres/salons min) ─────────────────────── */
function Stepper({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const n = Number(value) || 0
  return (
    <div>
      <p className="text-[11px] text-text-grey mb-1">{label}</p>
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(0,0,0,0.10)' }}>
        <button type="button" onClick={() => onChange(n > 0 ? String(n - 1) : '')}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-grey font-bold" style={{ background: 'rgba(0,0,0,0.05)' }}>
          −
        </button>
        <span className="text-sm font-semibold text-text-dark">{n || 'Peu importe'}</span>
        <button type="button" onClick={() => onChange(String(n + 1))}
          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold" style={{ background: 'rgba(75,107,255,0.12)', color: '#4B6BFF' }}>
          +
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   En-tête résultats
   ═════════════════════════════════════════════════════════════════ */
type ResultHeaderProps = {
  count: number
  loading: boolean
  hasFilters: boolean
  reset: () => void
  inline?: boolean
  sortBy: 'pertinence' | 'prix_asc' | 'prix_desc'
  setSortBy: (v: 'pertinence' | 'prix_asc' | 'prix_desc') => void
}

function ResultHeader({ count, loading, hasFilters, reset, inline, sortBy, setSortBy }: ResultHeaderProps) {
  if (loading) return (
    <div className={inline ? 'flex items-center' : 'mb-4'}>
      <div className="w-28 h-4 rounded-lg skeleton" />
    </div>
  )
  return (
    <div className={`flex items-center gap-3 flex-wrap ${inline ? '' : 'mb-4'}`}>
      <p className="text-sm font-medium text-text-grey">
        <strong className="text-text-dark font-bold">{count}</strong> résultat{count !== 1 ? 's' : ''}
        {hasFilters && ' trouvé' + (count !== 1 ? 's' : '')}
      </p>
      {hasFilters && count === 0 && (
        <button onClick={reset} className="text-xs font-semibold text-primary underline">
          Effacer les filtres
        </button>
      )}
      <div className="ml-auto flex items-center gap-1.5">
        <span className="text-xs text-text-grey">Trier :</span>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="text-xs font-semibold text-text-dark bg-transparent outline-none border border-divider rounded-lg px-2 py-1.5">
          {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   Grille de résultats
   ═════════════════════════════════════════════════════════════════ */
type ResultGridProps = {
  biens: any[]
  loading: boolean
  favIds: Set<number>
  onFavToggle: (id: number, added: boolean) => void
  cols: string
  distanceFor?: (bien: any) => number | null
}

function ResultGrid({ biens, loading, favIds, onFavToggle, cols, distanceFor }: ResultGridProps) {
  if (loading) return (
    <div className={`grid ${cols} gap-3 md:gap-4`}>
      {[1, 2, 3, 4, 5, 6].map(n => (
        <div key={n} className="skeleton rounded-2xl h-56 md:h-64" />
      ))}
    </div>
  )

  if (biens.length === 0) return (
    <Reveal animation="anim-fade-in" className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'rgba(0,0,0,0.05)' }}>
        <EmptyIcon />
      </div>
      <p className="font-semibold text-text-dark">Aucun résultat</p>
      <p className="text-text-grey text-sm mt-1 max-w-xs">
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

/* ═══════════════════════════════════════════════════════════════════
   Recherche guidée — au lieu d'une simple liste vide, on propose ce qui
   se rapproche le plus : proximité géographique, tolérance de budget,
   puis le reste des biens. Restitué en sections web classiques (titre +
   grille), pas en écran empilé façon mobile.
   ═════════════════════════════════════════════════════════════════ */
const AUTRES_PAGE_SIZE = 12

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3 md:mb-4">
      <h2 className="text-base md:text-lg font-bold text-text-dark">{title}</h2>
      {subtitle && <p className="text-xs text-text-grey mt-0.5">{subtitle}</p>}
    </div>
  )
}

type GuidedSearch = {
  mainResults: any[]
  environs: any[]
  environsLabel: string
  environsDist: Map<number, number>
  budgetSimilar: any[]
  autres: any[]
  distFromQuartier: (bien: any) => number | null
}

function GuidedResults({
  search, loading, favIds, onFavToggle, cols, showAllAutres, setShowAllAutres, mainDistanceFor,
}: {
  search: GuidedSearch
  loading: boolean
  favIds: Set<number>
  onFavToggle: (id: number, added: boolean) => void
  cols: string
  showAllAutres: boolean
  setShowAllAutres: (v: boolean) => void
  /** Distance approximative pour les résultats principaux d'une recherche libre
   *  (ville/texte) non reconnue comme quartier exact — absent pour un quartier
   *  exact, puisque ces biens SONT au bon endroit. */
  mainDistanceFor?: (bien: any) => number | null
}) {
  if (loading) return <ResultGrid biens={[]} loading favIds={favIds} onFavToggle={onFavToggle} cols={cols} />

  const { mainResults, environs, environsLabel, environsDist, budgetSimilar, autres, distFromQuartier } = search
  const hasMain = mainResults.length > 0
  const nothingAtAll = !hasMain && environs.length === 0 && budgetSimilar.length === 0 && autres.length === 0
  const autresToShow = showAllAutres ? autres : autres.slice(0, AUTRES_PAGE_SIZE)

  return (
    <div className="space-y-9 md:space-y-10">
      {hasMain ? (
        <ResultGrid biens={mainResults} loading={false} favIds={favIds} onFavToggle={onFavToggle} cols={cols} distanceFor={mainDistanceFor} />
      ) : nothingAtAll ? (
        <ResultGrid biens={[]} loading={false} favIds={favIds} onFavToggle={onFavToggle} cols={cols} />
      ) : (
        <p className="text-sm text-text-grey">Aucun bien ne correspond exactement à votre recherche — voici ce qui s'en rapproche.</p>
      )}

      {environs.length > 0 && (
        <section>
          <SectionHeader title={environsLabel} />
          <ResultGrid biens={environs} loading={false} favIds={favIds} onFavToggle={onFavToggle} cols={cols}
            distanceFor={b => environsDist.get(b.id) ?? distFromQuartier(b)} />
        </section>
      )}

      {budgetSimilar.length > 0 && (
        <section>
          <SectionHeader title="Légèrement hors budget" subtitle={`À ± ${BUDGET_TOLERANCE.toLocaleString('fr-FR')} FCFA de votre budget défini`} />
          <ResultGrid biens={budgetSimilar} loading={false} favIds={favIds} onFavToggle={onFavToggle} cols={cols} distanceFor={distFromQuartier} />
        </section>
      )}

      {autres.length > 0 && (
        <section>
          <SectionHeader title="Autres biens disponibles" />
          <ResultGrid biens={autresToShow} loading={false} favIds={favIds} onFavToggle={onFavToggle} cols={cols} distanceFor={distFromQuartier} />
          {!showAllAutres && autres.length > AUTRES_PAGE_SIZE && (
            <button onClick={() => setShowAllAutres(true)}
              className="mt-4 w-full py-3 rounded-xl border text-sm font-semibold transition-colors hover:bg-primary/5"
              style={{ borderColor: 'rgba(75,107,255,0.35)', color: '#4B6BFF' }}>
              Voir plus ({autres.length - AUTRES_PAGE_SIZE} autres)
            </button>
          )}
        </section>
      )}
    </div>
  )
}
