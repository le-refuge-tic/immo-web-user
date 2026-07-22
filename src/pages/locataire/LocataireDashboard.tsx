import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { loyersApi } from '../../api/loyersApi'
import { paiementApi } from '../../api/paiementApi'
import { notificationsApi } from '../../api/notificationsApi'
import logoUrl from '../../assets/REFUGE-LOGO.png'

// ─── Icons ────────────────────────────────────────────────────────────────────
const IcHome   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
const IcChart  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
const IcChat   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
const IcBell   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
const IcPerson = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
const IcMoney  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
const IcCheck  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
const IcCal    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
const IcPin    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
const IcPhone  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
const IcLogout = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>

const GREEN  = '#22C55E'
const TEAL   = '#0EA5E9'
const ORANGE = '#F59E0B'

type Tab = 'logement' | 'activite' | 'messages' | 'alertes' | 'profil'

const OPERATEURS: { id: 'momo' | 'flooz' | 'celtiis' | 'fedapay'; label: string; accent: string }[] = [
  { id: 'momo', label: 'MTN MoMo', accent: '#FFCC00' },
  { id: 'flooz', label: 'Moov Flooz', accent: '#0066CC' },
  { id: 'celtiis', label: 'Celtiis', accent: '#D32F2F' },
  { id: 'fedapay', label: 'FedaPay', accent: '#00B4D8' },
]

