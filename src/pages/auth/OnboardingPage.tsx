import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import img1 from '../../assets/onboarding-1.jpg'
import img2 from '../../assets/onboarding-2.jpg'
import img3 from '../../assets/onboarding-3.jpg'

const SLIDES = [
  {
    accent: '#4B6BFF',
    image: img1,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
        <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
      </svg>
    ),
    title: 'Trouvez votre\nlogement idéal',
    subtitle: 'Recherchez parmi des centaines de logements vérifiés à Cotonou et Abomey-Calavi.',
    features: ['Recherche avancée', 'Filtres intelligents', 'Résultats en temps réel'],
    btnLabel: 'Commencer',
  },
  {
    accent: '#FF6B35',
    image: img2,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Planifiez vos\nvisites facilement',
    subtitle: "Réservez un créneau et payez en ligne. L'agent vous contacte directement.",
    features: ['Réservation en ligne', 'Confirmation rapide', 'Rappels automatiques'],
    btnLabel: 'Continuer',
  },
  {
    accent: '#22C55E',
    image: img3,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
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

  const goTo = (idx: number) => { if (idx >= 0 && idx < SLIDES.length) setCurrent(idx) }

  const next = () => {
    if (current < SLIDES.length - 1) setCurrent(current + 1)
    else navigate('/onboarding/projet', { replace: true })
  }

  const skip = () => {
    localStorage.setItem('rg_onboarded', 'true')
    navigate('/', { replace: true })
  }

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
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
      className="min-h-dvh relative overflow-hidden flex flex-col select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Images de fond — transition opacity */}
      {SLIDES.map((s, i) => (
        <img
          key={i}
          src={s.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        />
      ))}

      {/* Overlay dégradé du bas */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{ background: `linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.22) 100%)` }}
      />

      <div className="relative z-10 flex flex-col min-h-dvh">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 md:px-16 pt-14 pb-4">
          {current > 0 ? (
            <button
              onClick={() => goTo(current - 1)}
              className="w-10 h-10 flex items-center justify-center rounded-[12px]"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#4B6BFF' }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-white font-bold text-base tracking-tight">REFUGE</span>
            </div>
          )}

          <div className="px-3.5 py-1.5 rounded-full text-white text-[12px] font-semibold" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
            {current + 1} / {SLIDES.length}
          </div>

          <button onClick={skip} className="px-3.5 py-1.5 rounded-full text-white text-[13px] font-medium" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
            Passer
          </button>
        </div>

        <div className="flex-1" />

        {/* Contenu bas, aligné à gauche */}
        <div className="px-7 md:px-16 pb-10 md:pb-16">

          {/* Icone + dots */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-[13px] flex items-center justify-center flex-shrink-0" style={{ background: slide.accent, boxShadow: `0 4px 12px ${slide.accent}66` }}>
              {slide.icon}
            </div>
            <div className="flex items-center gap-1.5">
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  onClick={() => goTo(i)}
                  className="h-2 rounded-full cursor-pointer transition-all duration-300"
                  style={{ width: i === current ? 28 : 8, background: i === current ? slide.accent : 'rgba(255,255,255,0.3)' }}
                />
              ))}
            </div>
          </div>

          <h1
            className="text-white font-bold leading-[1.1] tracking-tight mb-3"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.8rem)', whiteSpace: 'pre-line' }}
          >
            {slide.title}
          </h1>
          <p className="text-white/65 leading-relaxed mb-6" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.1rem)' }}>
            {slide.subtitle}
          </p>

          <div className="flex flex-wrap gap-2 mb-7">
            {slide.features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium text-white/90"
                style={{ background: `${slide.accent}33`, border: `1px solid ${slide.accent}55` }}
              >
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={slide.accent} strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </div>
            ))}
          </div>

          <button
            onClick={next}
            className="w-full md:w-auto md:px-12 h-[54px] rounded-[16px] flex items-center justify-center gap-3 font-bold text-white text-base hover:opacity-90 transition-opacity"
            style={{ background: slide.accent, boxShadow: `0 4px 16px ${slide.accent}55` }}
          >
            <span>{slide.btnLabel}</span>
            <div className="w-7 h-7 rounded-[8px] flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
