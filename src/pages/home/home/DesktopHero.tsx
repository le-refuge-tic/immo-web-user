import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { usePrefersReducedMotion } from '../../../hooks/useCarouselAutoplay'
import { HERO_SLIDES } from './constants'
import { SearchIcon } from './icons'
import SearchPanel from './SearchPanel'
import type { Tokens } from './tokens'
import type { HomeSearch } from './useHomeSearch'

interface DesktopHeroProps {
  s: HomeSearch
  isDark: boolean
  tk: Tokens
  biens: any[]
}

/** Hero desktop : diaporama plein écran, accroche, chiffres clés et panneau de recherche flottant. */
export default function DesktopHero({ s, isDark, tk, biens }: DesktopHeroProps) {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()

  /* ── Carrousel hero ── */
  const [heroIdx,    setHeroIdx]    = useState(0)
  const [heroPaused, setHeroPaused] = useState(false)
  const heroTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const heroGo = useCallback((dir: 1 | -1) => {
    setHeroIdx(i => (i + dir + HERO_SLIDES.length) % HERO_SLIDES.length)
  }, [])

  const reducedMotion = usePrefersReducedMotion()
  useEffect(() => {
    if (heroPaused || reducedMotion) return
    heroTimer.current = setInterval(() => { if (!document.hidden) heroGo(1) }, 5500)
    return () => { if (heroTimer.current) clearInterval(heroTimer.current) }
  }, [heroPaused, reducedMotion, heroGo])

  /* ── Panneau recherche flottant ── */
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

  return (
    <div
      className="hidden md:flex relative w-full flex-col justify-end overflow-hidden"
      style={{ minHeight: '78vh' }}
      onMouseEnter={() => setHeroPaused(true)}
      onMouseLeave={() => setHeroPaused(false)}
    >
      {HERO_SLIDES.map((src, i) => (
        <img key={src} src={src} alt=""
          loading={i === 0 ? 'eager' : 'lazy'}
          fetchPriority={i === 0 ? 'high' : 'auto'}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: i === heroIdx ? 1 : 0, zIndex: 0 }} />
      ))}
      <div className="absolute inset-0 z-[1]" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.38) 50%, rgba(0,0,0,0.12) 100%)' }} />

      {/* Flèches */}
      <button onClick={() => heroGo(-1)} aria-label="Slide précédente"
        className="hero-arrow absolute left-5 top-1/2 -translate-y-1/2 z-[3] w-11 h-11 rounded-full flex items-center justify-center transition-all"
        style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)' }}>
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button onClick={() => heroGo(1)} aria-label="Slide suivante"
        className="hero-arrow absolute right-5 top-1/2 -translate-y-1/2 z-[3] w-11 h-11 rounded-full flex items-center justify-center transition-all"
        style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)' }}>
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Contenu hero */}
      <div className="relative z-[2] w-full px-8 md:px-16 pb-28 pt-12">
        <p className="text-white/60 text-xs md:text-sm uppercase tracking-widest font-medium mb-3 anim-fade-up">
          Immobilier au Bénin — Annonces modérées
        </p>
        <h1 className="text-white font-bold leading-[1.05] tracking-tight mb-4 anim-blur-up d-100 max-w-2xl"
          style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)' }}>
          Trouvez votre logement idéal.<br />Habitez en confiance.
        </h1>
        <p className="text-white/60 text-base md:text-lg leading-relaxed mb-6 max-w-xl anim-fade-up d-300">
          Maisons, appartements, terrains — à Cotonou, Abomey-Calavi et partout au Bénin.
        </p>
        {/* CTA principal (orange réservé au parcours de location) + secondaire propriétaire */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mb-2 anim-fade-up d-300">
          <button onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] transition-transform hover:-translate-y-0.5"
            style={{ background: '#FF6B35', color: '#1A1A2E', boxShadow: '0 6px 24px rgba(255,107,53,0.40)' }}>
            <SearchIcon /> Trouver mon logement
          </button>
          <button onClick={() => navigate(isLoggedIn ? '/nouveau-bien' : '/register')}
            className="text-sm font-semibold text-white/85 underline underline-offset-4 decoration-white/40 hover:text-white">
            Vous êtes propriétaire ? Publier mon bien gratuitement
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-6 md:gap-12 pt-6 mt-2 anim-fade-in d-600 max-w-2xl"
          style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          {[
            { val: biens.length > 0 ? `${biens.length}+` : '—', label: 'Annonces disponibles' },
            { val: '5',    label: 'Villes couvertes' },
            { val: '100%', label: 'Annonces modérées' },
            { val: '24h',  label: 'Délai de réponse visé' },
          ].map((s, i) => (
            <div key={s.label} className="anim-fade-up" style={{ animationDelay: `${600 + i * 80}ms` }}>
              <p className="text-white font-bold text-2xl md:text-3xl tracking-tight">{s.val}</p>
              <p className="text-white/50 text-xs md:text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Indicateurs + bouton pause */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[3] flex items-center gap-3">
        {HERO_SLIDES.map((_, i) => (
          <button key={i} onClick={() => setHeroIdx(i)} aria-label={`Slide ${i + 1}`}
            style={{ width: heroIdx === i ? 20 : 8, height: 8, borderRadius: 4,
              background: heroIdx === i ? '#fff' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.3s ease', border: 'none', cursor: 'pointer', padding: 0 }} />
        ))}
        <button
          onClick={() => setHeroPaused(v => !v)}
          aria-label={heroPaused ? 'Reprendre le diaporama' : 'Mettre en pause le diaporama'}
          aria-pressed={heroPaused}
          style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.7)',
            background: 'rgba(0,0,0,0.35)', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: 0, flexShrink: 0 }}
        >
          {heroPaused ? (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="white" aria-hidden="true">
              <path d="M0 0l10 6-10 6V0z" />
            </svg>
          ) : (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="white" aria-hidden="true">
              <rect x="0" y="0" width="3.5" height="12" />
              <rect x="6.5" y="0" width="3.5" height="12" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Panneau recherche flottant ── */}
      {/* Tablette : en haut à gauche, hors du titre. Desktop : à droite, centré verticalement. */}
      <SearchPanel s={s} isDark={isDark} tk={tk} searchOpen={searchOpen} setSearchOpen={setSearchOpen} searchPanelRef={searchPanelRef} />
    </div>
  )
}