function OperateurChips({ value, onChange }: { value: string; onChange: (v: any) => void }) {
  return (
    <div className="flex gap-2 mb-3 flex-wrap">
      {OPERATEURS.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all"
          style={value === o.id
            ? { borderColor: o.accent, background: `${o.accent}20`, color: '#1A1A2E' }
            : { borderColor: '#E5E7EB', color: '#6B7280', background: '#fff' }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── Mon Logement ─────────────────────────────────────────────────────────────
function MonLogementTab() {
  const [data, setData]         = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<number[]>([])
  const [tel, setTel]           = useState('')
  const [operateur, setOperateur] = useState<'momo' | 'flooz' | 'celtiis' | 'fedapay'>('momo')
  const [paying, setPaying]     = useState(false)
  const [payState, setPayState] = useState<'idle'|'waiting'|'success'|'error'>('idle')
  const [payMsg, setPayMsg]     = useState('')
  const pollRef                 = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = async () => {
    setLoading(true)
    try { setData(await loyersApi.monLogement()) } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const loyers: any[] = data?.loyers_en_attente || []
  const historique: any[] = data?.historique || []
  const contrat = data?.contrat
  const bien    = data?.bien
  const gestionnaire = data?.gestionnaire

  const toggleLoyer = (id: number) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const totalSelected = loyers.filter(l => selected.includes(l.id)).reduce((s: number, l: any) => s + Number(l.montant), 0)

  const payer = async () => {
    if (!tel || selected.length === 0) return
    setPaying(true)
    setPayState('waiting')
    try {
      const res = await paiementApi.initierLoyer({ loyer_id: selected[0], methode_paiement: operateur, telephone_paiement: tel })
      const refId = res.referenceId || res.reference_id
      let attempts = 0
      pollRef.current = setInterval(async () => {
        attempts++
        try {
          const status = await paiementApi.statutLoyer(refId)
          if (status.statut === 'reussi' || status.statut === 'success') {
            clearInterval(pollRef.current!)
            setPayState('success'); setSelected([]); load()
          } else if (status.statut === 'echoue' || status.statut === 'failed') {
            clearInterval(pollRef.current!)
            setPayState('error'); setPayMsg('Paiement échoué. Réessayez.')
          }
        } catch (_) {}
        if (attempts >= 20) { clearInterval(pollRef.current!); setPayState('error'); setPayMsg('Délai expiré.') }
      }, 3000)
    } catch (e: any) {
      setPayState('error'); setPayMsg(e?.response?.data?.message || 'Erreur de paiement')
    }
    setPaying(false)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GREEN, borderTopColor: 'transparent' }} /></div>

  if (!contrat) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: TEAL + '20' }}>
        <IcHome />
      </div>
      <p className="font-bold text-text-dark text-lg mb-2">Aucun logement actif</p>
      <p className="text-text-grey text-sm">Votre contrat de bail apparaîtra ici après intégration.</p>
    </div>
  )

  const typeLabels: Record<string, string> = { maison: 'Maison', appart_vide: 'Appartement vide', appart_meuble: 'Appartement meublé', guesthouse: 'Guesthouse', terrain: 'Terrain' }

  const GestionnaireCard = ({ desktop }: { desktop?: boolean }) => (
    <div className={`${desktop ? '' : 'md:hidden'} rounded-2xl p-4 md:p-5 flex items-center gap-3`}
      style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: desktop ? '0 4px 24px rgba(0,0,0,0.06)' : undefined }}>
      <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: `linear-gradient(135deg, #4B6BFF, #7B4BFF)` }}>
        {(gestionnaire.prenom?.[0] || '') + (gestionnaire.nom?.[0] || '')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-text-dark text-sm">{gestionnaire.prenom} {gestionnaire.nom}</p>
        <p className="text-xs text-text-grey capitalize">{gestionnaire.role === 'demarcheur' ? 'Agent' : 'Propriétaire'}</p>
      </div>
      {gestionnaire.telephone && (
        <a href={`tel:${gestionnaire.telephone}`} className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0" style={{ background: '#22C55E20', color: GREEN }}>
          <IcPhone />
        </a>
      )}
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto pb-6 md:pb-12">
      <div className="md:max-w-6xl md:mx-auto md:w-full md:px-8 md:pt-8 md:flex md:gap-6 md:items-start">
        <div className="md:flex-1 md:min-w-0">
          {/* Hero card */}
          <div className="mx-4 mt-5 md:mx-0 md:mt-0 rounded-3xl p-5 md:p-7 text-white" style={{ background: `linear-gradient(135deg, #065F46, ${GREEN})`, boxShadow: `0 8px 24px ${GREEN}50` }}>
            <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Mon logement</p>
            <p className="font-bold text-xl md:text-2xl mb-1">{typeLabels[bien?.type] || bien?.type}</p>
            <div className="flex items-center gap-1.5 mb-4 text-white/80 text-sm">
              <IcPin />
              <span>{bien?.localisation?.quartier ? `${bien.localisation.quartier}, ` : ''}{bien?.localisation?.ville}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 md:gap-3 md:max-w-xl">
              {[
                { label: 'Loyer/mois', value: `${Number(contrat.loyer_mensuel || 0).toLocaleString('fr-FR')}F` },
                { label: 'Échéance', value: contrat.prochain_paiement ? new Date(contrat.prochain_paiement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—' },
                { label: 'Payés', value: `${data.mois_payes ?? 0}` },
                { label: 'Dûs', value: `${data.mois_dus ?? 0}`, warn: (data.mois_dus ?? 0) > 0 },
              ].map(s => (
                <div key={s.label} className="rounded-xl px-2 py-2 md:py-3 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <p className="font-bold text-sm md:text-base leading-tight" style={{ color: s.warn ? '#FCD34D' : 'white' }}>{s.value}</p>
                  <p className="text-[10px] md:text-xs mt-0.5 text-white/60">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gestionnaire — mobile only, desktop copy lives in side column */}
          {gestionnaire && (
            <div className="mx-4 mt-4">
              <GestionnaireCard />
            </div>
          )}

          {/* Loyers en attente */}
          {loyers.length > 0 && (
            <div className="mx-4 md:mx-0 mt-5">
              <p className="font-bold text-text-dark mb-3">Loyers en attente ({loyers.length})</p>
              <div className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
                {loyers.map((l: any) => (
                  <button key={l.id} onClick={() => toggleLoyer(l.id)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left"
                    style={{ background: selected.includes(l.id) ? GREEN + '10' : 'rgba(255,255,255,0.8)', borderColor: selected.includes(l.id) ? GREEN : 'rgba(0,0,0,0.07)' }}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all`}
                      style={{ borderColor: selected.includes(l.id) ? GREEN : '#D1D5DB', background: selected.includes(l.id) ? GREEN : 'transparent' }}>
                      {selected.includes(l.id) && <span className="text-white"><IcCheck /></span>}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-text-dark text-sm">{l.mois || new Date(l.date_echeance).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                      <p className="text-xs text-text-grey">Échéance : {new Date(l.date_echeance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <p className="font-bold text-text-dark text-sm flex-shrink-0">{Number(l.montant).toLocaleString('fr-FR')} F</p>
                  </button>
                ))}
              </div>

              {/* Paiement MoMo */}
              {selected.length > 0 && (
                <div className="mt-4 rounded-2xl p-4 md:max-w-md" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.08)' }}>
                  {payState === 'success' ? (
                    <div className="flex items-center gap-2 justify-center py-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: GREEN }}><IcCheck /></div>
                      <p className="font-bold text-text-dark">Paiement confirmé !</p>
                    </div>
                  ) : payState === 'error' ? (
                    <div className="text-center">
                      <p className="text-red-500 text-sm mb-3">{payMsg}</p>
                      <button onClick={() => setPayState('idle')} className="text-sm font-semibold text-primary">Réessayer</button>
                    </div>
                  ) : payState === 'waiting' ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GREEN, borderTopColor: 'transparent' }} />
                      <p className="text-sm text-text-grey">Confirmation du paiement MoMo…</p>
                      <p className="text-xs text-text-grey">Validez la demande sur votre téléphone</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between mb-3">
                        <p className="text-sm text-text-grey">{selected.length} loyer{selected.length > 1 ? 's' : ''}</p>
                        <p className="font-bold text-text-dark">{totalSelected.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <OperateurChips value={operateur} onChange={setOperateur} />
                      <div className="flex items-center gap-2 bg-surface-g rounded-xl px-4 py-3 mb-3 border border-divider">
                        <span className="text-text-grey text-sm font-semibold">+229</span>
                        <div className="w-px h-4 bg-divider" />
                        <input type="tel" value={tel} onChange={e => setTel(e.target.value.replace(/\D/g, ''))}
                          placeholder="XX XX XX XX" maxLength={8}
                          className="flex-1 bg-transparent text-sm outline-none text-text-dark" />
                      </div>
                      <button onClick={payer} disabled={!tel || paying}
                        className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-opacity hover:opacity-90"
                        style={{ background: `linear-gradient(135deg, #065F46, ${GREEN})` }}>
                        Payer via {OPERATEURS.find(o => o.id === operateur)?.label}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Historique */}
          {historique.length > 0 && (
            <div className="mx-4 md:mx-0 mt-5">
              <p className="font-bold text-text-dark mb-3">Historique des paiements</p>
              <div className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
                {historique.map((h: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#22C55E20' }}>
                      <span style={{ color: GREEN }}><IcCheck /></span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-text-dark text-sm">{h.mois || new Date(h.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                      <p className="text-xs text-text-grey">{new Date(h.created_at || h.date_paiement).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <p className="font-bold text-sm" style={{ color: GREEN }}>{Number(h.montant).toLocaleString('fr-FR')} F</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loyers.length === 0 && historique.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center px-6 md:mx-0 md:rounded-3xl md:mt-5" style={{ background: 'transparent' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: GREEN + '20' }}>
                <span style={{ color: GREEN }}><IcCheck /></span>
              </div>
              <p className="font-bold text-text-dark mb-1">Tout est à jour !</p>
              <p className="text-text-grey text-sm">Aucun loyer en attente.</p>
            </div>
          )}
        </div>

        {/* Side column — desktop only */}
        {gestionnaire && (
          <div className="hidden md:block md:w-80 md:flex-shrink-0 md:sticky md:top-8 md:space-y-4">
            <GestionnaireCard desktop />
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <p className="text-xs font-bold text-text-grey uppercase tracking-wider mb-3">Résumé</p>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between"><span className="text-text-grey">Loyer mensuel</span><span className="font-bold text-text-dark">{Number(contrat.loyer_mensuel || 0).toLocaleString('fr-FR')} F</span></div>
                <div className="flex justify-between"><span className="text-text-grey">Loyers payés</span><span className="font-bold text-text-dark">{data.mois_payes ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-text-grey">Loyers dûs</span><span className="font-bold" style={{ color: (data.mois_dus ?? 0) > 0 ? '#EF4444' : GREEN }}>{data.mois_dus ?? 0}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Activité ─────────────────────────────────────────────────────────────────
function ActiviteTab() {
  const [data, setData]         = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [tel, setTel]           = useState('')
  const [operateur, setOperateur] = useState<'momo' | 'flooz' | 'celtiis' | 'fedapay'>('momo')
  const [showPay, setShowPay]   = useState(false)
  const [paying, setPaying]     = useState(false)
  const [payState, setPayState] = useState<'idle'|'waiting'|'success'|'error'>('idle')
  const [payMsg, setPayMsg]     = useState('')
  const pollRef                 = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = async () => {
    setLoading(true)
    try { setData(await loyersApi.monLogement()) } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const prochainLoyer = data?.loyers_en_attente?.[0]
  const historique: any[] = data?.historique || []

  const urgence = () => {
    if (!prochainLoyer) return null
    const diff = new Date(prochainLoyer.date_echeance).getTime() - Date.now()
    const jours = Math.ceil(diff / 86400000)
    if (jours < 0)  return { label: `En retard de ${-jours}j`, color: '#EF4444', bg: '#EF444420' }
    if (jours <= 3) return { label: `Dû dans ${jours}j`, color: ORANGE, bg: ORANGE + '20' }
    if (jours <= 7) return { label: `À payer dans ${jours}j`, color: TEAL, bg: TEAL + '20' }
    return { label: `${jours} jours`, color: GREEN, bg: GREEN + '20' }
  }

  const payer = async () => {
    if (!tel || !prochainLoyer) return
    setPaying(true); setPayState('waiting')
    try {
      const res = await paiementApi.initierLoyer({ loyer_id: prochainLoyer.id, methode_paiement: operateur, telephone_paiement: tel })
      const refId = res.referenceId || res.reference_id
      let attempts = 0
      pollRef.current = setInterval(async () => {
        attempts++
        try {
          const status = await paiementApi.statutLoyer(refId)
          if (status.statut === 'reussi' || status.statut === 'success') {
            clearInterval(pollRef.current!); setPayState('success'); setShowPay(false); load()
          } else if (status.statut === 'echoue' || status.statut === 'failed') {
            clearInterval(pollRef.current!); setPayState('error'); setPayMsg('Paiement échoué.')
          }
        } catch (_) {}
        if (attempts >= 20) { clearInterval(pollRef.current!); setPayState('error'); setPayMsg('Délai expiré.') }
      }, 3000)
    } catch (e: any) {
      setPayState('error'); setPayMsg(e?.response?.data?.message || 'Erreur')
    }
    setPaying(false)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GREEN, borderTopColor: 'transparent' }} /></div>

  const urg = urgence()

  return (
    <div className="flex-1 overflow-y-auto pb-6 px-4 md:px-8 md:max-w-3xl md:mx-auto md:w-full">
      {/* Prochaine échéance */}
      {prochainLoyer && urg && (
        <div className="mt-5 md:mt-8 rounded-3xl p-5" style={{ background: urg.bg, border: `1.5px solid ${urg.color}30` }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-text-dark">Prochaine échéance</p>
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: urg.color, color: 'white' }}>{urg.label}</span>
          </div>
          <p className="text-2xl font-bold text-text-dark mb-1">{Number(prochainLoyer.montant).toLocaleString('fr-FR')} FCFA</p>
          <div className="flex items-center gap-1.5 text-text-grey text-sm">
            <IcCal />
            <span>{new Date(prochainLoyer.date_echeance).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
          <button onClick={() => setShowPay(!showPay)} className="mt-4 w-full py-3 rounded-xl font-bold text-white text-sm"
            style={{ background: `linear-gradient(135deg, #065F46, ${GREEN})` }}>
            Payer ce loyer
          </button>
        </div>
      )}

      {/* Modal paiement */}
      {showPay && (
        <div className="mt-3 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.08)' }}>
          {payState === 'waiting' ? (
            <div className="flex flex-col items-center gap-2 py-3">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GREEN, borderTopColor: 'transparent' }} />
              <p className="text-sm text-text-grey">Validez sur votre téléphone…</p>
            </div>
          ) : payState === 'success' ? (
            <div className="flex items-center gap-2 justify-center py-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: GREEN }}><IcCheck /></div>
              <p className="font-bold text-text-dark">Paiement confirmé !</p>
            </div>
          ) : payState === 'error' ? (
            <div className="text-center">
              <p className="text-red-500 text-sm mb-2">{payMsg}</p>
              <button onClick={() => setPayState('idle')} className="text-sm font-semibold" style={{ color: TEAL }}>Réessayer</button>
            </div>
          ) : (
            <>
              <p className="font-semibold text-text-dark text-sm mb-2">Numéro de téléphone</p>
              <OperateurChips value={operateur} onChange={setOperateur} />
              <div className="flex items-center gap-2 bg-surface-g rounded-xl px-4 py-3 mb-3 border border-divider">
                <span className="text-text-grey text-sm font-semibold">+229</span>
                <div className="w-px h-4 bg-divider" />
                <input type="tel" value={tel} onChange={e => setTel(e.target.value.replace(/\D/g, ''))}
                  placeholder="XX XX XX XX" maxLength={8}
                  className="flex-1 bg-transparent text-sm outline-none text-text-dark" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowPay(false)} className="flex-1 py-3 rounded-xl border border-divider text-sm font-semibold text-text-grey">Annuler</button>
                <button onClick={payer} disabled={!tel || paying} className="flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ background: GREEN }}>Payer</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Historique */}
      <div className="mt-6">
        <p className="font-bold text-text-dark mb-3">Historique ({historique.length})</p>
        {historique.length === 0 ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.7)' }}>
            <p className="text-text-grey text-sm">Aucun paiement effectué pour l'instant.</p>
          </div>
        ) : historique.map((h: any, i: number) => (
          <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl mb-2" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: GREEN + '15' }}>
              <span style={{ color: GREEN }}><IcMoney /></span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-text-dark text-sm">{h.mois || new Date(h.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
              <p className="text-xs text-text-grey">{new Date(h.created_at || h.date_paiement).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm" style={{ color: GREEN }}>+{Number(h.montant).toLocaleString('fr-FR')} F</p>
              <span className="text-[10px] font-semibold" style={{ color: GREEN }}>Payé</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Alertes ──────────────────────────────────────────────────────────────────
function AlertesTab() {
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    notificationsApi.list()
      .then(d => setNotifs(Array.isArray(d) ? d : d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])
  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GREEN, borderTopColor: 'transparent' }} /></div>
  return (
    <div className="flex-1 overflow-y-auto pb-6 px-4 pt-4 md:px-8 md:pt-8 md:max-w-3xl md:mx-auto md:w-full">
      {notifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: GREEN + '20' }}>
            <IcBell />
          </div>
          <p className="font-bold text-text-dark mb-1">Aucune alerte</p>
          <p className="text-text-grey text-sm">Vos notifications apparaîtront ici.</p>
        </div>
      ) : notifs.map((n: any) => (
        <div key={n.id} className="flex items-start gap-3 p-4 rounded-2xl mb-2" style={{ background: n.lue ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.9)', border: n.lue ? '1px solid rgba(0,0,0,0.05)' : `1px solid ${GREEN}30` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: GREEN + '15' }}>
            {!n.lue && <div className="w-2 h-2 rounded-full absolute -top-0.5 -right-0.5" style={{ background: GREEN }} />}
            <IcBell />
          </div>
          <div className="flex-1">
            <p className={`text-sm ${n.lue ? 'text-text-grey' : 'font-semibold text-text-dark'}`}>{n.titre || n.message}</p>
            <p className="text-xs text-text-grey mt-0.5">{new Date(n.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
          {!n.lue && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: GREEN }} />}
        </div>
      ))}
    </div>
  )
}

// ─── Profil ───────────────────────────────────────────────────────────────────
function ProfilTab() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()
  return (
    <div className="flex-1 overflow-y-auto pb-10 pt-5 md:pt-10 md:max-w-2xl md:mx-auto md:w-full">
      <div className="flex flex-col items-center px-5 mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3"
          style={{ background: `linear-gradient(135deg, #065F46, ${GREEN})` }}>{initials}</div>
        <p className="font-bold text-text-dark text-lg">{user?.prenom} {user?.nom}</p>
        <p className="text-sm text-text-grey mt-0.5">{user?.email || user?.telephone}</p>
        <span className="mt-2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: GREEN + '20', color: GREEN }}>Locataire</span>
      </div>
      <div className="px-4 space-y-2">
        {[
          { label: 'Modifier le profil', action: () => navigate('/profil') },
          { label: 'Gérer mes rôles', action: () => navigate('/mes-roles') },
          { label: 'Revenir à l\'accueil', action: () => navigate('/') },
        ].map(item => (
          <button key={item.label} onClick={item.action}
            className="w-full bg-white rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm">
            <span className="text-sm font-semibold text-text-dark">{item.label}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-text-grey"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        ))}
        <button onClick={() => { logout(); navigate('/login') }}
          className="w-full mt-2 py-3.5 rounded-xl font-bold text-sm border flex items-center justify-center gap-2"
          style={{ color: '#EF4444', borderColor: '#EF444430', background: '#EF444408' }}>
          <IcLogout /> Se déconnecter
        </button>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const TABS: { key: Tab; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  { key: 'logement', label: 'Logement', icon: () => <IcHome /> },
  { key: 'activite', label: 'Activité',  icon: () => <IcChart /> },
  { key: 'messages', label: 'Messages', icon: () => <IcChat /> },
  { key: 'alertes',  label: 'Alertes',  icon: () => <IcBell /> },
  { key: 'profil',   label: 'Profil',   icon: () => <IcPerson /> },
]

// ─── Sidebar (desktop) ──────────────────────────────────────────────────────
function Sidebar({ tab, setTab, user, navigate, logout }: any) {
  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:flex-shrink-0 md:h-dvh md:sticky md:top-0"
      style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(40px) saturate(180%)', borderRight: '1px solid rgba(0,0,0,0.06)' }}>
      <button onClick={() => navigate('/')} className="flex items-center gap-2.5 px-6 pt-6 pb-5 flex-shrink-0">
        <img src={logoUrl} alt="REFUGE" style={{ width: 34, height: 34, objectFit: 'contain' }} />
        <span className="font-bold text-lg tracking-tight" style={{ color: '#00AEEF' }}>REFUGE</span>
      </button>
      <p className="px-6 mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(0,0,0,0.35)' }}>Espace Locataire</p>
      <nav className="flex-1 px-3 space-y-1">
        {TABS.map(t => {
          const active = tab === t.key
          return (
            <button key={t.key} onClick={() => t.key === 'messages' ? navigate('/conversations') : setTab(t.key)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left"
              style={{ color: active ? GREEN : 'rgba(0,0,0,0.55)', background: active ? GREEN + '15' : 'transparent' }}>
              <span style={{ color: active ? GREEN : 'rgba(0,0,0,0.4)' }}>{t.icon(active)}</span>
              {t.label}
            </button>
          )
        })}
      </nav>
      <div className="px-3 pb-5 flex-shrink-0">
        <button onClick={() => navigate('/profil')}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all"
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.04)'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: `linear-gradient(135deg, #065F46, ${GREEN})` }}>{initials}</div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-bold text-text-dark truncate">{user?.prenom} {user?.nom}</p>
            <p className="text-[10px] text-text-grey">Locataire</p>
          </div>
        </button>
        <button onClick={() => { logout(); navigate('/login') }}
          className="w-full mt-1 flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ color: '#EF4444' }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#EF444408'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}>
          <IcLogout /> Déconnexion
        </button>
      </div>
    </aside>
  )
}

export default function LocataireDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('logement')
  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()

  const title = tab === 'logement' ? 'Mon Logement'
    : tab === 'activite' ? 'Activité'
    : tab === 'messages' ? 'Messages'
    : tab === 'alertes' ? 'Alertes'
    : 'Mon Profil'

  return (
    <div className="flex h-dvh" style={{ background: '#F0FDF4' }}>
      <Sidebar tab={tab} setTab={setTab} user={user} navigate={navigate} logout={logout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex-shrink-0 px-5 pt-12 pb-5" style={{ background: `linear-gradient(135deg, #065F46, ${GREEN})` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">REFUGE · Locataire</p>
              <p className="text-white font-bold text-xl mt-0.5">{title}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)' }}>{initials}</div>
          </div>
        </div>

        {/* Desktop top bar */}
        <div className="hidden md:flex flex-shrink-0 items-center justify-between px-8 h-16" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)' }}>
          <p className="font-bold text-text-dark text-xl">{title}</p>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {tab === 'logement' && <MonLogementTab />}
          {tab === 'activite' && <ActiviteTab />}
          {tab === 'messages' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: TEAL + '20' }}>
                <IcChat />
              </div>
              <p className="font-bold text-text-dark mb-1">Messagerie</p>
              <button onClick={() => navigate('/conversations')} className="mt-3 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90" style={{ background: TEAL }}>
                Ouvrir les conversations
              </button>
            </div>
          )}
          {tab === 'alertes' && <AlertesTab />}
          {tab === 'profil' && <ProfilTab />}
        </div>

        {/* Bottom Nav — mobile only */}
        <div className="md:hidden flex-shrink-0 border-t" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderColor: 'rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-around px-2 py-2">
            {TABS.map(t => {
              const active = tab === t.key
              return (
                <button key={t.key} onClick={() => t.key === 'messages' ? navigate('/conversations') : setTab(t.key)}
                  className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all"
                  style={active ? { background: GREEN + '18' } : {}}>
                  <span style={{ color: active ? GREEN : 'rgba(0,0,0,0.35)' }}>{t.icon(active)}</span>
                  {active && <span className="text-[10px] font-bold" style={{ color: GREEN }}>{t.label}</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
