import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SIDE_IMG = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80'

export default function OnboardingProjetPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<'acheter' | 'louer'>('louer')

  const handleNext = () => {
    navigate('/onboarding/destination', { state: { objectif: selected }, replace: true })
  }

  return (
    <div className="min-h-dvh flex">

      {/* ── Colonne gauche IMAGE (desktop) ── */}
      <div className="hidden md:flex w-1/2 relative flex-shrink-0 flex-col justify-end overflow-hidden">
        <img src={SIDE_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 100%)' }} />
        <div className="absolute top-10 left-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#4B6BFF' }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">REFUGE</span>
        </div>
        <div className="relative z-10 p-10">
          <p className="text-white/50 text-sm uppercase tracking-widest mb-3">Étape 1 sur 2</p>
          <h2 className="text-white text-3xl font-bold leading-tight mb-3">
            Votre projet<br />immobilier commence ici.
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Dites-nous si vous cherchez à louer ou à acheter pour personnaliser votre expérience.
          </p>
        </div>
      </div>

      {/* ── Colonne droite FORMULAIRE ── */}
      <div className="flex-1 flex flex-col bg-white">

        {/* Mobile header */}
        <div className="md:hidden px-6 pt-14 pb-8" style={{ background: 'linear-gradient(135deg,#0D1B2A,#0F3460)' }}>
          <div className="flex gap-1.5 mb-6">
            <div className="flex-1 h-[4px] rounded-full" style={{ background: '#4B6BFF' }} />
            <div className="flex-1 h-[4px] rounded-full bg-white/20" />
          </div>
          <h1 className="text-white text-2xl font-bold">Quel est votre objectif ?</h1>
          <p className="text-white/60 text-sm mt-2">Personnalisez votre expérience</p>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 md:px-16 py-8">
          <div className="w-full md:max-w-md">

            {/* Desktop title */}
            <div className="hidden md:block mb-10">
              <div className="flex gap-1.5 mb-8">
                <div className="flex-1 h-1 rounded-full" style={{ background: '#4B6BFF' }} />
                <div className="flex-1 h-1 rounded-full bg-gray-200" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Quel est votre objectif ?</h2>
              <p className="text-gray-500">Choisissez ce que vous souhaitez faire.</p>
            </div>

            <div className="space-y-4">
              {([
                { value: 'louer' as const, label: 'Je veux louer', desc: "Trouver un logement à louer",
                  icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg> },
                { value: 'acheter' as const, label: 'Je veux acheter', desc: "Acquérir un bien immobilier",
                  icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
              ] as const).map(r => (
                <button
                  key={r.value}
                  onClick={() => setSelected(r.value)}
                  className="w-full flex items-center gap-4 px-6 py-5 rounded-2xl border-2 transition-all text-left"
                  style={{
                    borderColor: selected === r.value ? '#4B6BFF' : '#E5E7EB',
                    background:  selected === r.value ? 'rgba(75,107,255,0.05)' : 'white',
                  }}
                >
                  <span style={{ color: selected === r.value ? '#4B6BFF' : '#9CA3AF' }}>{r.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{r.label}</p>
                    <p className="text-gray-500 text-sm mt-0.5">{r.desc}</p>
                  </div>
                  {selected === r.value && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#4B6BFF' }}>
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              className="w-full mt-8 py-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}
            >
              Suivant
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
