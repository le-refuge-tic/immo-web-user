import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OnboardingProjetPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<'acheter' | 'louer'>('louer')

  const handleNext = () => {
    navigate('/onboarding/destination', { state: { objectif: selected }, replace: true })
  }

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <div className="flex-1 px-7 md:px-0 pt-16 flex flex-col w-full md:max-w-lg md:mx-auto">
        {/* Progress bar */}
        <div className="flex gap-1.5 mb-12">
          <div className="flex-1 h-[5px] rounded-full" style={{ background: '#4B6BFF' }} />
          <div className="flex-1 h-[5px] rounded-full" style={{ background: '#E5E7EB' }} />
        </div>

        <h1 className="text-[28px] font-bold italic text-text-dark leading-[1.3] mb-3">
          Quelle est votre<br />objectif ?
        </h1>
        <p className="text-sm text-text-grey leading-relaxed mb-12">
          Dites-nous ce que vous recherchez pour personnaliser votre expérience.
        </p>

        {/* Options */}
        <div className="space-y-4">
          <OptionCard
            label="Louer"
            value="louer"
            selected={selected}
            onSelect={setSelected}
            icon={
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            }
          />
          <OptionCard
            label="Acheter"
            value="acheter"
            selected={selected}
            onSelect={setSelected}
            icon={
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Bottom button */}
      <div className="px-7 md:px-0 pb-12 w-full md:max-w-lg md:mx-auto">
        <button
          onClick={handleNext}
          className="w-full py-[18px] rounded-[14px] bg-primary text-white font-bold text-base"
        >
          Suivant
        </button>
      </div>
    </div>
  )
}

function OptionCard({
  label, value, selected, onSelect, icon
}: {
  label: string
  value: 'acheter' | 'louer'
  selected: string
  onSelect: (v: 'acheter' | 'louer') => void
  icon: React.ReactElement
}) {
  const isSelected = selected === value
  return (
    <button
      onClick={() => onSelect(value)}
      className="w-full flex items-center gap-4 px-6 py-5 rounded-[14px] text-left transition-all duration-200"
      style={{
        background: isSelected ? '#4B6BFF' : '#fff',
        border: `1.5px solid ${isSelected ? '#4B6BFF' : '#E5E7EB'}`,
        boxShadow: isSelected ? '0 4px 12px rgba(75,107,255,0.25)' : 'none',
      }}
    >
      <span style={{ color: isSelected ? 'white' : '#9CA3AF' }}>{icon}</span>
      <span
        className="flex-1 text-base font-semibold"
        style={{ color: isSelected ? 'white' : '#6B7280' }}
      >
        {label}
      </span>
      {isSelected && (
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
    </button>
  )
}
