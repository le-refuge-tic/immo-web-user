import { useNavigate } from 'react-router-dom'

const SLIDES = [
  {
    emoji: '🏠',
    title: 'Trouvez votre bien idéal',
    desc: 'Maisons, appartements, terrains — des milliers d\'annonces au Bénin',
    bg: 'from-primary to-[#7B4BFF]',
  },
  {
    emoji: '📅',
    title: 'Réservez une visite',
    desc: 'Choisissez un créneau et visitez le bien directement depuis votre téléphone',
    bg: 'from-secondary to-[#FF9B65]',
  },
  {
    emoji: '🔒',
    title: 'Paiement sécurisé',
    desc: 'MTN MoMo, Moov Money ou Celtiis Cash — payez en toute sécurité',
    bg: 'from-[#4CAF50] to-[#66BB6A]',
  },
]

export default function OnboardingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh flex flex-col items-center justify-between p-8 bg-app-bg">
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        {SLIDES.map((s, i) => (
          <div key={i} className={`w-full rounded-3xl bg-gradient-to-br ${s.bg} p-8 text-center text-white`}>
            <div className="text-6xl mb-4">{s.emoji}</div>
            <h2 className="text-xl font-bold mb-2">{s.title}</h2>
            <p className="text-white/80 text-sm">{s.desc}</p>
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
          J'ai déjà un compte
        </button>
      </div>
    </div>
  )
}
