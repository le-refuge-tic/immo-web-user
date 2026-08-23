import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { paiementApi } from '../../api/paiementApi'
import type { MethodePaiement } from '../../api/paiementApi'

type WalletType = 'cotisation' | 'epargne'

const OPS: { id: string; label: string; tagline: string; color: string; methode: MethodePaiement; needsPhone: boolean }[] = [
  { id: 'mtn',     label: 'MTN MoMo',   tagline: 'Mobile Money direct',      color: '#FFB300', methode: 'momo',    needsPhone: true },
  { id: 'moov',    label: 'Moov Flooz', tagline: 'Flooz direct',             color: '#1565C0', methode: 'flooz',   needsPhone: true },
  { id: 'fedapay', label: 'FedaPay',    tagline: 'MTN · Moov · Celtiis · …', color: '#00897B', methode: 'fedapay', needsPhone: false },
]

const LABELS: Record<WalletType, string> = { cotisation: 'cotisation', epargne: 'épargne' }
const COLORS: Record<WalletType, string> = { cotisation: '#4B6BFF', epargne: '#7B4BFF' }

export default function RechargementWalletPage() {
  const navigate = useNavigate()
  const { walletType } = useParams<{ walletType: WalletType }>()
  const type: WalletType = walletType === 'epargne' ? 'epargne' : 'cotisation'
  const accent = COLORS[type]

  const [opId, setOpId] = useState('mtn')
  const [montant, setMontant] = useState('')
  const [tel, setTel] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'waiting' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [payUrl, setPayUrl] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const op = OPS.find(o => o.id === opId)!

  const startPolling = (refId: string) => {
    let attempts = 0
    pollRef.current = setInterval(async () => {
      attempts++
      try {
        const s = await paiementApi.statutRechargement(refId)
        if (s.statut === 'reussi' || s.statut === 'confirme') {
          clearInterval(pollRef.current!); setState('success')
        } else if (s.statut === 'echoue') {
          clearInterval(pollRef.current!); setState('error'); setError('Paiement refusé par l\'opérateur.')
        }
      } catch (_) {}
      if (attempts >= 40) { clearInterval(pollRef.current!); setState('error'); setError('Délai dépassé. Vérifiez votre solde dans quelques instants.') }
    }, 3000)
  }

  const recharger = async () => {
    const m = Number(montant.replace(/\D/g, ''))
    if (!m || m < 100) { setState('error'); setError('Montant minimum : 100 FCFA'); return }
    if (op.needsPhone) {
      const raw = tel.replace(/\D/g, '')
      const ok = raw.length === 8 || (raw.length === 10 && raw.startsWith('01')) || raw.length === 11
      if (!ok) { setState('error'); setError('Format : 0196XXXXXX (10 ch.) ou 96XXXXXX (8 ch.)'); return }
    }
    setState('loading'); setError('')
    try {
      const res: any = await paiementApi.initierRechargementWallet({
        wallet_type: type, montant: m, methode_paiement: op.methode,
        ...(op.needsPhone ? { telephone: tel.replace(/\D/g, '') } : {}),
      })
      if (res.statut === 'confirme') { setState('success'); return }
      const refId = res.reference || res.referenceId || res.reference_id
      if (res.url_paiement) {
        setPayUrl(res.url_paiement)
        window.open(res.url_paiement, '_blank', 'noopener')
        setState('waiting')
        if (refId) startPolling(refId)
        return
      }
      if (!refId) { setState('error'); setError('Référence manquante'); return }
      setState('waiting')
      startPolling(refId)
    } catch (e: any) {
      setState('error'); setError(e?.response?.data?.message || 'Erreur lors de la recharge.')
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-shrink-0 px-5 pt-14 md:pt-6 pb-5 flex items-center gap-4" style={{ background: accent }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <p className="text-white font-bold text-lg">Recharger — {LABELS[type]}</p>
      </div>

      <div className="flex-1 px-6 py-8 max-w-md mx-auto w-full">
        {state === 'waiting' ? (
          <div className="flex flex-col items-center text-center pt-10">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-pulse" style={{ background: op.color + '1F' }}>
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke={op.color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p className="font-bold text-text-dark text-lg mb-2">En attente de confirmation…</p>
            <p className="text-text-grey text-sm mb-6">Validez la demande sur votre téléphone {op.label}.</p>
            {payUrl && (
              <button onClick={() => window.open(payUrl, '_blank', 'noopener')} className="text-xs font-bold mb-4" style={{ color: op.color }}>
                Rouvrir la page de paiement
              </button>
            )}
            <button onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setState('idle') }} className="text-sm text-text-grey font-semibold">Annuler</button>
          </div>
        ) : state === 'success' ? (
          <div className="flex flex-col items-center text-center pt-10">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: '#22C55E1A' }}>
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p className="font-bold text-text-dark text-xl mb-2">Wallet {LABELS[type]} rechargé !</p>
            <p className="text-text-grey text-sm mb-8">Votre solde a été mis à jour.</p>
            <button onClick={() => navigate(-1)} className="w-full py-3.5 rounded-xl text-white font-bold text-sm" style={{ background: '#22C55E' }}>
              Retour au portefeuille
            </button>
          </div>
        ) : (
          <>
            <p className="font-bold text-text-dark text-sm mb-3">Moyen de paiement</p>
            <div className="space-y-2.5 mb-6">
              {OPS.map(o => {
                const sel = opId === o.id
                return (
                  <button key={o.id} onClick={() => { setOpId(o.id); setState('idle'); setError('') }}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left transition-all"
                    style={{ background: sel ? o.color + '14' : 'white', border: `1.5px solid ${sel ? o.color : 'rgba(0,0,0,0.08)'}` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: o.color + '20' }}>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={o.color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2 10h20M6 15h2m4 0h2M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm" style={{ color: sel ? o.color : '#1A1A2E' }}>{o.label}</p>
                      <p className="text-xs text-text-grey">{o.tagline}</p>
                    </div>
                    {sel && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: o.color }}>
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <p className="font-bold text-text-dark text-sm mb-2">Montant à recharger</p>
            <input type="text" inputMode="numeric" value={montant} onChange={e => setMontant(e.target.value.replace(/\D/g, ''))}
              placeholder="5 000" className="w-full bg-white border border-divider rounded-xl px-4 py-4 text-lg font-bold outline-none text-text-dark mb-4" />

            {op.needsPhone && (
              <>
                <p className="font-bold text-text-dark text-sm mb-2">Numéro {op.label}</p>
                <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3.5 mb-4 border border-divider">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={op.color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  <input type="tel" value={tel} onChange={e => setTel(e.target.value.replace(/\D/g, ''))}
                    placeholder="96XXXXXX" className="flex-1 min-w-0 bg-transparent text-sm outline-none text-text-dark" />
                </div>
              </>
            )}

            {state === 'error' && error && (
              <div className="px-3.5 py-2.5 rounded-xl text-sm font-semibold mb-4" style={{ background: '#EF444414', color: '#EF4444', border: '1px solid #EF444430' }}>{error}</div>
            )}

            <button onClick={recharger} disabled={state === 'loading'}
              className="w-full py-4 rounded-xl text-white font-bold text-base disabled:opacity-60"
              style={{ background: op.color }}>
              {state === 'loading' ? 'Envoi…' : `Recharger via ${op.label}`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
