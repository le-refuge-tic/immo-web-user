import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  { key: 'momo',    label: 'MTN MoMo'     },
  { key: 'flooz',   label: 'Moov Flooz'   },
  { key: 'celtiis', label: 'Celtiis Cash' },
  { key: 'fedapay', label: 'FedaPay'      },
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

const FACE_CONFIG: Record<number, { color: string; label: string }> = {
  5: { color: '#26C6DA', label: 'Ravi' },
  4: { color: '#66BB6A', label: 'Satisfait' },
  3: { color: '#FFCA28', label: 'Neutre' },
  2: { color: '#FF9800', label: 'Insatisfait' },
  1: { color: '#FF5252', label: 'Très mécontent' },
}

const ISSUES_TAGS = [
  "L'interlocuteur n'était pas professionnel",
  'Le bien ne correspond pas aux photos',
  'La description était trompeuse',
  "L'état du bien était décevant",
  'Des informations importantes ont été omises',
  'La visite était trop précipitée',
  "Le bien n'est plus disponible comme annoncé",
  'Le prix annoncé ne reflète pas la réalité',
]

function FaceRating({ selected, onSelect }: { selected: number | null; onSelect: (n: number) => void }) {
  return (
    <div className="flex justify-between gap-1">
      {[5, 4, 3, 2, 1].map(n => {
        const cfg = FACE_CONFIG[n]
        const isSel = selected === n
        return (
          <button key={n} onClick={() => onSelect(n)}
            className="flex flex-col items-center gap-1.5 transition-transform"
            style={{ transform: isSel ? 'scale(1.12)' : 'scale(1)', opacity: selected !== null && !isSel ? 0.45 : 1 }}>
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="22" fill={cfg.color} style={isSel ? { filter: `drop-shadow(0 0 6px ${cfg.color}90)` } : undefined} />
              <circle cx="16" cy="19" r="2.6" fill="#00000055" />
              <circle cx="32" cy="19" r="2.6" fill="#00000055" />
              {n === 5 && <path d="M14 27 Q24 38 34 27" stroke="#00000060" strokeWidth="3" fill="none" strokeLinecap="round" />}
              {n === 4 && <path d="M15 27 Q24 34 33 27" stroke="#00000060" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
              {n === 3 && <path d="M16 29 L32 29" stroke="#00000060" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
              {n === 2 && <path d="M15 32 Q24 26 33 32" stroke="#00000060" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
              {n === 1 && <path d="M14 34 Q24 24 34 34" stroke="#00000060" strokeWidth="3" fill="none" strokeLinecap="round" />}
            </svg>
            <span className="text-[9.5px] font-semibold text-center leading-tight" style={{ color: isSel ? cfg.color : '#9CA3AF', maxWidth: 48 }}>
              {cfg.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default function MesVisitesPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [visites, setVisites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showPay, setShowPay] = useState<any>(null)
  const [operator, setOperator] = useState('momo')
  const [phoneOp, setPhoneOp] = useState('')
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const [payState, setPayState] = useState<'idle' | 'waiting' | 'success'>('idle')
  const [payRefId, setPayRefId] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; body: string; onConfirm: () => void } | null>(null)
  const [showFeedback, setShowFeedback] = useState<any>(null)
  const [feedbackNote, setFeedbackNote] = useState<number | null>(null)
  const [feedbackTags, setFeedbackTags] = useState<string[]>([])
  const [feedbackComment, setFeedbackComment] = useState('')
  const [feedbackSaving, setFeedbackSaving] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')
  const [feedbackDone, setFeedbackDone] = useState(false)

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

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
      const res = await paiementApi.initierVisite({
        visite_id: showPay.id,
        phone: phoneOp,
        methode_paiement: operator as any,
      })
      const ref = res.referenceId || res.reference_id
      setPayRefId(ref)
      setPayState('waiting')
      let attempts = 0
      pollRef.current = setInterval(async () => {
        attempts++
        try {
          const status = await paiementApi.statutVisite(ref)
          if (status.statut === 'confirme' || status.statut === 'reussi' || status.statut === 'success') {
            clearInterval(pollRef.current!)
            setPayState('success')
            loadVisites()
          } else if (status.statut === 'echoue' || status.statut === 'failed') {
            clearInterval(pollRef.current!)
            setPayError('Paiement refusé. Vérifiez votre solde Mobile Money.')
            setPayState('idle')
          }
        } catch (_) {}
        if (attempts >= 20) { clearInterval(pollRef.current!); setPayError('Délai de confirmation expiré.'); setPayState('idle') }
      }, 3000)
    } catch (err: any) {
      setPayError(err?.response?.data?.message || 'Erreur de paiement')
      setPayState('idle')
    }
    setPaying(false)
  }

  const closePayModal = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    setShowPay(null)
    setPayState('idle')
    setPhoneOp('')
    setPayError('')
  }

  const openFeedback = (v: any) => {
    setShowFeedback(v)
    setFeedbackNote(null)
    setFeedbackTags([])
    setFeedbackComment('')
    setFeedbackError('')
    setFeedbackDone(false)
  }

  const needsTags = feedbackNote !== null && feedbackNote <= 3
  const canSubmitFeedback = feedbackNote !== null &&
    (feedbackNote > 3 || feedbackTags.length > 0 || feedbackComment.trim().length > 0)

  const toggleFeedbackTag = (tag: string) =>
    setFeedbackTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const handleSubmitFeedback = async () => {
    if (!showFeedback || !canSubmitFeedback) return
    setFeedbackSaving(true)
    setFeedbackError('')
    try {
      await visitesApi.donnerFeedback(showFeedback.id, {
        note: feedbackNote!,
        tags: feedbackTags.length ? feedbackTags : undefined,
        texte: feedbackComment.trim() || undefined,
      })
      setFeedbackDone(true)
      loadVisites()
    } catch (err: any) {
      setFeedbackError(err?.response?.data?.message || "Impossible d'envoyer l'avis")
    }
    setFeedbackSaving(false)
  }

  return (
    <div className="min-h-full">

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
            {filtered.map(v => <VisiteCard key={v.id} visite={v} onAnnuler={handleAnnuler} onAccepterCP={handleAccepterCP} onRefuserCP={handleRefuserCP} onIntegration={handleIntegration} onPay={setShowPay} onMessage={(id) => navigate(`/conversations?visiteId=${id}`)} onFeedback={openFeedback} />)}
          </div>
        )}
      </div>

      {/* Payment modal */}
      {showPay && createPortal(
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end" onClick={payState === 'idle' ? closePayModal : undefined}>
          <div className="glass-strong rounded-t-3xl p-6 w-full" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-divider rounded-full mx-auto mb-5" />

            {payState === 'success' ? (
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#F0FDF4' }}>
                  <svg className="w-8 h-8" fill="none" stroke="#22C55E" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="font-bold text-text-dark mb-1">Paiement confirmé !</p>
                <p className="text-sm text-text-grey mb-5">Les frais de visite ont bien été réglés.</p>
                <button onClick={() => { navigate(`/recu/visite/${payRefId}`) }} className="w-full py-3.5 rounded-xl font-bold text-white mb-2" style={{ background: '#4B6BFF' }}>
                  Voir mon reçu
                </button>
                <button onClick={closePayModal} className="text-sm font-semibold text-text-grey">Fermer</button>
              </div>
            ) : payState === 'waiting' ? (
              <div className="flex flex-col items-center text-center py-6">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-bold text-text-dark mb-1">Confirmation en cours…</p>
                <p className="text-sm text-text-grey">Validez la demande sur votre téléphone {phoneOp}</p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>,
        document.body,
      )}

      {/* Feedback modal */}
      {showFeedback && createPortal(
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end" onClick={() => setShowFeedback(null)}>
          <div className="glass-strong rounded-t-3xl p-6 w-full" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-divider rounded-full mx-auto mb-5" />
            {feedbackDone ? (
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#F0FDF4' }}>
                  <svg className="w-8 h-8" fill="none" stroke="#22C55E" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="font-bold text-text-dark mb-1">Merci pour votre avis !</p>
                <button onClick={() => setShowFeedback(null)} className="mt-3 text-sm font-semibold text-text-grey">Fermer</button>
              </div>
            ) : (
              <div className="max-h-[75vh] overflow-y-auto">
                <h3 className="font-bold text-text-dark mb-1 text-center">Comment s'est passée votre visite ?</h3>
                <p className="text-sm text-text-grey mb-5 text-center">Votre avis aide les futurs visiteurs.</p>
                {feedbackError && <p className="text-danger text-sm mb-3">{feedbackError}</p>}

                <FaceRating selected={feedbackNote} onSelect={n => { setFeedbackNote(n); if (n > 3) setFeedbackTags([]) }} />

                {needsTags && (
                  <div className="mt-5">
                    <p className="text-sm font-bold text-text-dark mb-1">Qu'est-ce qui n'a pas fonctionné ?</p>
                    <p className="text-xs text-text-grey mb-3">Sélectionnez tout ce qui s'applique (au moins un)</p>
                    <div className="flex flex-wrap gap-2">
                      {ISSUES_TAGS.map(tag => {
                        const sel = feedbackTags.includes(tag)
                        return (
                          <button key={tag} onClick={() => toggleFeedbackTag(tag)}
                            className="px-3 py-2 rounded-xl text-xs font-medium border transition-all"
                            style={sel
                              ? { background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.6)', color: '#EF4444', fontWeight: 600 }
                              : { background: 'transparent', borderColor: 'rgba(0,0,0,0.15)', color: '#6B7280' }}>
                            {tag}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <p className="text-sm font-bold text-text-dark mt-5 mb-2">
                  {needsTags ? 'Vous souhaitez ajouter quelque chose ?' : 'Laissez un commentaire (optionnel)'}
                </p>
                <textarea
                  value={feedbackComment}
                  onChange={e => setFeedbackComment(e.target.value)}
                  placeholder="Partagez votre expérience en détail…"
                  rows={3}
                  maxLength={500}
                  className="glass-input w-full rounded-xl px-4 py-3 text-sm outline-none resize-none mb-4"
                />
                <button
                  onClick={handleSubmitFeedback}
                  disabled={feedbackSaving || !canSubmitFeedback}
                  className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ background: '#4B6BFF' }}
                >
                  {feedbackSaving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Envoyer mon avis'}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}

      {/* Confirm dialog */}
      {confirmDialog && createPortal(
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-5" onClick={() => setConfirmDialog(null)}>
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
        </div>,
        document.body,
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
  onFeedback: (v: any) => void
}

function VisiteCard({ visite: v, onAnnuler, onAccepterCP, onRefuserCP, onIntegration, onPay, onMessage, onFeedback }: VisiteCardProps) {
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

        {v.statut === 'effectuee' && !v.feedback_donne && (
          <button
            onClick={() => onFeedback(v)}
            className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            Donner mon avis
          </button>
        )}
      </div>
    </div>
  )
}

