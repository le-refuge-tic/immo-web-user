import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const ARTICLES = [
  {
    titre: '1. Objet du contrat',
    corps: 'Le présent contrat a pour objet la location du bien immobilier décrit ci-dessus. Le bailleur s\'engage à mettre le bien à disposition du locataire en bon état d\'usage.',
  },
  {
    titre: '2. Durée',
    corps: 'Le contrat est conclu pour une durée indéterminée à compter de la date d\'entrée. Chaque partie peut y mettre fin sous réserve d\'un préavis d\'un (1) mois notifié à l\'autre partie.',
  },
  {
    titre: '3. Loyer & paiement',
    corps: 'Le loyer est payable le 10 de chaque mois. Tout retard de paiement supérieur à 15 jours entraîne une pénalité de 5% du montant dû. Le paiement s\'effectue exclusivement via l\'application REFUGE.',
  },
  {
    titre: '4. Dépôt de garantie',
    corps: 'Une avance de loyer (correspondant aux mois convenus) est versée à la signature. Elle couvre les éventuels manquements du locataire et est remboursable dans un délai de 30 jours après la restitution des clés en bon état.',
  },
  {
    titre: '5. Obligations du locataire',
    corps: 'Le locataire s\'engage à : user du bien en bon père de famille, effectuer les réparations locatives mineures, ne pas sous-louer sans accord écrit du bailleur, restituer le bien dans l\'état d\'entrée.',
  },
  {
    titre: '6. Obligations du bailleur',
    corps: 'Le bailleur s\'engage à : délivrer le bien en bon état, assurer la jouissance paisible, prendre en charge les grosses réparations (art. 606 CC), ne pas s\'opposer aux aménagements raisonnables du locataire.',
  },
  {
    titre: '7. Résiliation',
    corps: 'Le contrat peut être résilié de plein droit en cas de non-paiement du loyer pendant deux (2) mois consécutifs, de troubles de voisinage répétés, ou de sous-location non autorisée.',
  },
]

export default function ContratBailPage() {
  const { bienId } = useParams<{ bienId: string }>()
  const navigate = useNavigate()
  const [accepted, setAccepted] = useState(false)

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#F8F9FA' }}>
      {/* Header */}
      <div className="print:hidden flex-shrink-0 px-5 pt-14 md:pt-6 pb-5"
        style={{ background: 'linear-gradient(135deg, #1A1A2E, #0F3460)', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-[11px] flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.12)' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="flex-1">
            <p className="text-white font-bold text-lg">Contrat de bail</p>
            <p className="text-white/60 text-xs mt-0.5">Lisez attentivement avant d'accepter</p>
          </div>
          <button onClick={() => window.print()} className="w-10 h-10 flex items-center justify-center rounded-[11px] flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.12)' }} title="Télécharger / imprimer">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-12 0h12v7H6v-7z"/></svg>
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto print:overflow-visible print:h-auto">
        <div className="max-w-2xl mx-auto px-5 py-6 space-y-4 pb-32 print:pb-6">
          {/* Intro card */}
          <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(75,107,255,0.08)', border: '1px solid rgba(75,107,255,0.2)' }}>
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="#4B6BFF" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p className="text-sm text-text-dark leading-relaxed">Ce contrat établit les conditions de location entre vous et le propriétaire. En acceptant, vous vous engagez légalement à respecter les clauses ci-dessous.</p>
          </div>

          {/* Articles */}
          {ARTICLES.map((a, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <p className="font-bold text-text-dark text-sm mb-2">{a.titre}</p>
              <p className="text-sm text-text-grey leading-relaxed">{a.corps}</p>
            </div>
          ))}

          {/* Acceptation */}
          <button onClick={() => setAccepted(!accepted)}
            className="print:hidden w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all"
            style={{ borderColor: accepted ? '#4B6BFF' : 'rgba(0,0,0,0.10)', background: accepted ? 'rgba(75,107,255,0.06)' : 'rgba(255,255,255,0.85)' }}>
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
              style={{ background: accepted ? '#4B6BFF' : 'transparent', border: accepted ? 'none' : '2px solid #D1D5DB' }}>
              {accepted && <svg className="w-3 h-3 text-white" fill="none" stroke="white" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
            </div>
            <p className="text-sm font-semibold text-text-dark leading-relaxed">
              J'ai lu et j'accepte les conditions du contrat de bail. Je m'engage à respecter toutes les clauses mentionnées ci-dessus.
            </p>
          </button>
        </div>
      </div>

      {/* CTA */}
      <div className="print:hidden flex-shrink-0 px-5 py-4 border-t" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderColor: 'rgba(0,0,0,0.07)' }}>
        <div className="max-w-2xl mx-auto">
          <button onClick={() => accepted && navigate(`/paiement-integration/${bienId}`)}
            disabled={!accepted}
            className="w-full py-4 rounded-xl font-bold text-white text-sm disabled:opacity-40 transition-all"
            style={{ background: accepted ? 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' : '#E5E7EB', boxShadow: accepted ? '0 4px 14px rgba(75,107,255,0.4)' : 'none' }}>
            Continuer vers le paiement
          </button>
          <p className="text-center text-xs text-text-grey mt-2">Vous devez accepter le contrat pour continuer</p>
        </div>
      </div>
    </div>
  )
}
