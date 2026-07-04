import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import sideImg from '../../assets/onboarding-side.jpg'

export default function OnboardingProjetPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<'acheter' | 'louer'>('louer')

  const handleNext = () => {
    navigate('/onboarding/destination', { state: { objectif: selected }, replace: true })
  }

  return (
    <div className="min-h-dvh relative overflow-hidden flex flex-col">

      {/* Image de fond */}
      <img src={sideImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0.25) 100%)' }} />

      <div className="relative z-10 flex flex-col min-h-dvh">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 md:px-16 pt-14 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#4B6BFF' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-white font-bold text-base tracking-tight">REFUGE</span>
          </div>
          {/* Progress */}
          <div className="flex gap-1.5">
            <div className="w-8 h-1 rounded-full" style={{ background: '#4B6BFF' }} />
            <div className="w-8 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.25)' }} />
          </div>
        </div>

        <div className="flex-1" />

        {/* Contenu bas */}
        <div className="px-6 md:px-16 pb-12 md:pb-16">
          <p className="text-white/45 text-xs uppercase tracking-[2px] mb-3">Étape 1 sur 2</p>
          <h2 className="text-white font-bold leading-[1.1] tracking-tight mb-2" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3.2rem)' }}>
            Quel est votre objectif ?
          </h2>
          <p className="text-white/55 text-sm md:text-base mb-8">Choisissez ce que vous souhaitez faire.</p>

          {/* Choix — style glassmorphism */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:max-w-2xl mb-8">
            {([
              {
                value: 'louer' as const,
                label: 'Je veux louer',
                desc: 'Trouver un logement à louer',
                icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
              },
              {
                value: 'acheter' as const,
                label: 'Je veux acheter',
                desc: 'Acquérir un bien immobilier',
                icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
              },
            ] as const).map(r => (
              <button
                key={r.value}
                onClick={() => setSelected(r.value)}
                className="flex items-center gap-4 px-6 py-5 rounded-2xl text-left transition-all"
                style={{
                  background: selected === r.value ? 'rgba(75,107,255,0.25)' : 'rgba(255,255,255,0.08)',
                  border: selected === r.value ? '1.5px solid #4B6BFF' : '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              >
                <span style={{ color: selected === r.value ? '#4B6BFF' : 'rgba(255,255,255,0.55)' }}>{r.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-white">{r.label}</p>
                  <p className="text-white/50 text-sm mt-0.5">{r.desc}</p>
                </div>
                {selected === r.value && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#4B6BFF' }}>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-full md:w-auto md:px-12 h-14 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)', boxShadow: '0 4px 20px rgba(75,107,255,0.4)' }}
          >
            Suivant
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
