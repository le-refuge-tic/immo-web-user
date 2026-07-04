import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const VILLES = ['Cotonou', 'Abomey-Calavi', 'Porto-Novo', 'Parakou', 'Bohicon']

const QUARTIERS: Record<string, string[]> = {
  'Cotonou':       ['Akpakpa', 'Fidjrossè', 'Cadjèhoun', 'Zogbo', 'Gbèdjromèdé', 'Agla', 'Dantokpa'],
  'Abomey-Calavi': ['Godomey', 'Akassato', 'Togba', 'Kpanroun', 'Hêvié'],
  'Porto-Novo':    ['Ouando', 'Agbossomè', 'Houin', 'Avrankou'],
  'Parakou':       ['Banikanni', 'Madina', 'Zongo', 'Kpébié'],
  'Bohicon':       ['Saclo', 'Lissèzoun', 'Avogbanna'],
}

const VILLE_DEP: Record<string, string> = {
  'Cotonou':       'Littoral',
  'Abomey-Calavi': 'Atlantique',
  'Porto-Novo':    'Ouémé',
  'Parakou':       'Borgou',
  'Bohicon':       'Zou',
}

export default function OnboardingDestinationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const objectif: string = (location.state as any)?.objectif || 'louer'

  const [ville, setVille] = useState('')
  const [quartier, setQuartier] = useState('')

  const dep = VILLE_DEP[ville] || ''

  const handleVilleChange = (v: string) => {
    setVille(v)
    setQuartier('')
  }

  const handleNext = () => {
    if (ville) localStorage.setItem('rg_ville', ville)
    if (quartier) localStorage.setItem('rg_quartier', quartier)
    localStorage.setItem('rg_objectif', objectif)
    localStorage.setItem('rg_onboarded', 'true')
    navigate('/', { replace: true })
  }

  const handleSkip = () => {
    localStorage.setItem('rg_objectif', objectif)
    localStorage.setItem('rg_onboarded', 'true')
    navigate('/', { replace: true })
  }

  const verb = objectif === 'acheter' ? 'acheter' : 'louer'

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <div className="flex-1 px-7 md:px-0 pt-16 flex flex-col w-full md:max-w-lg md:mx-auto">
        {/* Progress bar */}
        <div className="flex gap-1.5 mb-12">
          <div className="flex-1 h-[5px] rounded-full" style={{ background: '#4B6BFF' }} />
          <div className="flex-1 h-[5px] rounded-full" style={{ background: '#4B6BFF' }} />
        </div>

        <h1 className="text-[28px] font-bold italic text-text-dark leading-[1.3] mb-3">
          Où souhaitez-vous<br />{verb} ?
        </h1>
        <p className="text-sm text-text-grey leading-relaxed mb-8">
          Sélectionnez votre zone de préférence pour affiner les résultats.
        </p>

        {/* Ville */}
        <div className="space-y-4">
          <SelectField
            label="Ville"
            placeholder="Sélectionnez une ville"
            value={ville}
            options={VILLES}
            onChange={handleVilleChange}
          />
          <SelectField
            label="Quartier"
            placeholder={ville ? 'Sélectionnez un quartier' : 'Choisissez une ville d\'abord'}
            value={quartier}
            options={ville ? QUARTIERS[ville] || [] : []}
            onChange={setQuartier}
            disabled={!ville}
          />
          {dep && (
            <div>
              <label className="text-[13px] font-semibold text-text-dark block mb-2">Département</label>
              <div className="w-full px-4 py-3.5 rounded-[12px] border border-divider bg-surface-g text-sm text-text-grey">
                {dep}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="px-7 md:px-0 pb-12 space-y-3 w-full md:max-w-lg md:mx-auto">
        <button
          onClick={handleNext}
          disabled={!ville}
          className="w-full py-[18px] rounded-[14px] font-bold text-base text-white disabled:opacity-40 transition-opacity"
          style={{ background: '#4B6BFF' }}
        >
          Suivant
        </button>
        <button
          onClick={handleSkip}
          className="w-full py-3 text-sm text-text-grey font-medium"
        >
          Passer cette étape
        </button>
      </div>
    </div>
  )
}

function SelectField({
  label, placeholder, value, options, onChange, disabled
}: {
  label: string
  placeholder: string
  value: string
  options: string[]
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <div>
      <label className="text-[13px] font-semibold text-text-dark block mb-2">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none px-4 py-3.5 rounded-[12px] border text-sm outline-none transition-colors"
          style={{
            borderColor: value ? '#4B6BFF' : '#E5E7EB',
            background: disabled ? '#F9FAFB' : '#fff',
            color: value ? '#1A1A2E' : '#9CA3AF',
            borderWidth: value ? 1.5 : 1,
          }}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
