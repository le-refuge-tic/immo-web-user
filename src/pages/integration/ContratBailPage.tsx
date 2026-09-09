import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { biensApi } from '../../api/biensApi'
import { bienTypeLabel } from '../../utils/bienType'

function fmtFcfa(n: number) {
  if (!n) return '---'
  return `${Math.trunc(n).toLocaleString('fr-FR')} FCFA`
}

export default function ContratBailPage() {
  const { bienId } = useParams<{ bienId: string }>()
  const navigate = useNavigate()
  const [accepted, setAccepted] = useState(false)
  const [bien, setBien] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bienId) return
    biensApi.byId(Number(bienId)).then(setBien).catch(() => {}).finally(() => setLoading(false))
  }, [bienId])

  const bienType = bien ? bienTypeLabel(bien) : '...'
  const bienAdresse = bien
    ? [bien.localisation?.quartier, bien.localisation?.ville].filter(Boolean).join(', ') || `Bien #${bien.id}`
    : '...'
  const loyer = bien ? fmtFcfa(Number(bien.prix)) : '---'
  const gestionnaire = bien?.user ? `${bien.user.prenom || ''} ${bien.user.nom || ''}`.trim() || '---' : '---'

  const ARTICLES = [
    {
      titre: '1. Objet du contrat',
      corps: `Le bailleur loue au preneur, qui accepte, un bien immobilier de type ${bienType} situé à ${bienAdresse}, pour usage exclusivement résidentiel.`,
    },
    {
      titre: '2. Durée',
      corps: 'Le présent contrat est conclu pour une durée indéterminée à compter de la date d\'intégration. Il peut être résilié par l\'une ou l\'autre des parties sous réserve d\'un préavis d\'un (1) mois.',
    },
    {
      titre: '3. Loyer & paiement',
      corps: `Le loyer mensuel est fixé à ${loyer}, payable au plus tard le 10 de chaque mois. Tout retard de paiement supérieur à 10 jours entraîne une mise en demeure. Le paiement s'effectue exclusivement via l'application REFUGE.`,
    },
    {
      titre: '4. Dépôt de garantie',
      corps: 'Un dépôt de garantie (avance) sera versé à la signature. Il sera restitué dans un délai de 30 jours après la remise des clés, déduction faite des sommes dues.',
    },
    {
      titre: '5. Obligations du locataire',
      corps: 'Payer le loyer et charges aux termes convenus. Occuper les lieux en bon père de famille. Ne pas sous-louer sans accord écrit. Signaler toute dégradation dans les plus brefs délais. Restituer les lieux en bon état en fin de bail.',
    },
    {
      titre: '6. Obligations du bailleur',
      corps: 'Délivrer un logement décent et en bon état. Assurer la jouissance paisible des lieux. Effectuer les réparations non locatives. Ne pas s\'immiscer dans la vie privée du locataire.',
    },
    {
      titre: '7. Résiliation',
      corps: 'En cas de non-paiement pendant plus de deux mois consécutifs ou de violation grave, le bailleur pourra procéder à la résiliation de plein droit.',
    },
  ]

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
          {loading ? (
            <div className="flex justify-center py-10"><div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4B6BFF', borderTopColor: 'transparent' }} /></div>
          ) : (
            <>
              {/* Info bien */}
              <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(75,107,255,0.08)', border: '1px solid rgba(75,107,255,0.18)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(75,107,255,0.15)' }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#4B6BFF" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-text-dark text-sm">{bienType}</p>
                  <p className="text-text-grey text-xs mt-0.5">{bienAdresse}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: '#4B6BFF' }}>Loyer : {loyer} / mois</p>
                  {gestionnaire !== '---' && <p className="text-text-grey text-xs mt-0.5">Bailleur / gestionnaire : {gestionnaire}</p>}
                </div>
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
            </>
          )}
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
