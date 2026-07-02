import { useNavigate } from 'react-router-dom'

const HomeSlideIcon = () => (
  <svg className="w-16 h-16 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)
const CalendarSlideIcon = () => (
  <svg className="w-16 h-16 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const LockSlideIcon = () => (
  <svg className="w-16 h-16 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const SLIDES = [
  {
    icon: <HomeSlideIcon />,
    title: 'Trouvez votre bien ideal',
    desc: "Maisons, appartements, terrains — des milliers d'annonces au Benin",
    bg: 'linear-gradient(135deg, #4B6BFF 0%, #7B4BFF 100%)',
  },
  {
    icon: <CalendarSlideIcon />,
    title: 'Reservez une visite',
    desc: 'Choisissez un creneau et visitez le bien directement depuis votre telephone',
    bg: 'linear-gradient(135deg, #FF6B35 0%, #FF9B65 100%)',
  },
  {
    icon: <LockSlideIcon />,
    title: 'Paiement securise',
    desc: 'MTN MoMo, Moov Money ou Celtiis Cash — payez en toute securite',
    bg: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
  },
]

export default function OnboardingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh flex flex-col items-center justify-between p-8 bg-app-bg">
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className="w-full rounded-3xl p-8 text-center text-white"
            style={{ background: s.bg }}
          >
            <div className="flex justify-center mb-4">{s.icon}</div>
            <h2 className="text-xl font-bold mb-2">{s.title}</h2>
            <p className="text-white/80 text-sm leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="w-full space-y-3 mt-8">
        <button
          onClick={() => navigate('/register')}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-btn"
        >
          Commencer
        </button>
        <button
          onClick={() => navigate('/login')}
          className="w-full border border-primary text-primary py-4 rounded-xl font-bold"
        >
          J'ai deja un compte
        </button>
      </div>
    </div>
  )
}
