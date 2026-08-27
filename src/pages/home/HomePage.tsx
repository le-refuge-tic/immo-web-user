import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { biensApi } from '../../api/biensApi'
import { favoritesApi } from '../../api/favoritesApi'
import BienCard from '../../components/BienCard'
import Reveal from '../../components/Reveal'
import HERO_IMG from '../../assets/hero-interior.jpg'
import slide2 from '../../assets/onboarding-1.jpg'
import slide3 from '../../assets/onboarding-2.jpg'
import slide4 from '../../assets/onboarding-3.jpg'
import slide5 from '../../assets/onboarding-side.jpg'
import logoUrl from '../../assets/REFUGE-ICON.png'
import { rechercherQuartiers, type Quartier } from '../../data/quartiers'

const HERO_SLIDES = [HERO_IMG, slide2, slide3, slide4, slide5]

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
  const { theme } = useTheme()
  const isDark = theme === 'dark'
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

  // ── Carrousel hero ─────────────────────────────────────────────────────────
  const [heroIdx,    setHeroIdx]    = useState(0)
  const [heroPaused, setHeroPaused] = useState(false)
  const heroTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const heroGo = useCallback((dir: 1 | -1) => {
    setHeroIdx(i => (i + dir + HERO_SLIDES.length) % HERO_SLIDES.length)
  }, [])

  useEffect(() => {
    if (heroPaused) return
    heroTimer.current = setInterval(() => heroGo(1), 5500)
    return () => { if (heroTimer.current) clearInterval(heroTimer.current) }
  }, [heroPaused, heroGo])

  // ── Bouton recherche flottant ───────────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false)
  const searchPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!searchOpen) return
    const handler = (e: MouseEvent) => {
      if (searchPanelRef.current && !searchPanelRef.current.contains(e.target as Node))
        setSearchOpen(false)
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSearchOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', keyHandler) }
  }, [searchOpen])

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

      {/* ── DESKTOP hero carrousel pleine largeur ── */}
      <div
        className="hidden md:flex relative w-full flex-col justify-end overflow-hidden"
        style={{ minHeight: '78vh' }}
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        {/* Slides en fondu */}
        {HERO_SLIDES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            style={{ opacity: i === heroIdx ? 1 : 0, zIndex: 0 }}
          />
        ))}

        {/* Overlay dégradé */}
        <div className="absolute inset-0 z-[1]" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.38) 50%, rgba(0,0,0,0.12) 100%)' }} />

        {/* Flèches — visibles au hover du hero */}
        <button
          onClick={() => heroGo(-1)}
          aria-label="Slide précédente"
          className="hero-arrow absolute left-5 top-1/2 -translate-y-1/2 z-[3] w-11 h-11 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)' }}
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => heroGo(1)}
          aria-label="Slide suivante"
          className="hero-arrow absolute right-5 top-1/2 -translate-y-1/2 z-[3] w-11 h-11 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)' }}
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Contenu texte */}
        <div className="relative z-[2] w-full px-8 md:px-16 pb-28 pt-12">
          <p className="text-white/60 text-xs md:text-sm uppercase tracking-widest font-medium mb-3 md:mb-4 anim-fade-up">
            Immobilier au Bénin — Annonces vérifiées
          </p>
          <h1 className="text-white font-bold leading-[1.05] tracking-tight mb-4 md:mb-5 anim-blur-up d-100 max-w-2xl" style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)' }}>
            Trouvez votre logement idéal.<br />Habitez en confiance.
          </h1>
          <p className="text-white/60 text-base md:text-lg leading-relaxed mb-6 md:mb-8 max-w-xl anim-fade-up d-300">
            Maisons, appartements, terrains — à Cotonou, Abomey-Calavi et partout au Bénin.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-6 md:gap-12 pt-6 md:pt-8 mt-2 anim-fade-in d-600 max-w-2xl" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            {[
              { val: biens.length > 0 ? `${biens.length}+` : '500+', label: 'Annonces disponibles' },
              { val: '5',    label: 'Villes couvertes' },
              { val: '100%', label: 'Biens vérifiés' },
              { val: '24h',  label: 'Réponse garantie' },
            ].map((s, i) => (
              <div key={s.label} className="anim-fade-up" style={{ animationDelay: `${600 + i * 80}ms` }}>
                <p className="text-white font-bold text-2xl md:text-3xl tracking-tight">{s.val}</p>
                <p className="text-white/50 text-xs md:text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Indicateurs à points */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[3] flex items-center gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              aria-label={`Aller à la slide ${i + 1}`}
              style={{
                width: heroIdx === i ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: heroIdx === i ? '#fff' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.3s ease',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* ── Panneau de recherche — centré verticalement à droite du héro ── */}
        <div
          ref={searchPanelRef}
          className="absolute right-10 top-1/2 -translate-y-1/2 z-[4] w-80"
        >
          {/* Couleurs du panneau selon le thème — le hero a toujours une image sombre
              donc le bouton fermé reste blanc/translucide sur l'image.
              Le panneau ouvert s'adapte au thème global. */}
          {(() => {
            const panelBg   = isDark ? 'rgba(14,14,24,0.96)'  : 'rgba(255,255,255,0.96)'
            const panelBdr  = isDark ? 'rgba(75,107,255,0.30)' : 'rgba(75,107,255,0.25)'
            const panelSep  = isDark ? 'rgba(255,255,255,0.08)': 'rgba(0,0,0,0.07)'
            const fieldBg   = isDark ? 'rgba(255,255,255,0.06)': 'rgba(0,0,0,0.04)'
            const fieldBdr  = isDark ? 'rgba(255,255,255,0.10)': 'rgba(0,0,0,0.10)'
            const labelClr  = isDark ? 'rgba(255,255,255,0.35)': 'rgba(0,0,0,0.40)'
            const textClr   = isDark ? '#E8E8EF'               : '#1D1D1F'
            const phClr     = isDark ? 'rgba(255,255,255,0.30)': 'rgba(0,0,0,0.30)'
            const closeBg   = isDark ? 'rgba(255,255,255,0.08)': 'rgba(0,0,0,0.06)'
            const closeClr  = isDark ? 'rgba(255,255,255,0.55)': 'rgba(0,0,0,0.45)'
            const suggestBg = isDark ? 'rgba(18,18,30,0.99)'   : '#ffffff'
            const suggestBdr= isDark ? 'rgba(255,255,255,0.10)': 'rgba(0,0,0,0.10)'
            const suggestRow= isDark ? 'rgba(255,255,255,0.06)': 'rgba(0,0,0,0.05)'
            const suggestHov= isDark ? 'rgba(75,107,255,0.14)' : 'rgba(75,107,255,0.08)'
            const pillActive= { background: '#4B6BFF', color: '#fff', border: '1px solid #4B6BFF' }
            const pillIdle  = { background: fieldBg, color: labelClr, border: `1px solid ${fieldBdr}` }
            return !searchOpen ? (
            /* ── Bouton fermé — toujours sombre car posé sur le hero ── */
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.99]"
              style={{
                background: 'rgba(10,10,22,0.60)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(75,107,255,0.45)',
                boxShadow: '0 0 0 1px rgba(75,107,255,0.15), 0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)',
              }}
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)', boxShadow: '0 4px 12px rgba(75,107,255,0.45)' }}>
                <SearchIcon />
              </span>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-white font-semibold text-sm truncate">
                  {search.trim() || 'Rechercher un bien…'}
                </p>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {[transaction && (transaction === 'location' ? 'Location' : 'Vente'), type && TYPES.find(t => t.key === type)?.label].filter(Boolean).join(' · ') || 'Tous types · Partout au Bénin'}
                </p>
              </div>
              {(search || transaction || type || prixMin || prixMax) && (
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                  style={{ background: '#4B6BFF' }}>
                  {[search, transaction, type, prixMin, prixMax].filter(Boolean).length}
                </span>
              )}
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.40)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : (
            /* ── Panneau ouvert — adapté au thème ── */
            <div
              className="w-full rounded-2xl overflow-visible anim-scale-in origin-top-right"
              style={{
                background: panelBg,
                backdropFilter: 'blur(56px) saturate(200%)',
                WebkitBackdropFilter: 'blur(56px) saturate(200%)',
                border: `1px solid ${panelBdr}`,
                boxShadow: isDark
                  ? '0 0 0 1px rgba(75,107,255,0.10), 0 32px 80px rgba(0,0,0,0.55)'
                  : '0 0 0 1px rgba(75,107,255,0.08), 0 24px 64px rgba(0,0,0,0.18)',
              }}
            >
              {/* En-tête */}
              <div className="px-4 pt-4 pb-3 flex items-center justify-between"
                style={{ borderBottom: `1px solid ${panelSep}` }}>
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg"
                    style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
                    <SearchIcon />
                  </span>
                  <span className="font-semibold text-sm" style={{ color: textClr }}>Recherche</span>
                </div>
                <button onClick={() => setSearchOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: closeBg, color: closeClr }}>
                  <XIcon />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {/* Champ localisation */}
                <div className="relative">
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                    style={{ background: fieldBg, border: `1px solid ${fieldBdr}` }}>
                    <span style={{ color: '#4B6BFF' }}><PinIcon /></span>
                    <input
                      autoFocus
                      value={search}
                      onChange={e => { setSearch(e.target.value); setShowSuggest(true) }}
                      onFocus={() => setShowSuggest(true)}
                      onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                      onKeyDown={e => { if (e.key === 'Enter') { goToSearch(); setSearchOpen(false) } }}
                      placeholder="Ville ou quartier…"
                      className="flex-1 min-w-0 bg-transparent outline-none text-sm"
                      style={{ color: textClr }}
                    />
                    {search && (
                      <button onClick={() => setSearch('')} style={{ color: phClr }}>
                        <XIcon />
                      </button>
                    )}
                  </div>
                  {showSuggest && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-xl overflow-hidden"
                      style={{ background: suggestBg, border: `1px solid ${suggestBdr}`, boxShadow: '0 16px 48px rgba(0,0,0,0.22)' }}>
                      {suggestions.map((q, i) => (
                        <button key={`${q.nom}-${i}`} type="button"
                          onClick={() => { setSearch(q.nom); setShowSuggest(false) }}
                          className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 transition-all"
                          style={{ borderBottom: `1px solid ${suggestRow}`, color: textClr }}
                          onMouseEnter={e => (e.currentTarget.style.background = suggestHov)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span className="font-medium">{q.nom}</span>
                          <span className="text-xs flex-shrink-0" style={{ color: phClr }}>{q.ville}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Opération — pills custom */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: labelClr }}>Opération</p>
                  <div className="flex gap-2">
                    {TRANSACTIONS.map(t => (
                      <button key={t.key} onClick={() => setTransaction(t.key)}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={transaction === t.key ? pillActive : pillIdle}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type de bien — pills custom */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: labelClr }}>Type de bien</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TYPES.slice(0, 5).map(t => (
                      <button key={t.key} onClick={() => setType(t.key)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={type === t.key ? pillActive : pillIdle}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget max rapide */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: labelClr }}>Budget max (FCFA)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {BUDGET_PRESETS.map(p => {
                      const active = prixMax === String(p.max)
                      return (
                        <button key={p.label}
                          onClick={() => { setPrixMin(''); setPrixMax(active ? '' : String(p.max)) }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                          style={active ? pillActive : pillIdle}>
                          {p.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Bouton rechercher */}
                <button
                  onClick={() => { goToSearch(); setSearchOpen(false) }}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)', boxShadow: '0 4px 20px rgba(75,107,255,0.45)' }}
                >
                  <SearchIcon />
                  Rechercher
                </button>
              </div>
            </div>
          )
          })()}
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

      {/* ── Pourquoi REFUGE — accroche + Nos services ── */}
      <div className="hidden md:block w-full px-16 py-20">

        {/* Accroche "Pourquoi choisir REFUGE ?" */}
        <Reveal animation="anim-fade-up" className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
            style={{ background: 'rgba(75,107,255,0.10)', color: '#4B6BFF', border: '1px solid rgba(75,107,255,0.20)' }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Pourquoi choisir REFUGE ?
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-5" style={{ color: 'var(--services-title, #1D1D1F)' }}>
            L'immobilier au Bénin,<br />
            <span style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              sans mauvaises surprises.
            </span>
          </h2>
          <p className="text-base md:text-lg leading-relaxed text-text-grey max-w-xl mx-auto">
            De la recherche à la signature, REFUGE centralise tout ce dont vous avez besoin pour trouver, visiter et louer en toute confiance.
          </p>
        </Reveal>

        {/* Grille services */}
        <div className="grid grid-cols-3 gap-5">
          {[
            {
              title: 'Moteur de recherche',
              desc: 'Filtrez par ville, quartier, type de bien et budget. Trouvez votre logement en quelques secondes.',
              icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
              color: '#4B6BFF',
              bg: 'rgba(75,107,255,0.10)',
              tag: 'Recherche avancée',
            },
            {
              title: 'Visites en ligne',
              desc: 'Réservez votre créneau en quelques clics. Confirmation en temps réel, rappel automatique.',
              icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 16l2 2 4-4" /></svg>,
              color: '#7B4BFF',
              bg: 'rgba(123,75,255,0.10)',
              tag: 'Agenda intelligent',
            },
            {
              title: 'Paiement sécurisé',
              desc: 'Réglez via MTN MoMo ou FedaPay. Vos transactions sont chiffrées et tracées.',
              icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
              color: '#00B087',
              bg: 'rgba(0,176,135,0.10)',
              tag: 'Mobile Money',
            },
            {
              title: 'Messagerie intégrée',
              desc: 'Discutez directement avec propriétaires et démarcheurs, sans intermédiaires.',
              icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
              color: '#FF6B35',
              bg: 'rgba(255,107,53,0.10)',
              tag: 'Communication directe',
            },
            {
              title: 'Biens vérifiés',
              desc: 'Chaque annonce est contrôlée avant publication. Zéro fausse annonce, zéro arnaque.',
              icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
              color: '#4B6BFF',
              bg: 'rgba(75,107,255,0.10)',
              tag: '100% fiable',
            },
            {
              title: 'Support réactif',
              desc: 'Une équipe disponible à chaque étape — de la recherche à l\'emménagement.',
              icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-2a4 4 0 014-4h10a4 4 0 014 4v2M3 18a2 2 0 002 2h1a1 1 0 001-1v-4a1 1 0 00-1-1H3v6zm18 0a2 2 0 01-2 2h-1a1 1 0 01-1-1v-4a1 1 0 011-1h3v6z" /></svg>,
              color: '#FF9800',
              bg: 'rgba(255,152,0,0.10)',
              tag: 'Assistance 24h',
            },
          ].map((s, i) => (
            <Reveal key={s.title} animation="anim-fade-up" delay={i * 70}>
              <div
                className="service-card rounded-3xl p-7 h-full flex flex-col gap-4 cursor-default"
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(-6px)'
                  el.style.outline = `1.5px solid ${s.color}44`
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(0)'
                  el.style.outline = 'none'
                }}
              >
                {/* Icône */}
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: s.bg, color: s.color }}>
                    {s.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: s.bg, color: s.color }}>
                    {s.tag}
                  </span>
                </div>
                {/* Texte */}
                <div>
                  <h3 className="font-bold text-text-dark text-base mb-1.5">{s.title}</h3>
                  <p className="text-sm text-text-grey leading-relaxed">{s.desc}</p>
                </div>
                {/* Barre couleur bas de carte */}
                <div className="mt-auto pt-4 flex items-center gap-2">
                  <div className="h-0.5 w-8 rounded-full" style={{ background: s.color, opacity: 0.4 }} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── Emplacements de bien — bande défilante ── */}
      {quartiersActifs.length > 0 && (
        <div className="w-full py-8 md:py-10 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #F8F9FF 0%, #EEF2FF 100%)', borderTop: '1px solid rgba(75,107,255,0.08)' }}>
          <div className="px-5 md:px-12 mb-5 flex items-end gap-3">
            <h2 className="font-bold text-lg md:text-xl" style={{ color: '#1A1A2E' }}>Emplacements</h2>
            <span className="text-sm mb-0.5" style={{ color: '#8B9CC8' }}>{quartiersActifs.length} quartier{quartiersActifs.length > 1 ? 's' : ''}</span>
          </div>
          {/* Deux rangées défilant en sens opposés */}
          <div className="space-y-3 overflow-hidden">
            {[0, 1].map(row => {
              const half = Math.ceil(quartiersActifs.length / 2)
              const items = quartiersActifs.slice(row * half, row * half + half)
              const direction = row === 0 ? 'scroll-ltr' : 'scroll-rtl'
              return (
                <div key={row} className={`flex gap-3 ${direction}`} style={{ width: 'max-content' }}>
                  {[...items, ...items].map((q, i) => {
                    const count = quartierCounts[q]
                    return (
                      <button key={`${q}-${i}`}
                        onClick={() => navigate(`/search?q=${encodeURIComponent(q)}`)}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all hover:scale-105 active:scale-95"
                        style={{
                          background: 'rgba(255,255,255,0.85)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(75,107,255,0.15)',
                          boxShadow: '0 2px 12px rgba(75,107,255,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
                        }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#4B6BFF', opacity: 0.7 }} />
                        <span className="text-sm font-semibold whitespace-nowrap" style={{ color: '#1A1A2E' }}>
                          {capitalizeQuartier(q)}
                        </span>
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: 'rgba(75,107,255,0.1)', color: '#4B6BFF' }}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Pied de page ── */}
      <footer className="hidden md:block w-full px-16 py-12" style={{
        background: isDark ? 'rgba(10,10,18,0.95)' : 'rgba(245,245,247,0.92)',
        backdropFilter: 'blur(48px) saturate(180%)',
        WebkitBackdropFilter: 'blur(48px) saturate(180%)',
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
      }}>
        <div className="flex items-start justify-between gap-12">

          {/* Marque */}
          <div className="flex-shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)', boxShadow: '0 4px 16px rgba(75,107,255,0.30)' }}>
                <img src={logoUrl} alt="REFUGE" style={{ width: 36, height: 36, objectFit: 'contain' }} />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight" style={{ color: '#4B6BFF' }}>REFUGE</span>
                <p className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.40)' }}>Immobilier au Bénin</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.50)' }}>
              La plateforme de référence pour trouver, louer ou acheter un bien immobilier au Bénin.
            </p>
          </div>

          {/* Navigation */}
          <div className="flex gap-16">
            {[
              { heading: 'Plateforme', links: [
                { label: 'Accueil', path: '/' },
                { label: 'Rechercher un bien', path: '/search' },
                { label: 'Mes favoris', path: '/favoris' },
                { label: 'Mes visites', path: '/mes-visites' },
              ]},
              { heading: 'Légal', links: [
                { label: 'Politique de confidentialité', path: '/confidentialite' },
                { label: "Conditions d'utilisation", path: '/conditions' },
                { label: 'Mentions légales', path: '/mentions-legales' },
                { label: 'Cookies', path: '/cookies' },
              ]},
            ].map(col => (
              <div key={col.heading}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.35)' }}>
                  {col.heading}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l.path}>
                      <button onClick={() => navigate(l.path)}
                        className="text-sm transition-colors hover:text-primary"
                        style={{ color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)' }}>
                        {l.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bas du footer */}
        <div className="mt-10 pt-6 flex items-center justify-between"
          style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}` }}>
          <p className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.35)' }}>
            © {new Date().getFullYear()} REFUGE. Tous droits réservés. Bénin 🇧🇯
          </p>
          <div className="flex items-center gap-4">
            {[
              { label: 'Confidentialité', path: '/confidentialite' },
              { label: 'CGU', path: '/conditions' },
            ].map((l, i) => (
              <span key={l.path} className="flex items-center gap-4">
                {i > 0 && <span style={{ color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.20)' }}>·</span>}
                <button onClick={() => navigate(l.path)} className="text-xs hover:text-primary transition-colors"
                  style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.40)' }}>
                  {l.label}
                </button>
              </span>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
