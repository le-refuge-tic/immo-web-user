import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { biensApi } from '../../api/biensApi'
import { paiementApi } from '../../api/paiementApi'

const TEAL = '#0EA5E9'

export default function PaiementIntegrationPage() {
  const { bienId } = useParams<{ bienId: string }>()
  const navigate = useNavigate()

  const [bien, setBien]         = useState<any>(null)
  const [tel, setTel]           = useState('')
  const [state, setState]       = useState<'idle'|'waiting'|'success'|'error'>('idle')
  const [errMsg, setErrMsg]     = useState('')
  const [refId, setRefId]       = useState('')
  const pollRef                 = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!bienId) return
    biensApi.byId(Number(bienId))
      .then(d => setBien(d.bien || d))
      .catch(() => {})
  }, [bienId])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const payer = async () => {
    if (!tel || !bienId) return
    setState('waiting')
    try {
      const res = await paiementApi.initierIntegration({ bien_id: Number(bienId), telephone: tel })
      const ref = res.referenceId || res.reference_id
      setRefId(ref)
      let attempts = 0
      pollRef.current = setInterval(async () => {
        attempts++
        try {
          const status = await paiementApi.statutIntegration(ref)
          if (status.statut === 'reussi' || status.statut === 'success') {
            clearInterval(pollRef.current!)
            setState('success')
          } else if (status.statut === 'echoue' || status.statut === 'failed') {
            clearInterval(pollRef.current!)
            setState('error'); setErrMsg('Paiement refusé. Vérifiez votre solde MoMo.')
          }
        } catch (_) {}
        if (attempts >= 20) { clearInterval(pollRef.current!); setState('error'); setErrMsg('Délai de confirmation expiré.') }
      }, 3000)
    } catch (e: any) {
      setState('error'); setErrMsg(e?.response?.data?.message || 'Erreur lors du paiement')
    }
  }

  const prix = Number(bien?.prix || 0)
  const avanceMois = bien?.avance_mois || 1
  const cautionEau = Number(bien?.amenites?.caution_eau || 0)
  const cautionElec = Number(bien?.amenites?.caution_elec || 0)
  const avanceTotal = prix * avanceMois
  const total = avanceTotal + cautionEau + cautionElec

  if (state === 'success') return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center" style={{ background: '#F0FDF4' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: '#22C55E' }}>
        <svg className="w-10 h-10 text-white" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>
      <h2 className="text-2xl font-bold text-text-dark mb-2">Paiement confirmé !</h2>
      <p className="text-text-grey text-sm mb-8">Votre intégration a été validée. Bienvenue dans votre nouveau logement.</p>
      <button onClick={() => navigate('/gestion-via-app')}
        className="w-full max-w-xs py-4 rounded-xl font-bold text-white shadow-btn mb-3"
        style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)' }}>
        Continuer
      </button>
      {refId && (
        <button onClick={() => navigate(`/recu/integration/${refId}`)} className="text-sm font-semibold text-primary mb-2">
          Voir mon reçu
        </button>
      )}
      <button onClick={() => navigate('/locataire')} className="text-sm font-semibold text-text-grey">Aller à mon logement</button>
    </div>
  )

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#F8FAFC' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-14 md:pt-6 pb-5"
        style={{ background: `linear-gradient(135deg, #0F3460, ${TEAL})`, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-[11px]"
            style={{ background: 'rgba(255,255,255,0.12)' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <p className="text-white font-bold text-lg">Paiement d'intégration</p>
            <p className="text-white/60 text-xs mt-0.5">Payez pour finaliser votre intégration</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 py-6 pb-32 space-y-4">

          {/* Récap bien */}
          {bien && (
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.07)' }}>
              <p className="font-bold text-text-dark text-sm mb-1">{['maison','appart_vide','appart_meuble','guesthouse','terrain'].includes(bien.type) ? ({maison:'Maison',appart_vide:'Appartement vide',appart_meuble:'Appartement meublé',guesthouse:'Guesthouse',terrain:'Terrain'})[bien.type as string] : bien.type}</p>
              <p className="text-xs text-text-grey">{bien.localisation?.quartier ? `${bien.localisation.quartier}, ` : ''}{bien.localisation?.ville}</p>
            </div>
          )}

          {/* Détail paiement */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.07)' }}>
            <p className="font-bold text-text-dark mb-4">Détail du paiement</p>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-grey">Avance ({avanceMois} mois × {prix.toLocaleString('fr-FR')} F)</span>
                <span className="font-semibold text-text-dark">{avanceTotal.toLocaleString('fr-FR')} FCFA</span>
              </div>
              {cautionEau > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-grey">Caution eau</span>
                  <span className="font-semibold text-text-dark">{cautionEau.toLocaleString('fr-FR')} FCFA</span>
                </div>
              )}
              {cautionElec > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-grey">Caution électricité</span>
                  <span className="font-semibold text-text-dark">{cautionElec.toLocaleString('fr-FR')} FCFA</span>
                </div>
              )}
              <div className="border-t border-divider pt-3 flex justify-between">
                <span className="font-bold text-text-dark">Total à payer</span>
                <span className="font-bold text-text-dark text-lg">{total.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>
          </div>

          {/* MTN MoMo input */}
          {state === 'idle' || state === 'error' ? (
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="flex items-center gap-3 mb-4">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/MTN_Logo.svg/200px-MTN_Logo.svg.png" alt="MTN MoMo" className="h-8 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <p className="font-bold text-text-dark">MTN Mobile Money</p>
              </div>
              {state === 'error' && (
                <div className="mb-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p className="text-red-500 text-sm">{errMsg}</p>
                </div>
              )}
              <p className="text-sm text-text-grey mb-3">Numéro MTN MoMo</p>
              <div className="flex items-center gap-3 rounded-xl px-4 py-3.5 border border-divider bg-surface-g mb-4">
                <span className="font-bold text-text-dark text-sm">+229</span>
                <div className="w-px h-4 bg-divider" />
                <input type="tel" value={tel} onChange={e => setTel(e.target.value.replace(/\D/g, ''))}
                  placeholder="XX XX XX XX" maxLength={8}
                  className="flex-1 bg-transparent outline-none text-text-dark font-semibold tracking-wider" />
              </div>
              <div className="flex items-start gap-2 text-xs text-text-grey mb-4">
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>Une demande de paiement sera envoyée à votre téléphone. Validez-la dans les 3 minutes.</span>
              </div>
              <button onClick={payer} disabled={tel.length < 8}
                className="w-full py-4 rounded-xl font-bold text-white disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, #0F3460, ${TEAL})`, boxShadow: '0 4px 14px rgba(14,165,233,0.35)' }}>
                Payer {total.toLocaleString('fr-FR')} FCFA
              </button>
            </div>
          ) : (
            <div className="rounded-2xl p-8 flex flex-col items-center" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="w-12 h-12 border-3 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: TEAL, borderTopColor: 'transparent', borderWidth: 3 }} />
              <p className="font-bold text-text-dark mb-1">Confirmation en cours…</p>
              <p className="text-sm text-text-grey text-center">Validez la demande sur votre téléphone +229 {tel}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
