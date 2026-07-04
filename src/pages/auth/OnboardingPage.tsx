import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const SLIDES = [
  {
    accent: '#4B6BFF',
    bg: 'linear-gradient(160deg, #0F0A2E 0%, #1A1050 40%, #2D1EA0 100%)',
    icon: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
        <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
      </svg>
    ),
    title: 'Trouvez votre\nlogement idéal',
    subtitle: 'Recherchez parmi des centaines de logements vérifiés à Cotonou et Abomey-Calavi.',
    features: ['Recherche avancée', 'Filtres intelligents', 'Carte interactive'],
    btnLabel: 'Commencer',
  },
  {
    accent: '#FF6B35',
    bg: 'linear-gradient(160deg, #1A0800 0%, #3D1500 40%, #8B2E00 100%)',
    icon: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Planifiez vos\nvisites facilement',
    subtitle: 'Réservez un créneau et payez en ligne. L\'agent vous contacte directement.',
    features: ['Réservation en ligne', 'Confirmation rapide', 'Rappels automatiques'],
    btnLabel: 'Continuer',
  },
  {
    accent: '#22C55E',
    bg: 'linear-gradient(160deg, #021508 0%, #053515 40%, #0A6628 100%)',
    icon: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Sécurisé et\ntransparent',
    subtitle: 'Paiements via Mobile Money, reçus automatiques et logements vérifiés.',
    features: ['Mobile Money', 'Reçus automatiques', 'Biens vérifiés'],
    btnLabel: "C'est parti",
  },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const slide = SLIDES[current]

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < SLIDES.length) setCurrent(idx)
  }

  const next = () => {
    if (current < SLIDES.length - 1) {
      setCurrent(current + 1)
    } else {
      navigate('/onboarding/projet', { replace: true })
    }
  }

  const skip = () => {
    localStorage.setItem('rg_onboarded', 'true')
    navigate('/', { replace: true })
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) { if (current < SLIDES.length - 1) setCurrent(current + 1) }
      else { if (current > 0) setCurrent(current - 1) }
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col relative overflow-hidden select-none"
      style={{ background: slide.bg, transition: 'background 0.4s ease' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Déco cercles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[6%] right-[-50px] w-[160px] h-[160px] rounded-full" style={{ background: `${slide.accent}22` }} />
        <div className="absolute top-[18%] left-[-60px] w-[140px] h-[140px] rounded-full" style={{ background: `${slide.accent}14` }} />
        <div className="absolute bottom-[30%] right-[-30px] w-[100px] h-[100px] rounded-full" style={{ background: `${slide.accent}18` }} />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 md:px-16 pt-14 pb-4 relative z-10">
        {/* Back */}
        {current > 0 ? (
          <button
            onClick={() => goTo(current - 1)}
            className="w-10 h-10 flex items-center justify-center rounded-[12px]"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <div className="w-10" />
        )}

        {/* Counter */}
        <div
          className="px-3.5 py-1.5 rounded-full text-white text-[12px] font-semibold"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          {current + 1} / {SLIDES.length}
        </div>

        {/* Passer */}
        <button
          onClick={skip}
          className="px-3.5 py-1.5 rounded-full text-white text-[13px] font-medium"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          Passer
        </button>
      </div>

      {/* Content (poussé en bas) */}
      <div className="flex-1" />

      <div className="px-7 md:px-16 pb-10 relative z-10 w-full md:max-w-2xl md:mx-auto">
        {/* Icon + dots */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-11 h-11 rounded-[13px] flex items-center justify-center flex-shrink-0"
            style={{
              background: slide.accent,
              boxShadow: `0 4px 12px ${slide.accent}66`,
            }}
          >
            {slide.icon}
          </div>
          <div className="flex items-center gap-1.5">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                onClick={() => goTo(i)}
                className="h-2 rounded-full cursor-pointer transition-all duration-300"
                style={{
                  width: i === current ? 28 : 8,
                  background: i === current ? slide.accent : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-white text-[32px] font-bold leading-[1.15] tracking-tight mb-2.5"
          style={{ whiteSpace: 'pre-line' }}
        >
          {slide.title}
        </h1>

        {/* Subtitle */}
        <p className="text-white/65 text-[14px] leading-relaxed mb-5">
          {slide.subtitle}
        </p>

        {/* Feature chips */}
        <div className="flex flex-wrap gap-2 mb-7">
          {slide.features.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium text-white/90"
              style={{
                background: `${slide.accent}33`,
                border: `1px solid ${slide.accent}55`,
              }}
            >
              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={slide.accent} strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={next}
          className="w-full h-[54px] rounded-[16px] flex items-center justify-center gap-3 font-bold text-white text-base"
          style={{
            background: slide.accent,
            boxShadow: `0 4px 16px ${slide.accent}55`,
          }}
        >
          <span>{slide.btnLabel}</span>
          <div
            className="w-7 h-7 rounded-[8px] flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  )
}
