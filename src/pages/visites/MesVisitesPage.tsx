import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { visitesApi } from '../../api/visitesApi'
import { paiementApi } from '../../api/paiementApi'

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente', color: 'text-warning bg-warning/10' },
  confirmee:  { label: 'Confirmee',  color: 'text-success bg-success/10' },
  annulee:    { label: 'Annulee',    color: 'text-danger bg-danger/10' },
  effectuee:  { label: 'Effectuee',  color: 'text-primary bg-primary-l' },
  payee:      { label: 'Payee',      color: 'text-success bg-success/10' },
}

const OPERATORS = [
  { key: 'mtn',     label: 'MTN MoMo'    },
  { key: 'moov',    label: 'Moov Money'  },
  { key: 'celtiis', label: 'Celtiis Cash' },
]

const BackIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)
const CalendarIcon = () => (
  <svg className="w-3.5 h-3.5 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const CalendarEmptyIcon = () => (
  <svg className="w-16 h-16 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const ChatIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const TYPE_LABELS: Record<string, string> = {
  maison:        'Maison',
  appart_vide:   'Appartement vide',
  appart_meuble: 'Appartement meuble',
  guesthouse:    'Guesthouse',
  terrain:       'Terrain',
}

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
    if (!window.confirm('Annuler cette visite ?')) return
    try {
      await visitesApi.annuler(id)
      loadVisites()
    } catch (_) {}
  }

  return (
    <div className="min-h-full bg-app-bg">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 flex items-center gap-3 border-b border-divider">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-g"
        >
          <BackIcon />
        </button>
        <h1 className="text-lg font-bold text-text-dark">Mes visites</h1>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-white rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : visites.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4 opacity-30">
              <CalendarEmptyIcon />
            </div>
            <p className="text-text-dark font-semibold mb-1">Aucune visite</p>
            <p className="text-text-grey text-sm">Trouvez un bien et reservez votre premiere visite</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visites.map(v => {
              const bien = v.creneau?.bien || v.bien
              const st = STATUT_LABELS[v.statut] || { label: v.statut, color: 'text-text-grey bg-surface-g' }
              const typeStr = TYPE_LABELS[bien?.type] || bien?.type || 'Bien'
              return (
                <div key={v.id} className="bg-white rounded-2xl p-4 shadow-card">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-text-dark text-sm">{typeStr}</p>
                      <p className="text-xs text-text-grey mt-0.5">
                        {bien?.localisation?.quartier ? `${bien.localisation.quartier}, ` : ''}
                        {bien?.localisation?.ville || '--'}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.color}`}>
                      {st.label}
                    </span>
                  </div>

                  {v.creneau && (
                    <div className="flex items-center gap-1.5 text-xs text-text-grey mb-3">
                      <CalendarIcon />
                      <span>
                        {new Date(v.creneau.debut).toLocaleDateString('fr-FR', {
                          weekday: 'short', day: 'numeric', month: 'long',
                        })}
                        {' · '}
                        {new Date(v.creneau.debut).toLocaleTimeString('fr-FR', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {v.statut === 'confirmee' && bien?.frais_visite > 0 && (
                      <button
                        onClick={() => setShowPay(v)}
                        className="flex-1 bg-secondary text-white py-2 rounded-xl text-xs font-bold"
                      >
                        Payer ({Number(bien.frais_visite).toLocaleString('fr-FR')} FCFA)
                      </button>
                    )}
                    {v.statut === 'confirmee' && (
                      <button
                        onClick={() => navigate(`/conversations?visiteId=${v.id}`)}
                        className="flex-1 bg-primary-l text-primary py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <ChatIcon />
                        <span>Message</span>
                      </button>
                    )}
                    {(v.statut === 'en_attente' || v.statut === 'confirmee') && (
                      <button
                        onClick={() => handleAnnuler(v.id)}
                        className="px-3 py-2 border border-danger text-danger rounded-xl text-xs font-bold"
                      >
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

      {/* Modal: choix creneau */}
      {showReserve && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowReserve(false)}
        >
          <div
            className="bg-white rounded-t-3xl p-6 w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-divider rounded-full mx-auto mb-5" />
            <h3 className="font-bold text-text-dark mb-4">Choisir un creneau</h3>
            {creneaux.length === 0 ? (
              <p className="text-text-grey text-sm text-center py-4">Aucun creneau disponible</p>
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
                      {new Date(c.debut).toLocaleDateString('fr-FR', {
                        weekday: 'long', day: 'numeric', month: 'long',
                      })}
                    </p>
                    <p className="text-xs text-text-grey">
                      {new Date(c.debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(c.fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={handleReserver}
              disabled={!selectedCreneau}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-btn disabled:opacity-40"
            >
              Reserver ce creneau
            </button>
          </div>
        </div>
      )}

      {/* Modal: paiement */}
      {showPay && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowPay(null)}
        >
          <div className="bg-white rounded-t-3xl p-6 w-full" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-divider rounded-full mx-auto mb-5" />
            <h3 className="font-bold text-text-dark mb-4">Payer la visite</h3>
            {payError && <p className="text-danger text-sm mb-3">{payError}</p>}
            <div className="flex gap-2 mb-4">
              {OPERATORS.map(op => (
                <button
                  key={op.key}
                  onClick={() => setOperator(op.key)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                    operator === op.key ? 'border-primary text-primary bg-primary-l' : 'border-divider text-text-grey'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
            <input
              type="tel"
              value={phoneOp}
              onChange={e => setPhoneOp(e.target.value)}
              placeholder="Numero Mobile Money"
              className="w-full bg-surface-g rounded-xl px-4 py-3 text-sm outline-none focus:border-primary mb-4"
            />
            <button
              onClick={handlePayer}
              disabled={!phoneOp || paying}
              className="w-full bg-secondary text-white py-4 rounded-xl font-bold shadow-btn-o disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {paying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Traitement…</span>
                </>
              ) : 'Confirmer le paiement'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
