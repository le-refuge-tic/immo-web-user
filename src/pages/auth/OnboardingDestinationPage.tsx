import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import sideImg from '../../assets/onboarding-side.jpg'
import logoUrl from '../../assets/REFUGE-ICON.png'
import { QUARTIERS as QUARTIERS_DB, VILLES_AVEC_QUARTIERS } from '../../data/quartiers'

// Mêmes villes/quartiers que le reste de l'app (data/quartiers.ts, utilisé
// par le QuartierPicker de l'accueil) — la liste précédente était une
// courte sélection à la main, très incomplète par rapport à la vraie base.
const VILLES: string[] = [...VILLES_AVEC_QUARTIERS]

const QUARTIERS: Record<string, string[]> = Object.fromEntries(
  VILLES_AVEC_QUARTIERS.map(v => [
    v,
    QUARTIERS_DB.filter(q => q.ville === v).map(q => q.nom).sort((a, b) => a.localeCompare(b, 'fr')),
  ]),
)

const VILLE_DEP: Record<string, string> = {
  'Cotonou':       'Littoral',
  'Abomey-Calavi': 'Atlantique',
}

export default function OnboardingDestinationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const objectif: string = (location.state as any)?.objectif || 'louer'

  const [ville, setVille] = useState('')
  const [quartier, setQuartier] = useState('')

  const dep = VILLE_DEP[ville] || ''

  const handleVilleChange = (v: string) => { setVille(v); setQuartier('') }

  // La réponse de l'étape 1 présélectionne directement le profil proposé à
  // l'inscription (propriétaire ou prospect) — voir RegisterPage.
  const roleSuggere = objectif === 'proprietaire' ? 'proprietaire' : 'prospect'

  const handleNext = () => {
    if (ville) localStorage.setItem('rg_ville', ville)
    if (quartier) localStorage.setItem('rg_quartier', quartier)
    localStorage.setItem('rg_objectif', objectif)
    localStorage.setItem('rg_role_suggere', roleSuggere)
    localStorage.setItem('rg_onboarded', 'true')
    navigate('/', { replace: true })
  }

  const handleSkip = () => {
    localStorage.setItem('rg_objectif', objectif)
    localStorage.setItem('rg_role_suggere', roleSuggere)
    localStorage.setItem('rg_onboarded', 'true')
    navigate('/', { replace: true })
  }

  const isProprietaire = objectif === 'proprietaire'

  return (
    <div className="min-h-dvh relative overflow-hidden flex flex-col">

      {/* Image de fond */}
      <img src={sideImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.25) 100%)' }} />

      <div className="relative z-10 flex flex-col min-h-dvh">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 md:px-16 pt-14 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-[52px] h-[52px] flex items-center justify-center rounded-[15px] flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.94)', boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
              <img src={logoUrl} alt="REFUGE" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ color: '#00AEEF' }}>REFUGE</span>
          </div>
          {/* Progress */}
          <div className="flex gap-1.5">
            <div className="w-8 h-1 rounded-full" style={{ background: '#4B6BFF' }} />
            <div className="w-8 h-1 rounded-full" style={{ background: '#4B6BFF' }} />
          </div>
        </div>

        <div className="flex-1" />

        {/* Contenu bas */}
        <div className="px-6 md:px-16 pb-12 md:pb-16">
          <p className="text-white/45 text-xs uppercase tracking-[2px] mb-3">Étape 2 sur 2</p>
          <h2 className="text-white font-bold leading-[1.1] tracking-tight mb-2" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3.2rem)' }}>
            {isProprietaire ? 'Où se trouve votre bien ?' : 'Où souhaitez-vous louer ?'}
          </h2>
          <p className="text-white/55 text-sm md:text-base mb-8">
            {isProprietaire ? 'Indiquez la zone où se situe votre bien.' : 'Sélectionnez votre zone de préférence.'}
          </p>

          {/* Sélects */}
          <div className="space-y-4 md:max-w-lg mb-8">
            <DarkSelect
              label="Ville"
              placeholder="Sélectionnez une ville"
              value={ville}
              options={VILLES}
              onChange={handleVilleChange}
            />
            <DarkSelect
              label="Quartier"
              placeholder={ville ? 'Sélectionnez un quartier' : "Choisissez d'abord une ville"}
              value={quartier}
              options={ville ? QUARTIERS[ville] || [] : []}
              onChange={setQuartier}
              disabled={!ville}
            />
            {dep && (
              <div>
                <label className="block text-white/60 text-sm font-semibold mb-2">Département</label>
                <div
                  className="w-full px-4 py-3.5 rounded-xl text-sm text-white/50"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {dep}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:max-w-lg">
            <button
              onClick={handleNext}
              disabled={!ville}
              className="flex-1 h-14 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)', boxShadow: '0 4px 20px rgba(75,107,255,0.4)' }}
            >
              Terminer
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button
              onClick={handleSkip}
              className="h-14 md:px-8 rounded-xl text-sm text-white/50 font-medium hover:text-white/80 transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              Passer cette étape
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

type DarkSelectProps = {
  label: string
  placeholder: string
  value: string
  options: string[]
  onChange: (v: string) => void
  disabled?: boolean
}

function DarkSelect({ label, placeholder, value, options, onChange, disabled }: DarkSelectProps) {
  return (
    <div>
      <label className="block text-white/60 text-sm font-semibold mb-2">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none px-4 py-3.5 rounded-xl text-sm outline-none transition-all"
          style={{
            background: value ? 'rgba(75,107,255,0.15)' : 'rgba(255,255,255,0.07)',
            border: value ? '1.5px solid #4B6BFF' : '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: value ? '#fff' : 'rgba(255,255,255,0.4)',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <option value="" disabled style={{ background: '#111', color: '#999' }}>{placeholder}</option>
          {options.map(opt => (
            <option key={opt} value={opt} style={{ background: '#111', color: '#fff' }}>{opt}</option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
