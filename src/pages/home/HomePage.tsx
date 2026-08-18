import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { biensApi } from '../../api/biensApi'
import { favoritesApi } from '../../api/favoritesApi'
import BienCard from '../../components/BienCard'
import Reveal from '../../components/Reveal'
import HERO_IMG from '../../assets/hero-interior.jpg'
import logoUrl from '../../assets/REFUGE-ICON.png'
import { rechercherQuartiers, type Quartier } from '../../data/quartiers'

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

type Category = { key: string; label: string; transaction: string; type: string }
const CATEGORIES: Category[] = [
  { key: 'Tous',        label: 'Tous',        transaction: '',         type: '' },
  { key: 'location',    label: 'À louer',     transaction: 'location', type: '' },
  { key: 'vente',       label: 'À vendre',    transaction: 'vente',    type: '' },
  { key: 'maison',      label: 'Maison',      transaction: '',         type: 'maison' },
  { key: 'appartement', label: 'Appartement', transaction: '',         type: 'appart_vide' },
  { key: 'terrain',     label: 'Terrain',     transaction: '',         type: 'terrain' },
  { key: 'guesthouse',  label: 'Guesthouse',  transaction: '',         type: 'guesthouse' },
]

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
  { key: 'chambre_salon', label: 'Chambre-Salon' },
  { key: 'terrain',       label: 'Terrain' },
  { key: 'guesthouse',    label: 'Guesthouse' },
]
// "Chambre-Salon" est un sous-type (bien.amenites.sous_type), pas le champ
// large bien.type — traité à part partout où `type` sert à filtrer/chercher.
const isSousType = (t: string) => t === 'chambre_salon'

const BUDGET_PRESETS = [
  { label: '< 50 000',      max: 50_000 },
  { label: '< 150 000',     max: 150_000 },
  { label: '< 500 000',     max: 500_000 },
  { label: '< 1 000 000',   max: 1_000_000 },
  { label: '< 5 000 000',   max: 5_000_000 },
]

const PinIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const XIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
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

const SearchIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
  const [transaction, setTransaction] = useState('')
  const [type, setType] = useState('')
  // Reprend le quartier/ville choisi lors de l'onboarding ("Où souhaitez-vous
  // louer ?") comme filtre de départ, pour que ce choix serve réellement à
  // quelque chose au lieu de rester inutilisé en localStorage.
  const [search, setSearch] = useState(() => localStorage.getItem('rg_quartier') || localStorage.getItem('rg_ville') || '')
  const [showSuggest, setShowSuggest] = useState(false)
  const [biens, setBiens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [favIds, setFavIds] = useState<Set<number>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [prixMin, setPrixMin] = useState('')
  const [prixMax, setPrixMax] = useState('')

  const suggestions: Quartier[] = search.trim().length >= 1 ? rechercherQuartiers(search) : []

  const locRef  = useRef<HTMLDivElement>(null)
  const venteRef = useRef<HTMLDivElement>(null)
  const [locPaused,   setLocPaused]   = useState(false)
  const [ventePaused, setVentePaused] = useState(false)
  const [locIdx,   setLocIdx]   = useState(0)
  const [venteIdx, setVenteIdx] = useState(0)

  // Charge tout le catalogue une seule fois — tous les filtres (transaction,
  // type, ville/quartier, budget) s'appliquent ensuite côté client, ce qui
  // évite tout risque de décalage entre ce qui est chargé et ce qui est filtré.
  const loadBiens = async () => {
    setLoading(true)
    try {
      const [locData, venteData] = await Promise.all([
        biensApi.list({ transaction: 'location', limit: 100 }),
        biensApi.list({ transaction: 'vente',    limit: 100 }),
      ])
      const loc   = Array.isArray(locData)   ? locData   : locData.data   || []
      const vente = Array.isArray(venteData) ? venteData : venteData.data || []
      setBiens([...loc, ...vente])
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

  const minVal = prixMin ? Number(prixMin) : null
  const maxVal = prixMax ? Number(prixMax) : null
  const displayedBiens = biens
    .filter(b => !transaction || b.transaction === transaction)
    .filter(b => !type || (isSousType(type) ? b.amenites?.sous_type === type : b.type === type))
    .filter(b => !search.trim() || matchLoc(b, search.trim()))
    .filter(b => minVal == null || Number(b.prix) >= minVal)
    .filter(b => maxVal == null || Number(b.prix) <= maxVal)

  // Biens à louer les plus récemment publiés — section dédiée façon portails
  // immobiliers classiques (photo + nombre de photos + date d'ajout).
  // Uniquement les biens publiés dans le dernier mois : au-delà, un bien
  // reste visible mais seulement dans "Toutes les annonces" plus bas.
  const UN_MOIS_MS = 30 * 24 * 60 * 60 * 1000
  const recentLocation = biens
    .filter(b => b.transaction === 'location' && b.created_at && (Date.now() - new Date(b.created_at).getTime()) <= UN_MOIS_MS)
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 6)

  // Même principe côté vente.
  const recentVente = biens
    .filter(b => b.transaction === 'vente')
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 6)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scrollCarousel = (ref: { current: HTMLDivElement | null }, items: any[], paused: boolean, setIdx: (i: number) => void) => {
    const el = ref.current
    if (!el || paused || items.length === 0) return
    const cardW = el.scrollWidth / items.length
    const maxScroll = el.scrollWidth - el.clientWidth
    const isAtEnd = el.scrollLeft + cardW >= maxScroll - 1
    const next = isAtEnd ? 0 : el.scrollLeft + cardW
    el.scrollTo({ left: next, behavior: 'smooth' })
    setIdx(isAtEnd ? 0 : Math.round(next / cardW))
  }

  useEffect(() => {
    if (locPaused || recentLocation.length === 0) return
    const id = setInterval(() => scrollCarousel(locRef, recentLocation, locPaused, setLocIdx), 3500)
    return () => clearInterval(id)
  }, [locPaused, recentLocation.length])

  useEffect(() => {
    if (ventePaused || recentVente.length === 0) return
    const id = setInterval(() => scrollCarousel(venteRef, recentVente, ventePaused, setVenteIdx), 3500)
    return () => clearInterval(id)
  }, [ventePaused, recentVente.length])

  // Quartiers où des biens sont actuellement publiés, avec le nombre réel de
  // biens par quartier — sert à la fois à la bannière CTA et au nuage de mots
  // "Emplacements de bien" (taille proportionnelle au nombre de biens, comme
  // un tag cloud classique).
  const quartierCounts: Record<string, number> = {}
  for (const b of biens) {
    const q = b.localisation?.quartier?.trim()
    if (q) quartierCounts[q] = (quartierCounts[q] || 0) + 1
  }
  const quartiersActifs = Object.keys(quartierCounts).sort((a, b) => a.localeCompare(b, 'fr'))
  /** Normalise l'affichage d'un nom de quartier (première lettre en majuscule), sans toucher à la donnée saisie. */
  const capitalizeQuartier = (q: string) => q.charAt(0).toUpperCase() + q.slice(1)

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
  const activeCat = CATEGORIES.find(c => c.transaction === transaction && c.type === type)
  const combinedLabel = [transaction && (transaction === 'location' ? 'À louer' : 'À vendre'), TYPES.find(t => t.key === type)?.label]
    .filter(Boolean).join(' · ')
  const catLabel = activeCat?.label ?? (combinedLabel || 'Annonces')

  const goToSearch = () => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    if (transaction) params.set('transaction', transaction)
    if (type) { isSousType(type) ? params.set('sous_type', type) : params.set('type', type) }
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
              className="flex-1 min-w-0 text-sm bg-transparent outline-none text-white placeholder-white/50"
            />
          </div>
        </div>
      </div>

      {/* ── DESKTOP hero image pleine largeur ── */}
      <div className="hidden md:flex relative w-full flex-col justify-center" style={{ minHeight: '72vh' }}>
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.15) 100%)' }} />

        <div className="relative z-10 w-full px-16 pb-20 pt-12">
          <p className="text-white/60 text-sm uppercase tracking-widest font-medium mb-4 anim-fade-up">
            Immobilier au Bénin — Annonces vérifiées
          </p>
          <h1 className="text-white font-bold leading-[1.05] tracking-tight mb-5 anim-blur-up d-100 max-w-2xl" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
            Trouvez votre logement idéal.<br />Habitez en confiance.
          </h1>
          <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-xl anim-fade-up d-300">
            Maisons, appartements, terrains — à Cotonou, Abomey-Calavi et partout au Bénin.
          </p>

          {/* Stats */}
          <div className="flex items-center gap-12 pt-8 mt-2 anim-fade-in d-600 max-w-2xl" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
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

      {/* ── Barre de recherche structurée — ancrée à cheval sur le bas du hero,
          remplace l'ancienne barre mono-champ + panneau "Filtres" replié. ── */}
      <div className="hidden md:block relative z-20 px-16" style={{ marginTop: -36 }}>
        <div className="bg-white rounded-2xl shadow-2xl flex items-stretch divide-x divide-divider anim-scale-in d-400">
          <div className="flex-1 min-w-0 px-5 py-3 relative">
            <p className="text-[10px] font-bold text-text-grey uppercase tracking-wide mb-1">Quartier</p>
            <div className="flex items-center gap-2">
              <span className="text-text-grey flex-shrink-0"><PinIcon /></span>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setShowSuggest(true) }}
                onFocus={() => setShowSuggest(true)}
                onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                onKeyDown={e => { if (e.key === 'Enter') goToSearch() }}
                placeholder="Où cherchez-vous ?"
                className="flex-1 min-w-0 bg-transparent outline-none text-[13px] text-text-dark placeholder-gray-400"
              />
            </div>
            {showSuggest && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-white rounded-xl border border-divider shadow-lg max-h-56 overflow-y-auto">
                {suggestions.map((q, i) => (
                  <button key={`${q.nom}-${i}`} type="button" onClick={() => { setSearch(q.nom); setShowSuggest(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-g border-b border-divider last:border-b-0 flex items-center justify-between gap-2">
                    <span className="text-text-dark font-medium">{q.nom}</span>
                    <span className="text-text-grey text-xs flex-shrink-0">{q.ville}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-40 flex-shrink-0 px-5 py-3">
            <p className="text-[10px] font-bold text-text-grey uppercase tracking-wide mb-1">Opération</p>
            <select value={transaction} onChange={e => setTransaction(e.target.value)}
              className="w-full bg-transparent outline-none text-[13px] text-text-dark cursor-pointer">
              {TRANSACTIONS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div className="w-40 flex-shrink-0 px-5 py-3">
            <p className="text-[10px] font-bold text-text-grey uppercase tracking-wide mb-1">Type de bien</p>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full bg-transparent outline-none text-[13px] text-text-dark cursor-pointer">
              {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div className="w-28 flex-shrink-0 px-5 py-3">
            <p className="text-[10px] font-bold text-text-grey uppercase tracking-wide mb-1">Budget min</p>
            <input
              type="number" min={0} list="budget-min-presets" value={prixMin}
              onChange={e => setPrixMin(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent outline-none text-[13px] text-text-dark placeholder-gray-400"
            />
            <datalist id="budget-min-presets">
              {BUDGET_PRESETS.map(p => <option key={p.label} value={p.max}>{`≥ ${p.label.replace('< ', '')}`}</option>)}
            </datalist>
          </div>
          <div className="w-32 flex-shrink-0 px-5 py-3">
            <p className="text-[10px] font-bold text-text-grey uppercase tracking-wide mb-1">Budget max</p>
            <input
              type="number" min={0} list="budget-max-presets" value={prixMax}
              onChange={e => setPrixMax(e.target.value)}
              placeholder="Illimité"
              className="w-full bg-transparent outline-none text-[13px] text-text-dark placeholder-gray-400"
            />
            <datalist id="budget-max-presets">
              {BUDGET_PRESETS.map(p => <option key={p.label} value={p.max}>{p.label}</option>)}
            </datalist>
          </div>
          <button onClick={goToSearch}
            className="flex-shrink-0 flex items-center gap-2 px-6 font-bold text-white text-sm rounded-r-2xl transition-opacity hover:opacity-90"
            style={{ background: '#4B6BFF' }}>
            <SearchIcon />
            Rechercher
          </button>
        </div>
      </div>

      {/* ── Biens récemment ajoutés pour location ── */}
      {recentLocation.length > 0 && (
        <div id="location-biens" className="hidden md:block w-full px-16 pt-16 pb-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: '#4B6BFF' }}>
              Biens récemment ajoutés pour location
            </h2>
            <p className="text-text-grey text-sm leading-relaxed mt-3">
              Vous recherchez un appartement ou une maison à louer ? Découvrez les derniers biens
              publiés sur REFUGE et réservez votre visite en quelques clics.
            </p>
          </div>
          <div
            ref={locRef}
            className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
            onMouseEnter={() => setLocPaused(true)}
            onMouseLeave={() => setLocPaused(false)}
          >
            {recentLocation.map(bien => (
              <div key={bien.id} className="flex-shrink-0 snap-start" style={{ width: 'calc(33.333% - 14px)' }}>
                <BienCard
                  bien={bien}
                  favoriteIds={favIds}
                  onFavoriteToggle={handleFavToggle}
                  showPhotoCount
                  showAddedDate
                />
              </div>
            ))}
          </div>
          {recentLocation.length > 3 && (
            <div className="flex justify-center gap-2 mt-4">
              {recentLocation.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const el = locRef.current
                    if (!el) return
                    const cardW = el.scrollWidth / recentLocation.length
                    el.scrollTo({ left: cardW * i, behavior: 'smooth' })
                    setLocIdx(i)
                  }}
                  style={{ width: locIdx === i ? 20 : 8, height: 8, borderRadius: 4, background: locIdx === i ? '#4B6BFF' : 'rgba(75,107,255,0.25)', transition: 'all 0.3s ease', border: 'none', cursor: 'pointer', padding: 0 }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Nos exclusivités en vente ── */}
      {recentVente.length > 0 && (
        <div className="hidden md:block w-full px-16 pt-10 pb-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: '#FF6B35' }}>
              Nos exclusivités en vente
            </h2>
            <p className="text-text-grey text-sm leading-relaxed mt-3">
              Maisons, appartements, terrains à vendre — à Cotonou, Abomey-Calavi et partout au
              Bénin. Découvrez les derniers biens publiés sur REFUGE.
            </p>
          </div>
          <div
            ref={venteRef}
            className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
            onMouseEnter={() => setVentePaused(true)}
            onMouseLeave={() => setVentePaused(false)}
          >
            {recentVente.map(bien => (
              <div key={bien.id} className="flex-shrink-0 snap-start" style={{ width: 'calc(33.333% - 14px)' }}>
                <BienCard
                  bien={bien}
                  favoriteIds={favIds}
                  onFavoriteToggle={handleFavToggle}
                  showPhotoCount
                  showAddedDate
                />
              </div>
            ))}
          </div>
          {recentVente.length > 3 && (
            <div className="flex justify-center gap-2 mt-4">
              {recentVente.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const el = venteRef.current
                    if (!el) return
                    const cardW = el.scrollWidth / recentVente.length
                    el.scrollTo({ left: cardW * i, behavior: 'smooth' })
                    setVenteIdx(i)
                  }}
                  style={{ width: venteIdx === i ? 20 : 8, height: 8, borderRadius: 4, background: venteIdx === i ? '#FF6B35' : 'rgba(255,107,53,0.25)', transition: 'all 0.3s ease', border: 'none', cursor: 'pointer', padding: 0 }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Contenu principal (catégories + grille) ── */}
      <div className="w-full px-4 md:px-16 py-4 md:py-8">

        {/* Categories */}
        <Reveal animation="anim-slide-left" className="flex items-center gap-2 overflow-x-auto pb-1 mb-4 md:mb-6 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => { setTransaction(cat.transaction); setType(cat.type) }}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all pill-hover"
              style={transaction === cat.transaction && type === cat.type ? {
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
            className="md:hidden flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all pill-hover"
            style={showFilters || prixMin || prixMax ? {
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

        {/* Filtres — panneau repliable (mobile uniquement : sur desktop, la
            barre structurée ancrée sous le hero couvre déjà ces filtres) */}
        {showFilters && (
          <Reveal animation="anim-fade-up" className="md:hidden glass-card rounded-2xl p-4 mb-4">

            {/* Ville ou quartier */}
            <div className="mb-4">
              <p className="text-xs font-bold text-text-dark uppercase tracking-wide mb-2">Ville ou quartier</p>
              <div className="relative">
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-divider bg-surface-g">
                  <span style={{ color: 'rgba(0,0,0,0.3)' }}><PinIcon /></span>
                  <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setShowSuggest(true) }}
                    onFocus={() => setShowSuggest(true)}
                    onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                    placeholder="Ex: Cotonou, Adovié, Akpakpa…"
                    className="flex-1 min-w-0 bg-transparent outline-none text-sm text-text-dark placeholder-gray-400"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} style={{ color: 'rgba(0,0,0,0.3)' }}>
                      <XIcon />
                    </button>
                  )}
                </div>
                {showSuggest && suggestions.length > 0 && (
                  <div className="absolute z-30 mt-1 w-full bg-white rounded-xl border border-divider shadow-lg max-h-56 overflow-y-auto">
                    {suggestions.map((q, i) => (
                      <button key={`${q.nom}-${i}`} type="button" onClick={() => { setSearch(q.nom); setShowSuggest(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-g border-b border-divider last:border-b-0 flex items-center justify-between gap-2">
                        <span className="text-text-dark font-medium">{q.nom}</span>
                        <span className="text-text-grey text-xs flex-shrink-0">{q.ville}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-text-grey mt-1.5">La recherche tolère les variantes orthographiques</p>
            </div>

            {/* Transaction */}
            <div className="mb-4">
              <p className="text-xs font-bold text-text-dark uppercase tracking-wide mb-2">Transaction</p>
              <div className="flex gap-2">
                {TRANSACTIONS.map(t => (
                  <button key={t.key} onClick={() => setTransaction(t.key)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                    style={transaction === t.key
                      ? { background: 'rgba(75,107,255,0.14)', borderColor: 'rgba(75,107,255,0.35)', color: '#4B6BFF' }
                      : { background: '#fff', borderColor: 'rgba(0,0,0,0.08)', color: '#6E6E73' }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type de bien */}
            <div className="mb-4">
              <p className="text-xs font-bold text-text-dark uppercase tracking-wide mb-2">Type de bien</p>
              <div className="flex flex-wrap gap-2">
                {TYPES.map(t => (
                  <button key={t.key} onClick={() => setType(t.key)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
                    style={type === t.key
                      ? { background: 'rgba(75,107,255,0.14)', borderColor: 'rgba(75,107,255,0.35)', color: '#4B6BFF' }
                      : { background: '#fff', borderColor: 'rgba(0,0,0,0.08)', color: '#6E6E73' }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <p className="text-xs font-bold text-text-dark uppercase tracking-wide mb-2">Budget (FCFA)</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {BUDGET_PRESETS.map(p => {
                  const active = prixMax === String(p.max)
                  return (
                    <button
                      key={p.label}
                      onClick={() => { setPrixMin(''); setPrixMax(active ? '' : String(p.max)) }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                      style={active
                        ? { background: '#4B6BFF', color: '#fff', borderColor: '#4B6BFF' }
                        : { background: '#fff', color: '#6E6E73', borderColor: 'rgba(0,0,0,0.08)' }}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number" min={0} value={prixMin}
                  onChange={e => setPrixMin(e.target.value)}
                  placeholder="Minimum"
                  className="flex-1 min-w-0 border border-divider rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-surface-g"
                />
                <span className="text-text-grey text-sm flex-shrink-0">—</span>
                <input
                  type="number" min={0} value={prixMax}
                  onChange={e => setPrixMax(e.target.value)}
                  placeholder="Maximum"
                  className="flex-1 min-w-0 border border-divider rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-surface-g"
                />
                {(prixMin || prixMax) && (
                  <button onClick={() => { setPrixMin(''); setPrixMax('') }} className="text-xs font-semibold text-primary flex-shrink-0">
                    Effacer
                  </button>
                )}
              </div>
            </div>
          </Reveal>
        )}

        {/* Section title */}
        <Reveal animation="anim-fade-up" className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-bold text-text-dark">
            {!transaction && !type ? 'Toutes les annonces' : catLabel}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
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

      {/* ── Nos services — pourquoi choisir REFUGE ── */}
      <div className="hidden md:block w-full px-16 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: '#4B6BFF' }}>Pourquoi choisir REFUGE</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-text-dark">NOS SERVICES</h2>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            {
              title: 'Moteur de recherche',
              desc: 'Filtrez par ville, quartier, type de bien et budget pour trouver rapidement le logement qu\'il vous faut.',
              icon: <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#4B6BFF" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
            },
            {
              title: 'Visites en ligne',
              desc: 'Réservez votre créneau de visite en quelques clics et suivez la confirmation en temps réel.',
              icon: <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#4B6BFF" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 16l2 2 4-4" /></svg>,
            },
            {
              title: 'Paiement sécurisé',
              desc: 'Réglez vos frais de visite et vos loyers via Mobile Money (MTN MoMo, FedaPay), en toute sécurité.',
              icon: <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#4B6BFF" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
            },
            {
              title: 'Messagerie intégrée',
              desc: 'Échangez directement avec les propriétaires et démarcheurs sans quitter l\'application.',
              icon: <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#4B6BFF" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
            },
            {
              title: 'Biens vérifiés',
              desc: 'Chaque annonce est vérifiée avant publication pour vous garantir des informations fiables.',
              icon: <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#4B6BFF" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
            },
            {
              title: 'Support réactif',
              desc: 'Une équipe à votre écoute pour vous accompagner à chaque étape de votre recherche.',
              icon: <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#4B6BFF" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-2a4 4 0 014-4h10a4 4 0 014 4v2M3 18a2 2 0 002 2h1a1 1 0 001-1v-4a1 1 0 00-1-1H3v6zm18 0a2 2 0 01-2 2h-1a1 1 0 01-1-1v-4a1 1 0 011-1h3v6z" /></svg>,
            },
          ].map(s => (
            <div key={s.title} className="rounded-2xl p-7 bg-white" style={{ border: '1px solid rgba(75,107,255,0.15)', boxShadow: '0 4px 20px rgba(75,107,255,0.06)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(75,107,255,0.1)' }}>
                {s.icon}
              </div>
              <h3 className="font-bold text-text-dark text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-text-grey leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Emplacements de bien — nuage de quartiers, taille proportionnelle
           au nombre de biens publiés (comme un tag cloud classique) ── */}
      {quartiersActifs.length > 0 && (
        <div className="hidden md:block w-full px-16 py-12" style={{ background: '#1A1A1A' }}>
          <h2 className="text-white font-bold text-xl mb-6">Emplacements de bien</h2>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3">
            {quartiersActifs.map(q => {
              const count = quartierCounts[q]
              return (
                <button
                  key={q}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(q)}`)}
                  title={`${count} bien${count > 1 ? 's' : ''}`}
                  className="transition-opacity hover:opacity-70"
                  style={{ color: '#4B6BFF', fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.3 }}
                >
                  {capitalizeQuartier(q)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Pied de page ── */}
      <footer className="hidden md:block w-full px-16 py-8"
        style={{ background: 'rgba(245,245,247,0.78)', backdropFilter: 'blur(48px) saturate(180%)', WebkitBackdropFilter: 'blur(48px) saturate(180%)', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-2.5" style={{ minHeight: 40 }}>
          <img src={logoUrl} alt="REFUGE" style={{ height: 40, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
          <span className="font-bold text-lg tracking-tight" style={{ color: '#00AEEF' }}>REFUGE</span>
        </div>
        <p className="text-xs mt-4" style={{ color: 'rgba(0,0,0,0.4)' }}>
          © {new Date().getFullYear()} REFUGE. Tous droits réservés.
        </p>
      </footer>

    </div>
  )
}
