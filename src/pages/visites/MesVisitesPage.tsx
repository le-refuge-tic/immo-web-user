import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { visitesApi } from '../../api/visitesApi'
import { paiementApi } from '../../api/paiementApi'

const STATUT_META: Record<string, { label: string; color: string; bg: string }> = {
  en_attente:      { label: 'En attente',      color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  contre_proposee: { label: 'Contre-proposée', color: '#E67E22', bg: 'rgba(230,126,34,0.12)' },
  confirmee:       { label: 'Confirmée',        color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
  effectuee:       { label: 'Effectuée',        color: '#4B6BFF', bg: 'rgba(75,107,255,0.1)' },
  annulee:         { label: 'Annulée',          color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  payee:           { label: 'Payée',            color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
}

const OPERATORS = [
  { key: 'mtn',     label: 'MTN MoMo'     },
  { key: 'moov',    label: 'Moov Money'   },
  { key: 'celtiis', label: 'Celtiis Cash' },
]

const TYPE_LABELS: Record<string, string> = {
  maison:        'Maison',
  appart_vide:   'Appartement vide',
  appart_meuble: 'Appartement meublé',
  guesthouse:    'Guesthouse',
  terrain:       'Terrain',
}

function fmtDate(raw: string | undefined | null) {
  if (!raw) return '--'
  try {
    const dt = new Date(raw)
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} à ${String(dt.getHours()).padStart(2, '0')}h${String(dt.getMinutes()).padStart(2, '0')}`
  } catch { return raw }
}

const TABS = ['Toutes', 'À venir', 'Terminées']

export default function MesVisitesPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [visites, setVisites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showPay, setShowPay] = useState<any>(null)
  const [operator, setOperator] = useState('mtn')
  const [phoneOp, setPhoneOp] = useState('')
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; body: string; onConfirm: () => void } | null>(null)

  useEffect(() => { loadVisites() }, [])

  const loadVisites = async () => {
    setLoading(true)
    try {
      const data = await visitesApi.mesVisites()
      setVisites(Array.isArray(data) ? data : data.data || [])
    } catch (_) {}
    setLoading(false)
  }

  const filtered = visites.filter(v => {
    if (tab === 0) return true
    if (tab === 1) return ['en_attente', 'contre_proposee', 'confirmee'].includes(v.statut)
    if (tab === 2) return ['effectuee', 'annulee'].includes(v.statut)
    return true
  })

  const handleAnnuler = (v: any) => {
    const body = v.statut === 'confirmee'
      ? "Cette visite est déjà confirmée. L'annuler entraînera une pénalité sur votre compte."
      : 'Voulez-vous vraiment annuler cette demande de visite ?'
    setConfirmDialog({
      title: 'Annuler la visite ?',
      body,
      onConfirm: async () => {
        setConfirmDialog(null)
        try { await visitesApi.annuler(v.id); loadVisites() } catch (_) {}
      },
    })
  }

  const handleAccepterCP = async (id: number) => {
    try {
      await visitesApi.accepterContreProposition(id)
      loadVisites()
    } catch (_) {}
  }

  const handleRefuserCP = (v: any) => {
    setConfirmDialog({
      title: 'Refuser le créneau proposé ?',
      body: 'La visite sera annulée. Vous pouvez faire une nouvelle demande si vous le souhaitez.',
      onConfirm: async () => {
        setConfirmDialog(null)
        try { await visitesApi.annuler(v.id); loadVisites() } catch (_) {}
      },
    })
  }

  const handleIntegration = async (id: number, integre: boolean) => {
    try { await visitesApi.deciderIntegration(id, integre); loadVisites() } catch (_) {}
  }

  const handlePayer = async () => {
    if (!showPay || !phoneOp) return
    setPaying(true)
    setPayError('')
    try {
      await paiementApi.payerVisite(showPay.id, {
        operateur: operator,
        telephone: phoneOp,
        montant: Number(showPay.frais_visite || 0),
      })
      setShowPay(null)
      loadVisites()
    } catch (err: any) {
      setPayError(err?.response?.data?.message || 'Erreur de paiement')
    }
    setPaying(false)
  }

  return (
    <div className="min-h-dvh bg-app-bg">

      {/* ── Header (mobile sticky + desktop glass bar) ── */}
      <div style={{ background: 'rgba(245,245,247,0.88)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-3 pt-12 md:pt-5 pb-3">
            <button onClick={() => navigate(-1)}
              className="glass-btn w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0">
              <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-text-dark">Mes visites</h1>
              {!loading && <p className="text-xs text-text-grey">{visites.length} visite{visites.length > 1 ? 's' : ''} au total</p>}
            </div>
          </div>
          {/* Tabs */}
          <div className="flex md:gap-2">
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)}
                className="flex-1 md:flex-none md:px-6 pb-3 text-[13px] font-semibold transition-all relative"
                style={{ color: tab === i ? '#4B6BFF' : '#9CA3AF' }}>
                {t}
                {tab === i && <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full" style={{ background: '#4B6BFF' }} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(n => <div key={n} className="skeleton rounded-2xl h-28" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-[20px] flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(75,107,255,0.1)' }}>
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="#4B6BFF" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-bold text-text-dark mb-1">Aucune visite</p>
            <p className="text-text-grey text-sm">Vos demandes de visite apparaîtront ici</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-24 md:pb-8">
            {filtered.map(v => <VisiteCard key={v.id} visite={v} onAnnuler={handleAnnuler} onAccepterCP={handleAccepterCP} onRefuserCP={handleRefuserCP} onIntegration={handleIntegration} onPay={setShowPay} onMessage={(id) => navigate(`/conversations?visiteId=${id}`)} />)}
          </div>
        )}
      </div>

      {/* Payment modal */}
      {showPay && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowPay(null)}>
          <div className="glass-strong rounded-t-3xl p-6 w-full" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-divider rounded-full mx-auto mb-5" />
            <h3 className="font-bold text-text-dark mb-1">Payer la visite</h3>
            <p className="text-sm text-text-grey mb-4">
              Montant : <span className="font-bold text-text-dark">{Number(showPay.frais_visite || 0).toLocaleString('fr-FR')} FCFA</span>
            </p>
            {payError && <p className="text-danger text-sm mb-3">{payError}</p>}
            <div className="flex gap-2 mb-4">
              {OPERATORS.map(op => (
                <button
                  key={op.key}
                  onClick={() => setOperator(op.key)}
                  className="flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all"
                  style={{
                    borderColor: operator === op.key ? '#4B6BFF' : '#E5E7EB',
                    color: operator === op.key ? '#4B6BFF' : '#9CA3AF',
                    background: operator === op.key ? 'rgba(75,107,255,0.06)' : 'transparent',
                  }}
                >
                  {op.label}
                </button>
              ))}
            </div>
            <input
              type="tel"
              value={phoneOp}
              onChange={e => setPhoneOp(e.target.value)}
              placeholder="Numéro Mobile Money"
              className="glass-input w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-primary mb-4"
            />
            <button
              onClick={handlePayer}
              disabled={!phoneOp || paying}
              className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: '#FF6B35' }}
            >
              {paying ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Confirmer le paiement'}
            </button>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-5" onClick={() => setConfirmDialog(null)}>
          <div className="glass-strong rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-text-dark text-base mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-text-grey leading-relaxed mb-5">{confirmDialog.body}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDialog(null)} className="flex-1 py-3 rounded-xl border border-divider text-sm font-semibold text-text-dark">
                Garder
              </button>
              <button onClick={confirmDialog.onConfirm} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#EF4444' }}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type VisiteCardProps = {
  visite: any
  onAnnuler: (v: any) => void
  onAccepterCP: (id: number) => void
  onRefuserCP: (v: any) => void
  onIntegration: (id: number, integre: boolean) => void
  onPay: (v: any) => void
  onMessage: (id: number) => void
}

function VisiteCard({ visite: v, onAnnuler, onAccepterCP, onRefuserCP, onIntegration, onPay, onMessage }: VisiteCardProps) {
  const meta = STATUT_META[v.statut] || { label: v.statut, color: '#9CA3AF', bg: '#F4F6FA' }
  const bien = v.bien
  const typeStr = TYPE_LABELS[bien?.type] || bien?.type || 'Bien'
  const isCP = v.statut === 'contre_proposee'
  const frais = Number(v.frais_visite || 0)

  return (
    <div
      className="glass-card rounded-2xl p-4"
      style={{ border: isCP ? `1.5px solid rgba(230,126,34,0.4)` : undefined }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(75,107,255,0.1)' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#4B6BFF" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <polyline strokeLinecap="round" strokeLinejoin="round" points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text-dark text-sm truncate">{typeStr}</p>
            <p className="text-xs text-text-grey mt-0.5 truncate">
              {bien?.localisation?.quartier ? `${bien.localisation.quartier}, ` : ''}
              {bien?.localisation?.ville || '--'}
            </p>
          </div>
        </div>
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ color: meta.color, background: meta.bg }}
        >
          {meta.label}
        </span>
      </div>

      {/* Date */}
      <div className="flex items-center gap-1.5 text-xs text-text-grey mb-2">
        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>
          {v.statut === 'contre_proposee' && v.date_contre_proposee
            ? <>Proposé : <span className="line-through opacity-50">{fmtDate(v.date_souhaitee)}</span></>
            : `Souhaitée : ${fmtDate(v.date_souhaitee)}`}
        </span>
      </div>

      {/* Contre-proposition banner */}
      {isCP && v.date_contre_proposee && (
        <div
          className="flex items-start gap-2 p-3 rounded-xl mb-3"
          style={{ background: 'rgba(230,126,34,0.08)', border: '1px solid rgba(230,126,34,0.2)' }}
        >
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-xs font-bold" style={{ color: '#E67E22' }}>Nouveau créneau proposé</p>
            <p className="text-xs text-text-grey mt-0.5">{fmtDate(v.date_contre_proposee)}</p>
          </div>
        </div>
      )}

      {/* Integration decision */}
      {v.statut === 'effectuee' && v.integre === null && v.integre === undefined && (
        <div className="bg-primary/5 rounded-xl p-3 mb-3">
          <p className="text-xs font-bold text-text-dark mb-2">Souhaitez-vous intégrer ce logement ?</p>
          <div className="flex gap-2">
            <button
              onClick={() => onIntegration(v.id, true)}
              className="flex-1 py-2 rounded-lg text-xs font-bold"
              style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}
            >
              Oui, j'intègre
            </button>
            <button
              onClick={() => onIntegration(v.id, false)}
              className="flex-1 py-2 rounded-lg text-xs font-bold"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
            >
              Non, je passe
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {/* Contre-proposition: accept / refuse */}
        {isCP && (
          <>
            <button
              onClick={() => onAccepterCP(v.id)}
              className="flex-1 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}
            >
              Accepter le créneau
            </button>
            <button
              onClick={() => onRefuserCP(v)}
              className="flex-1 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}
            >
              Refuser
            </button>
          </>
        )}

        {/* Confirmée: payer (si frais > 0 et pas encore payé) + message + annuler */}
        {v.statut === 'confirmee' && frais > 0 && !v.paiement_effectue && (
          <button
            onClick={() => onPay(v)}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: '#FF6B35' }}
          >
            Payer ({frais.toLocaleString('fr-FR')} FCFA)
          </button>
        )}

        {v.statut === 'confirmee' && (
          <button
            onClick={() => onMessage(v.id)}
            className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            style={{ background: 'rgba(75,107,255,0.1)', color: '#4B6BFF' }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Message
          </button>
        )}

        {(v.statut === 'en_attente' || v.statut === 'confirmee') && (
          <button
            onClick={() => onAnnuler(v)}
            className="px-3 py-2 rounded-xl text-xs font-bold"
            style={{ border: '1.5px solid rgba(239,68,68,0.4)', color: '#EF4444' }}
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  )
}

