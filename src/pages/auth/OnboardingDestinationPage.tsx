import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const SIDE_IMG = 'https://images.unsplash.com/photo-1600121848594-d8644e57abcd?auto=format&fit=crop&w=1920&q=80'

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

  const handleVilleChange = (v: string) => { setVille(v); setQuartier('') }

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
          <p className="text-white/50 text-sm uppercase tracking-widest mb-3">Étape 2 sur 2</p>
          <h2 className="text-white text-3xl font-bold leading-tight mb-3">
            Où souhaitez-vous<br />{verb} ?
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Sélectionnez votre zone de préférence pour voir les annonces les plus pertinentes.
          </p>
        </div>
      </div>

      {/* ── Colonne droite FORMULAIRE ── */}
      <div className="flex-1 flex flex-col bg-white">

        {/* Mobile header */}
        <div className="md:hidden px-6 pt-14 pb-8" style={{ background: 'linear-gradient(135deg,#0D1B2A,#0F3460)' }}>
          <div className="flex gap-1.5 mb-6">
            <div className="flex-1 h-[4px] rounded-full" style={{ background: '#4B6BFF' }} />
            <div className="flex-1 h-[4px] rounded-full" style={{ background: '#4B6BFF' }} />
          </div>
          <h1 className="text-white text-2xl font-bold">Où souhaitez-vous {verb} ?</h1>
          <p className="text-white/60 text-sm mt-2">Affinez vos résultats par zone</p>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 md:px-16 py-8">
          <div className="w-full md:max-w-md">

            {/* Desktop title */}
            <div className="hidden md:block mb-10">
              <div className="flex gap-1.5 mb-8">
                <div className="flex-1 h-1 rounded-full" style={{ background: '#4B6BFF' }} />
                <div className="flex-1 h-1 rounded-full" style={{ background: '#4B6BFF' }} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Où souhaitez-vous {verb} ?</h2>
              <p className="text-gray-500">Sélectionnez votre zone de préférence.</p>
            </div>

            <div className="space-y-5">
              <SelectField label="Ville" placeholder="Sélectionnez une ville" value={ville} options={VILLES} onChange={handleVilleChange} />
              <SelectField
                label="Quartier"
                placeholder={ville ? 'Sélectionnez un quartier' : "Choisissez d'abord une ville"}
                value={quartier}
                options={ville ? QUARTIERS[ville] || [] : []}
                onChange={setQuartier}
                disabled={!ville}
              />
              {dep && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Département</label>
                  <div className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500">{dep}</div>
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={!ville}
              className="w-full mt-8 py-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}
            >
              Terminer
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            <button onClick={handleSkip} className="w-full mt-3 py-3 text-sm text-gray-400 font-medium hover:text-gray-600 transition-colors">
              Passer cette étape
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SelectField({ label, placeholder, value, options, onChange, disabled }: {
  label: string; placeholder: string; value: string
  options: string[]; onChange: (v: string) => void; disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none px-4 py-3.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
          style={{
            borderColor: value ? '#4B6BFF' : '#E5E7EB',
            borderWidth: value ? 1.5 : 1,
            background: disabled ? '#F9FAFB' : '#fff',
            color: value ? '#1A1A2E' : '#9CA3AF',
          }}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
