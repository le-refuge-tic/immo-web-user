import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { loyersApi } from '../../api/loyersApi'
import { usePageTitle } from '../../utils/usePageTitle'

const GREEN = '#15803D'

const AVANTAGES = [
  { icon: '🔔', title: 'Rappels automatiques', desc: 'Alerte 3 jours avant l\'échéance de votre loyer' },
  { icon: '💳', title: 'Paiement sécurisé MoMo', desc: 'Payez directement via MTN Mobile Money' },
  { icon: '📊', title: 'Historique traçable', desc: 'Tous vos paiements archivés et accessibles' },
  { icon: '🎧', title: 'Support dédié', desc: 'Une équipe disponible 6j/7 pour vous aider' },
  { icon: '📄', title: 'Reçus PDF instantanés', desc: 'Téléchargez vos justificatifs à tout moment' },
]

export default function GestionViaAppPage() {
  usePageTitle('Gestion via l\'application')
  const { contratId } = useParams<{ contratId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const activer = async () => {
    setLoading(true)
    try {
      if (contratId) await loyersApi.activerGestionApp(Number(contratId))
    } catch (_) {}
    navigate('/locataire', { replace: true })
  }

  const refuser = () => navigate('/locataire', { replace: true })

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F0FDF4, #ECFDF5)' }}>
      {/* Header décoratif */}
      <div className="flex-shrink-0 px-5 pt-16 pb-10 text-center" style={{ background: `linear-gradient(160deg, #064E3B, ${GREEN})` }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
        </div>
        <h1 className="text-white font-bold text-2xl mb-2">Gérez vos loyers via REFUGE</h1>
        <p className="text-white/70 text-sm leading-relaxed max-w-xs mx-auto">Simplifiez le suivi et le paiement de vos loyers directement depuis l'application</p>
      </div>

      {/* Avantages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-5 py-8 space-y-3 pb-36">
          {AVANTAGES.map((a, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(34,197,94,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: GREEN + '15' }}>
                {a.icon}
              </div>
              <div>
                <p className="font-bold text-text-dark text-sm">{a.title}</p>
                <p className="text-xs text-text-grey mt-0.5 leading-relaxed">{a.desc}</p>
              </div>
              <div className="ml-auto flex-shrink-0">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: GREEN }}>
                  <svg className="w-3 h-3 text-white" fill="none" stroke="white" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex-shrink-0 px-5 py-5 border-t" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderColor: 'rgba(0,0,0,0.07)' }}>
        <div className="max-w-md mx-auto space-y-3">
          <button onClick={activer} disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white text-sm disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, #064E3B, ${GREEN})`, boxShadow: '0 4px 14px rgba(34,197,94,0.4)' }}>
            {loading ? 'Activation…' : 'Oui, gérer via REFUGE'}
          </button>
          <button onClick={refuser}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-text-grey border border-divider">
            Non, plus tard
          </button>
        </div>
      </div>
    </div>
  )
}
