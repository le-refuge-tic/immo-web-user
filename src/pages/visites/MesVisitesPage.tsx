import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { visitesApi } from '../../api/visitesApi'
import { paiementApi } from '../../api/paiementApi'

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  en_attente:  { label: 'En attente', color: 'text-warning bg-warning/10' },
  confirmee:   { label: 'Confirmée', color: 'text-success bg-success/10' },
  annulee:     { label: 'Annulée', color: 'text-danger bg-danger/10' },
  effectuee:   { label: 'Effectuée', color: 'text-primary bg-primary-l' },
  payee:       { label: 'Payée', color: 'text-success bg-success/10' },
}

const OPERATORS = [
  { key: 'mtn', label: 'MTN MoMo', color: 'bg-yellow-400' },
  { key: 'moov', label: 'Moov Money', color: 'bg-blue-500' },
  { key: 'celtiis', label: 'Celtiis Cash', color: 'bg-green-500' },
]

export default function MesVisitesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const bienIdParam = searchParams.get('bienId')

  const [visites, setVisites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creneaux, setCreneaux] = useState<any[]>([])
  const [showReserve, setShowReserve] = useState(false)
  const [selectedCreneau, setSelectedCreneau] = useState<any>(null)
  const [showPay, setShowPay] = useState<any>(null)
  const [operator, setOperator] = useState('mtn')
  const [phoneOp, setPhoneOp] = useState('')
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  useEffect(() => {
    loadVisites()
    if (bienIdParam) loadCreneaux(Number(bienIdParam))
  }, [bienIdParam])

  const loadVisites = async () => {
    try {
      const data = await visitesApi.mesVisites()
      setVisites(Array.isArray(data) ? data : data.data || [])
    } catch (_) {}
    setLoading(false)
  }

  const loadCreneaux = async (bienId: number) => {
    try {
      const data = await visitesApi.creneaux(bienId)
      setCreneaux(Array.isArray(data) ? data : data.data || [])
      setShowReserve(true)
    } catch (_) {}
  }

  const handleReserver = async () => {
    if (!selectedCreneau) return
    try {
      await visitesApi.reserver({ creneau_id: selectedCreneau.id })
      setShowReserve(false)
      loadVisites()
    } catch (_) {}
  }

  const handlePayer = async () => {
    if (!showPay || !phoneOp) return
    setPaying(true)
    setPayError('')
    try {
      await paiementApi.payerVisite(showPay.id, {
        operateur: operator,
        telephone: phoneOp,
        montant: showPay.frais_visite || showPay.creneau?.bien?.frais_visite || 0,
      })
      setShowPay(null)
      loadVisites()
    } catch (err: any) {
      setPayError(err?.response?.data?.message || 'Erreur de paiement')
    }
    setPaying(false)
  }

  const handleAnnuler = async (id: number) => {
    if (!confirm('Annuler cette visite ?')) return
    try {
      await visitesApi.annuler(id)
      loadVisites()
    } catch (_) {}
  }

  return (
    <div className="min-h-full bg-app-bg">
      <div className="bg-white px-4 pt-12 pb-4 flex items-center gap-3 border-b border-divider">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-g">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text-dark">Mes visites</h1>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(n => <div key={n} className="bg-white rounded-2xl h-28 animate-pulse" />)}
          </div>
        ) : visites.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-text-dark font-semibold mb-1">Aucune visite</p>
            <p className="text-text-grey text-sm">Trouvez un bien et réservez votre première visite</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visites.map(v => {
              const bien = v.creneau?.bien || v.bien
              const st = STATUT_LABELS[v.statut] || { label: v.statut, color: 'text-text-grey bg-surface-g' }
              return (
                <div key={v.id} className="bg-white rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-text-dark text-sm">
                        {bien?.type === 'maison' ? 'Maison' : bien?.type || 'Bien'}
                      </p>
                      <p className="text-xs text-text-grey mt-0.5">
                        {bien?.localisation?.quartier ? `${bien.localisation.quartier}, ` : ''}
                        {bien?.localisation?.ville || '—'}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.color}`}>
                      {st.label}
                    </span>
                  </div>

                  {v.creneau && (
                    <div className="flex items-center gap-1.5 text-xs text-text-grey mb-3">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(v.creneau.debut).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })}
                      {' · '}
                      {new Date(v.creneau.debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {v.statut === 'confirmee' && bien?.frais_visite > 0 && (
                      <button onClick={() => setShowPay(v)}
                        className="flex-1 bg-secondary text-white py-2 rounded-xl text-xs font-bold">
                        Payer ({Number(bien.frais_visite).toLocaleString('fr-FR')} FCFA)
                      </button>
                    )}
                    {v.statut === 'confirmee' && (
                      <button onClick={() => navigate(`/conversations?visiteId=${v.id}`)}
                        className="flex-1 bg-primary-l text-primary py-2 rounded-xl text-xs font-bold">
                        💬 Message
                      </button>
                    )}
                    {(v.statut === 'en_attente' || v.statut === 'confirmee') && (
                      <button onClick={() => handleAnnuler(v.id)}
                        className="px-3 py-2 border border-danger text-danger rounded-xl text-xs font-bold">
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal: choix créneau */}
      {showReserve && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowReserve(false)}>
          <div className="bg-white rounded-t-3xl p-6 w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-divider rounded-full mx-auto mb-5" />
            <h3 className="font-bold text-text-dark mb-4">Choisir un créneau</h3>
            {creneaux.length === 0 ? (
              <p className="text-text-grey text-sm text-center py-4">Aucun créneau disponible</p>
            ) : (
              <div className="space-y-2 mb-4">
                {creneaux.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCreneau(c)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      selectedCreneau?.id === c.id ? 'border-primary bg-primary-l' : 'border-divider'
                    }`}
                  >
                    <p className="text-sm font-semibold text-text-dark">
                      {new Date(c.debut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-xs text-text-grey">
                      {new Date(c.debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} –
                      {new Date(c.fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                ))}
              </div>
            )}
            <button onClick={handleReserver} disabled={!selectedCreneau}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-btn disabled:opacity-40">
              Réserver ce créneau
            </button>
          </div>
        </div>
      )}

      {/* Modal: paiement */}
      {showPay && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowPay(null)}>
          <div className="bg-white rounded-t-3xl p-6 w-full" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-divider rounded-full mx-auto mb-5" />
            <h3 className="font-bold text-text-dark mb-4">Payer la visite</h3>
            {payError && <p className="text-danger text-sm mb-3">{payError}</p>}
            <div className="flex gap-2 mb-4">
              {OPERATORS.map(op => (
                <button key={op.key} onClick={() => setOperator(op.key)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                    operator === op.key ? 'border-primary text-primary' : 'border-divider text-text-grey'
                  }`}>
                  {op.label}
                </button>
              ))}
            </div>
            <input type="tel" value={phoneOp} onChange={e => setPhoneOp(e.target.value)}
              placeholder="Numéro Mobile Money"
              className="w-full bg-surface-g rounded-xl px-4 py-3 text-sm outline-none mb-4" />
            <button onClick={handlePayer} disabled={!phoneOp || paying}
              className="w-full bg-secondary text-white py-4 rounded-xl font-bold shadow-btn-o disabled:opacity-40">
              {paying ? 'Traitement…' : 'Confirmer le paiement'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
