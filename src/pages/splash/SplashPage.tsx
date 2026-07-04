import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import bgImg from '../../assets/hero-interior.jpg'

export default function SplashPage() {
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuth()

  useEffect(() => {
    if (isLoggedIn) {
      if (user?.role === 'proprietaire') navigate('/proprietaire', { replace: true })
      else if (user?.role === 'demarcheur') navigate('/demarcheur', { replace: true })
      else navigate('/', { replace: true })
    } else if (localStorage.getItem('rg_onboarded') === 'true') {
      navigate('/', { replace: true })
    }
  }, [isLoggedIn, user, navigate])

  const skip = () => {
    localStorage.setItem('rg_onboarded', 'true')
    navigate('/', { replace: true })
  }

  const start = () => {
    navigate('/onboarding', { replace: true })
  }

  return (
    <div className="min-h-dvh relative overflow-hidden flex flex-col">
      <img src={bgImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.2) 100%)' }} />

      <div className="relative z-10 flex flex-col flex-1 min-h-dvh">

        {/* Top bar : logo gauche + passer droite */}
        <div className="flex items-center justify-between px-7 md:px-16 pt-14">
          <div className="flex items-center gap-3 anim-slide-down">
            <div className="w-11 h-11 rounded-[13px] flex items-center justify-center anim-bounce-in" style={{ background: '#4B6BFF', boxShadow: '0 0 24px rgba(75,107,255,0.5)' }}>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">REFUGE</span>
          </div>
          <button
            onClick={skip}
            className="flex items-center gap-1 px-4 py-2 rounded-full text-white text-[13px] font-medium anim-fade-in d-300 btn-press"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            Passer
            <svg className="w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex-1" />

        {/* Contenu bas, aligné à gauche */}
        <div className="px-7 md:px-16 pb-14">
          <p className="text-white/45 text-xs uppercase tracking-[2px] mb-4 anim-fade-up d-100">L'immobilier au Bénin</p>
          <div className="flex items-center gap-2 mb-5 anim-fade-up d-150">
            <div className="w-8 h-[3px] rounded-full" style={{ background: '#FF6B35' }} />
            <div className="w-2 h-[3px] rounded-full" style={{ background: 'rgba(255,107,53,0.45)' }} />
          </div>
          <h1 className="text-white font-bold leading-[1.1] tracking-tight mb-3 anim-blur-up d-200" style={{ fontSize: 'clamp(2.2rem, 4.5vw, 4.5rem)' }}>
            Trouvez votre<br />logement idéal
          </h1>
          <p className="text-white/55 leading-relaxed mb-8 anim-fade-up d-400" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.1rem)' }}>
            Des centaines de logements vérifiés à Cotonou et Abomey-Calavi.
          </p>

          <div className="space-y-4 md:max-w-xs">
            <button
              onClick={start}
              className="w-full h-14 rounded-[18px] flex items-center justify-center gap-3 font-bold text-white text-base hover:opacity-90 transition-opacity anim-scale-in d-500 btn-press"
              style={{ background: '#4B6BFF', boxShadow: '0 4px 20px rgba(75,107,255,0.4)' }}
            >
              <span>Commencer</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            <div className="flex items-center gap-5 anim-fade-in d-700">
              <TrustBadge icon="verified" label="Vérifié" color="#22C55E" />
              <TrustBadge icon="lock" label="Sécurisé" color="#4B6BFF" />
              <TrustBadge icon="star" label="Fiable" color="#FF6B35" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type TrustBadgeProps = { icon: string; label: string; color: string }

function TrustBadge({ icon, label, color }: TrustBadgeProps) {
  const icons: Record<string, React.ReactElement> = {
    verified: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    lock: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    star: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  }
  return (
    <div className="flex items-center gap-1.5">
      {icons[icon]}
      <span className="text-white/60 text-xs font-medium">{label}</span>
    </div>
  )
}
