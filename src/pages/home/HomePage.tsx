import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { biensApi } from '../../api/biensApi'
import { favoritesApi } from '../../api/favoritesApi'
import BienCard from '../../components/BienCard'
import Reveal from '../../components/Reveal'
import HERO_IMG from '../../assets/hero-interior.jpg'
import logoUrl from '../../assets/REFUGE-ICON.png'
import { rechercherQuartiers, type Quartier } from '../../data/quartiers'

const BACKEND = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1').replace('/api/v1', '') + '/'
function resolveUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return BACKEND + url
}

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
  { key: 'terrain',       label: 'Terrain' },
  { key: 'guesthouse',    label: 'Guesthouse' },
]

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
    .filter(b => !type || b.type === type)
    .filter(b => !search.trim() || matchLoc(b, search.trim()))
    .filter(b => minVal == null || Number(b.prix) >= minVal)
    .filter(b => maxVal == null || Number(b.prix) <= maxVal)

  // Biens avec photo — utilisés pour faire défiler le fond du hero desktop
  // (comme les portails immobiliers classiques) au lieu d'une image fixe.
  const [heroIndex, setHeroIndex] = useState(0)
  const heroBiens = biens.filter(b => b.photos?.length > 0).slice(0, 8)
  const heroBien = heroBiens.length > 0 ? heroBiens[heroIndex % heroBiens.length] : null
  const heroCover = heroBien ? (heroBien.photos.find((p: any) => p.is_cover) || heroBien.photos[0]) : null
  const heroPrev = () => setHeroIndex(i => (i - 1 + heroBiens.length) % heroBiens.length)
  const heroNext = () => setHeroIndex(i => (i + 1) % heroBiens.length)

  // Biens à louer les plus récemment publiés — section dédiée façon portails
  // immobiliers classiques (photo + nombre de photos + date d'ajout).
  const recentLocation = biens
    .filter(b => b.transaction === 'location')
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 3)

  // Même principe côté vente.
  const recentVente = biens
    .filter(b => b.transaction === 'vente')
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 3)

  // Quartiers où des biens sont actuellement publiés — liste complète pour la
  // section "Emplacements de bien", tronquée pour le titre de la bannière CTA.
  const quartiersActifs = Array.from(new Set(
    biens.map(b => b.localisation?.quartier).filter((q): q is string => !!q?.trim())
  )).sort((a, b) => a.localeCompare(b, 'fr'))

  const voirLesBiens = () => {
    document.getElementById('location-biens')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
    if (type) params.set('type', type)
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
      <div className="hidden md:flex relative w-full flex-col justify-center group/hero" style={{ minHeight: '72vh' }}>
        <img
          key={heroBien?.id ?? 'default'}
          src={heroCover ? resolveUrl(heroCover.url) : HERO_IMG}
          alt=""
          className="absolute inset-0 w-full h-full object-cover anim-fade-in"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.15) 100%)' }} />

        {/* Flèches de navigation entre les photos des biens — visibles au survol
            du hero, pour switcher vers la photo d'un autre bien publié. */}
        {heroBiens.length > 1 && (
          <>
            <button
              onClick={heroPrev}
              aria-label="Bien précédent"
              className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-opacity"
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={heroNext}
              aria-label="Bien suivant"
              className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-opacity"
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        <div className="relative z-10 w-full px-16 pb-20">
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

        {/* Carte "bien à la une" — flottante sur le hero, inspirée des portails
            immobiliers classiques ; n'apparaît qu'à partir de xl pour ne jamais
            chevaucher le titre sur les largeurs desktop plus étroites. */}
        {heroBien && (
          <div key={heroBien.id} className="hidden xl:block absolute z-10 anim-scale-in" style={{ top: '18%', right: '4rem', width: 320 }}>
            <button onClick={() => navigate(`/biens/${heroBien.id}`)} className="w-full text-left bg-white rounded-2xl overflow-hidden shadow-2xl hover:-translate-y-1 transition-transform">
              <div className="px-3 pt-3">
                <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold text-white" style={{ background: '#4B6BFF' }}>
                  À la une
                </span>
              </div>
              <div className="px-5 pt-3 pb-5">
                <p className="font-bold text-text-dark text-[15px] leading-snug mb-2">
                  {TYPES.find(t => t.key === heroBien.type)?.label || heroBien.type}
                  {heroBien.localisation?.quartier ? ` — ${heroBien.localisation.quartier}` : ''}
                </p>
                <div className="flex items-center gap-1.5 text-text-grey text-xs mb-3">
                  <PinIcon />
                  <span>{heroBien.localisation?.ville || 'Bénin'}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-divider">
                  <span className="text-[11px] font-semibold text-text-grey uppercase tracking-wide">
                    {heroBien.transaction === 'location' ? 'À louer' : 'À vendre'}
                  </span>
                  <p className="font-bold text-lg" style={{ color: '#4B6BFF' }}>
                    {Number(heroBien.prix).toLocaleString('fr-FR')}
                    <span className="text-xs font-medium text-text-grey"> FCFA{heroBien.transaction === 'location' ? '/mois' : ''}</span>
                  </p>
                </div>
              </div>
            </button>
            {heroBiens.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {heroBiens.map((b, i) => (
                  <button
                    key={b.id}
                    onClick={() => setHeroIndex(i)}
                    aria-label={`Bien ${i + 1}`}
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: i === heroIndex ? 20 : 6, background: i === heroIndex ? '#fff' : 'rgba(255,255,255,0.4)' }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Barre de recherche structurée — ancrée à cheval sur le bas du hero,
          remplace l'ancienne barre mono-champ + panneau "Filtres" replié. ── */}
      <div className="hidden md:block relative z-20 px-16" style={{ marginTop: -44 }}>
        <div className="bg-white rounded-2xl shadow-2xl flex items-stretch divide-x divide-divider anim-scale-in d-400">
          <div className="flex-1 min-w-0 px-6 py-4 relative">
            <p className="text-[11px] font-bold text-text-grey uppercase tracking-wide mb-1.5">Quartier</p>
            <div className="flex items-center gap-2">
              <span className="text-text-grey flex-shrink-0"><PinIcon /></span>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setShowSuggest(true) }}
                onFocus={() => setShowSuggest(true)}
                onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                onKeyDown={e => { if (e.key === 'Enter') goToSearch() }}
                placeholder="Où cherchez-vous ?"
                className="flex-1 min-w-0 bg-transparent outline-none text-sm text-text-dark placeholder-gray-400"
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
          <div className="w-48 flex-shrink-0 px-6 py-4">
            <p className="text-[11px] font-bold text-text-grey uppercase tracking-wide mb-1.5">Opération</p>
            <select value={transaction} onChange={e => setTransaction(e.target.value)}
              className="w-full bg-transparent outline-none text-sm text-text-dark cursor-pointer">
              {TRANSACTIONS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div className="w-48 flex-shrink-0 px-6 py-4">
            <p className="text-[11px] font-bold text-text-grey uppercase tracking-wide mb-1.5">Type de bien</p>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full bg-transparent outline-none text-sm text-text-dark cursor-pointer">
              {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div className="w-44 flex-shrink-0 px-6 py-4">
            <p className="text-[11px] font-bold text-text-grey uppercase tracking-wide mb-1.5">Budget max</p>
            <select value={prixMax} onChange={e => { setPrixMin(''); setPrixMax(e.target.value) }}
              className="w-full bg-transparent outline-none text-sm text-text-dark cursor-pointer">
              <option value="">Tous</option>
              {BUDGET_PRESETS.map(p => <option key={p.label} value={p.max}>{p.label}</option>)}
            </select>
          </div>
          <button onClick={goToSearch}
            className="flex-shrink-0 flex items-center gap-2 px-8 font-bold text-white text-sm rounded-r-2xl transition-opacity hover:opacity-90"
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
          <div className="grid grid-cols-3 gap-5">
            {recentLocation.map(bien => (
              <BienCard
                key={bien.id}
                bien={bien}
                favoriteIds={favIds}
                onFavoriteToggle={handleFavToggle}
                showPhotoCount
                showAddedDate
              />
            ))}
          </div>
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
          <div className="grid grid-cols-3 gap-5">
            {recentVente.map(bien => (
              <BienCard
                key={bien.id}
                bien={bien}
                favoriteIds={favIds}
                onFavoriteToggle={handleFavToggle}
                showPhotoCount
                showAddedDate
              />
            ))}
          </div>
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

      {/* ── Bannière CTA — voir les biens ── */}
      <div className="hidden md:block relative w-full overflow-hidden mt-4" style={{ height: 340 }}>
        <div className="absolute inset-0" style={{ clipPath: 'polygon(0 6%, 100% 0%, 100% 94%, 0% 100%)' }}>
          <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(10,10,10,0.72)' }} />
        </div>
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-8">
          <p className="text-white/70 text-sm font-semibold uppercase tracking-wide mb-3">
            Trouver un bien
          </p>
          <h2 className="text-white font-bold text-3xl md:text-4xl max-w-3xl leading-snug mb-7">
            {quartiersActifs.length > 0
              ? <>Des biens disponibles à {quartiersActifs.slice(0, 5).join(', ')}{quartiersActifs.length > 5 ? '…' : ''}</>
              : 'REFUGE, votre référence pour l’immobilier au Bénin'}
          </h2>
          <button onClick={voirLesBiens}
            className="px-7 py-3.5 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-opacity"
            style={{ background: '#4B6BFF', boxShadow: '0 4px 16px rgba(75,107,255,0.4)' }}>
            Voir les biens
          </button>
        </div>
      </div>

      {/* ── Emplacements de bien — tous les quartiers actuellement publiés ── */}
      {quartiersActifs.length > 0 && (
        <div className="hidden md:block w-full px-16 py-12" style={{ background: '#1A1A1A' }}>
          <h2 className="text-white font-bold text-xl mb-5">Emplacements de bien</h2>
          <div className="flex flex-wrap gap-3">
            {quartiersActifs.map(q => (
              <button
                key={q}
                onClick={() => navigate(`/search?q=${encodeURIComponent(q)}`)}
                className="px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-85"
                style={{ background: '#4B6BFF' }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Pied de page ── */}
      <footer className="hidden md:block w-full px-16 py-8"
        style={{ background: 'rgba(245,245,247,0.78)', backdropFilter: 'blur(48px) saturate(180%)', WebkitBackdropFilter: 'blur(48px) saturate(180%)', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <img src={logoUrl} alt="REFUGE" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span className="font-bold text-lg tracking-tight" style={{ color: '#00AEEF' }}>REFUGE</span>
        </div>
        <p className="text-xs mt-4" style={{ color: 'rgba(0,0,0,0.4)' }}>
          © {new Date().getFullYear()} REFUGE. Tous droits réservés.
        </p>
      </footer>

    </div>
  )
}
