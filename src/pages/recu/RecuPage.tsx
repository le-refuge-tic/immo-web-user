import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { paiementApi } from '../../api/paiementApi'

const TYPE_LABELS: Record<string, string> = {
  maison: 'Maison', appart_vide: 'Appartement vide',
  appart_meuble: 'Appartement meublé', guesthouse: 'Guesthouse', terrain: 'Terrain',
}

function fmtDate(raw: string | undefined | null) {
  if (!raw) return '--'
  const d = new Date(raw)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} à ${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString('fr-FR')
}

export default function RecuPage() {
  const { type, refId } = useParams<{ type: string; refId: string }>()
  const navigate = useNavigate()
  const [recu, setRecu] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!refId) return
    setLoading(true)
    setError('')
    const call = type === 'integration' ? paiementApi.recuIntegration(refId) : paiementApi.recuVisite(refId)
    call
      .then(setRecu)
      .catch(e => setError(e?.response?.data?.message || 'Reçu introuvable'))
      .finally(() => setLoading(false))
  }, [type, refId])

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error || !recu) return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-text-dark font-semibold">{error || 'Reçu introuvable'}</p>
      <button onClick={() => navigate(-1)} className="text-primary font-semibold text-sm">Retour</button>
    </div>
  )

  const isIntegration = type === 'integration'
  const bien = isIntegration ? recu.bien : recu.visite?.bien
  const typeLabel = bien ? (TYPE_LABELS[bien.type] || bien.type) : ''

  return (
    <div className="min-h-dvh py-8 px-4 print:py-0" style={{ background: '#F8FAFC' }}>
      <div className="max-w-md mx-auto">

        <div className="flex items-center justify-between mb-4 print:hidden">
          <button onClick={() => navigate(-1)} className="glass-btn w-9 h-9 flex items-center justify-center rounded-xl">
            <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={() => window.print()} className="text-sm font-bold text-primary flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
            </svg>
            Imprimer / PDF
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-btn" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>

          <div className="flex flex-col items-center text-center mb-6 pb-6" style={{ borderBottom: '1px dashed rgba(0,0,0,0.15)' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: '#F0FDF4' }}>
              <svg className="w-7 h-7" fill="none" stroke="#22C55E" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-bold text-text-dark text-lg">Reçu de paiement</p>
            <p className="text-xs text-text-grey mt-1">{isIntegration ? "Frais d'intégration" : 'Frais de visite'}</p>
            <p className="text-[11px] text-text-grey mt-2 font-mono">{recu.reference}</p>
          </div>

          <div className="mb-6">
            <p className="text-3xl font-bold text-text-dark text-center">{fmt(recu.montant)} <span className="text-base font-medium text-text-grey">FCFA</span></p>
            <p className="text-xs text-text-grey text-center mt-1">Payé le {fmtDate(recu.date_paiement)}</p>
          </div>

          <div className="space-y-2.5 text-sm mb-6">
            {bien && (
              <div className="flex justify-between">
                <span className="text-text-grey">Bien</span>
                <span className="font-semibold text-text-dark text-right">{typeLabel}{bien.localisation?.ville ? ` — ${bien.localisation.ville}` : ''}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-text-grey">Méthode</span>
              <span className="font-semibold text-text-dark">{recu.methode_paiement}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-grey">Numéro</span>
              <span className="font-semibold text-text-dark">{recu.telephone_paiement}</span>
            </div>
            {recu.gestionnaire && (
              <div className="flex justify-between">
                <span className="text-text-grey">Gestionnaire</span>
                <span className="font-semibold text-text-dark">{recu.gestionnaire.prenom} {recu.gestionnaire.nom}</span>
              </div>
            )}
          </div>

          {isIntegration && recu.details && (
            <div className="rounded-xl p-4 space-y-2 text-sm" style={{ background: '#F8FAFC' }}>
              <p className="font-bold text-text-dark text-xs uppercase tracking-wide mb-1">Détail</p>
              {recu.details.avance > 0 && (
                <div className="flex justify-between"><span className="text-text-grey">Avance</span><span className="font-semibold text-text-dark">{fmt(recu.details.avance)} F</span></div>
              )}
              {recu.details.prepaye > 0 && (
                <div className="flex justify-between"><span className="text-text-grey">Loyer prépayé</span><span className="font-semibold text-text-dark">{fmt(recu.details.prepaye)} F</span></div>
              )}
              {recu.details.caution_eau > 0 && (
                <div className="flex justify-between"><span className="text-text-grey">Caution eau</span><span className="font-semibold text-text-dark">{fmt(recu.details.caution_eau)} F</span></div>
              )}
              {recu.details.caution_elec > 0 && (
                <div className="flex justify-between"><span className="text-text-grey">Caution électricité</span><span className="font-semibold text-text-dark">{fmt(recu.details.caution_elec)} F</span></div>
              )}
            </div>
          )}

          <p className="text-center text-[11px] text-text-grey mt-6">Généré par REFUGE — conservez ce reçu comme preuve de paiement.</p>
        </div>
      </div>
    </div>
  )
}
