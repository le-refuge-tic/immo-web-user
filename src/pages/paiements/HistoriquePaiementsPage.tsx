import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { paiementApi } from '../../api/paiementApi'

type Filter = 'Tous' | 'Visites' | 'Loyers' | 'Intégration'

const isVisite = (t: any) => String(t.type ?? '').toLowerCase() === 'frais_visite'
const isLoyer  = (t: any) => String(t.type ?? '').toLowerCase() === 'loyer'
const isInteg  = (t: any) => String(t.type ?? '').toLowerCase() === 'integration'

const typeLabel = (t: any) => {
  switch (String(t.type ?? '').toLowerCase()) {
    case 'frais_visite': return 'Frais de visite'
    case 'loyer':         return 'Loyer mensuel'
    case 'integration':   return "Paiement d'intégration"
    case 'virement':      return 'Virement reçu'
    default:               return 'Transaction'
  }
}

const methodeLabel = (m?: string) => {
  switch (String(m ?? '').toLowerCase()) {
    case 'momo':    return 'MTN MoMo'
    case 'flooz':   return 'Moov Flooz'
    case 'celtiis': return 'Celtiis Cash'
    case 'fedapay': return 'FedaPay'
    default:         return m || '—'
  }
}

const statutLabel = (t: any) => {
  switch (String(t.statut ?? '').toLowerCase()) {
    case 'confirme':   return 'Payé'
    case 'echoue':     return 'Échoué'
    case 'en_attente': return 'En attente'
    case 'rembourse':  return 'Remboursé'
    default:            return 'Inconnu'
  }
}

const statutColor = (s: string) => s === 'Payé' ? '#22C55E' : s === 'Échoué' ? '#EF4444' : (s === 'Remboursé' || s === 'En attente') ? '#F59E0B' : '#6B7280'

const iconFor = (t: any) => isVisite(t) ? (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
) : isLoyer(t) ? (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10" /></svg>
) : isInteg(t) ? (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
) : (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v14l-3-2-2 2-2-2-2 2-2-2-3 2V6a2 2 0 012-2z" /></svg>
)

const colorFor = (t: any) => isVisite(t) ? '#FF6B35' : isLoyer(t) ? '#4B6BFF' : isInteg(t) ? '#7B4BFF' : '#6B7280'

const fmt = (v: number) => v <= 0 ? '0 FCFA' : `${Math.trunc(v).toLocaleString('fr-FR')} FCFA`
const fmtDate = (raw?: string, withTime = false) => {
  if (!raw) return '—'
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw.slice(0, 10)
  const base = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  return withTime ? `${base} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : base
}

export default function HistoriquePaiementsPage() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('Tous')
  const [detail, setDetail] = useState<any>(null)

  const load = async () => {
    setLoading(true); setError('')
    try {
      const data = await paiementApi.historique()
      setTransactions(Array.isArray(data) ? data : data?.data || [])
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Impossible de charger vos paiements.')
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = filter === 'Visites' ? transactions.filter(isVisite)
    : filter === 'Loyers' ? transactions.filter(isLoyer)
    : filter === 'Intégration' ? transactions.filter(isInteg)
    : transactions
  const total = filtered.reduce((s, t) => s + Number(t.montant ?? 0), 0)
  const visiteCount = transactions.filter(isVisite).length
  const loyerCount = transactions.filter(isLoyer).length
  const integCount = transactions.filter(isInteg).length

  const bienLabel = (t: any) => {
    if (!t.bien) return null
    const parts = [t.bien.quartier, t.bien.ville].filter(Boolean)
    return parts.length ? parts.join(', ') : null
  }

  const ouvrirRecu = (t: any) => {
    if (!t.reference) return
    if (isVisite(t)) navigate(`/recu/visite/${t.reference}`)
    else if (isLoyer(t)) navigate(`/recu/loyer/${t.reference}`)
  }

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-shrink-0 px-5 pt-14 md:pt-6 pb-6"
        style={{ background: 'linear-gradient(135deg,#1A1A2E,#0F3460)', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.12)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div className="flex-1">
              <p className="text-white font-bold text-lg">Mes paiements</p>
              <p className="text-white/60 text-xs">Historique complet de vos transactions</p>
            </div>
            <button onClick={load} className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.12)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 pb-10">
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4B6BFF', borderTopColor: 'transparent' }} /></div>
          ) : error ? (
            <div className="flex flex-col items-center text-center py-16">
              <p className="font-bold text-text-dark mb-2">Erreur de chargement</p>
              <p className="text-text-grey text-sm mb-4">{error}</p>
              <button onClick={load} className="text-sm font-bold" style={{ color: '#4B6BFF' }}>Réessayer</button>
            </div>
          ) : (
            <>
              {/* Résumé */}
              <div className="rounded-2xl p-4.5 mt-4 mb-4 text-white flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)', boxShadow: '0 8px 24px rgba(75,107,255,0.25)' }}>
                <div>
                  <p className="text-white/70 text-xs">Total payé</p>
                  <p className="text-xl font-bold mt-0.5">{fmt(total)}</p>
                  <p className="text-white/55 text-[11px] mt-0.5">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                  {visiteCount > 0 && <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap" style={{ background: 'rgba(255,255,255,0.15)' }}>{visiteCount} Visites</span>}
                  {loyerCount > 0 && <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap" style={{ background: 'rgba(255,255,255,0.15)' }}>{loyerCount} Loyers</span>}
                  {integCount > 0 && <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap" style={{ background: 'rgba(255,255,255,0.15)' }}>{integCount} Intégration</span>}
                </div>
              </div>

              {/* Filtres */}
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {(['Tous', 'Visites', 'Loyers', 'Intégration'] as Filter[]).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors"
                    style={filter === f
                      ? { background: '#4B6BFF', color: '#fff', boxShadow: '0 4px 12px rgba(75,107,255,0.3)' }
                      : { background: '#fff', color: '#6E6E73', border: '1px solid rgba(0,0,0,0.08)' }}>
                    {f}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={1.5} className="w-14 h-14 mb-3" style={{ opacity: 0.3 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v14l-3-2-2 2-2-2-2 2-2-2-3 2V6a2 2 0 012-2z" /></svg>
                  <p className="font-semibold text-text-grey">Aucune transaction</p>
                  <p className="text-text-grey text-sm mt-1">Vos paiements apparaîtront ici</p>
                </div>
              ) : filtered.map((t, i) => {
                const statut = statutLabel(t)
                const color = colorFor(t)
                const bien = bienLabel(t)
                const confirme = statut === 'Payé'
                const showRecu = confirme && t.reference && (isVisite(t) || isLoyer(t))
                return (
                  <div key={i} onClick={() => setDetail(t)}
                    className="p-4 rounded-2xl mb-2.5 cursor-pointer bg-white" style={{ boxShadow: '0 3px 10px rgba(0,0,0,0.05)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}1A`, color }}>
                        {iconFor(t)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-text-dark text-sm truncate">{typeLabel(t)}</p>
                        {bien && <p className="text-xs text-text-grey truncate mt-0.5">{bien}</p>}
                        <p className="text-[11px] text-text-grey mt-0.5">{fmtDate(t.created_at)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm text-text-dark">{fmt(Number(t.montant ?? 0))}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: `${statutColor(statut)}1F`, color: statutColor(statut) }}>{statut}</span>
                      </div>
                    </div>
                    {showRecu && (
                      <div className="flex justify-end mt-2.5">
                        <button onClick={e => { e.stopPropagation(); ouvrirRecu(t) }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ background: `${color}14`, color, border: `1px solid ${color}4D` }}>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"/></svg>
                          Télécharger le reçu
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>

      {/* Détail */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}
          onClick={() => setDetail(null)}>
          <div className="w-full max-w-md rounded-2xl p-6 max-h-[85vh] overflow-y-auto bg-white"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${colorFor(detail)}1A`, color: colorFor(detail) }}>
                {iconFor(detail)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-text-dark">{typeLabel(detail)}</p>
                <p className="text-xs text-text-grey">{fmtDate(detail.created_at, true)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-text-dark">{fmt(Number(detail.montant ?? 0))}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: `${statutColor(statutLabel(detail))}1F`, color: statutColor(statutLabel(detail)) }}>{statutLabel(detail)}</span>
              </div>
            </div>
            <div className="border-t border-divider pt-3 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-grey mb-1">Détails du paiement</p>
              <div className="flex items-start gap-3"><span className="w-32 flex-shrink-0 text-xs text-text-grey">Référence</span><span className="text-xs font-mono font-semibold text-text-dark break-all">{detail.reference || '—'}</span></div>
              <div className="flex items-start gap-3"><span className="w-32 flex-shrink-0 text-xs text-text-grey">Méthode</span><span className="text-xs font-semibold text-text-dark">{methodeLabel(detail.methode_paiement)}</span></div>
              {detail.telephone_paiement && <div className="flex items-start gap-3"><span className="w-32 flex-shrink-0 text-xs text-text-grey">Téléphone utilisé</span><span className="text-xs font-semibold text-text-dark">{detail.telephone_paiement}</span></div>}
              <div className="flex items-start gap-3"><span className="w-32 flex-shrink-0 text-xs text-text-grey">Date</span><span className="text-xs font-semibold text-text-dark">{fmtDate(detail.created_at, true)}</span></div>
              {detail.visite_id != null && <div className="flex items-start gap-3"><span className="w-32 flex-shrink-0 text-xs text-text-grey">N° visite</span><span className="text-xs font-semibold text-text-dark">#{detail.visite_id}</span></div>}
              {detail.loyer_id != null && <div className="flex items-start gap-3"><span className="w-32 flex-shrink-0 text-xs text-text-grey">N° loyer</span><span className="text-xs font-semibold text-text-dark">#{detail.loyer_id}</span></div>}
              {detail.contrat_id != null && <div className="flex items-start gap-3"><span className="w-32 flex-shrink-0 text-xs text-text-grey">N° contrat</span><span className="text-xs font-semibold text-text-dark">#{detail.contrat_id}</span></div>}
            </div>
            {isVisite(detail) && detail.bien && (
              <div className="border-t border-divider mt-4 pt-3 space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-text-grey mb-1">Bien concerné</p>
                {detail.bien.quartier && <div className="flex items-start gap-3"><span className="w-32 flex-shrink-0 text-xs text-text-grey">Quartier</span><span className="text-xs font-semibold text-text-dark">{detail.bien.quartier}</span></div>}
                {detail.bien.ville && <div className="flex items-start gap-3"><span className="w-32 flex-shrink-0 text-xs text-text-grey">Ville</span><span className="text-xs font-semibold text-text-dark">{detail.bien.ville}</span></div>}
                {detail.date_visite && <div className="flex items-start gap-3"><span className="w-32 flex-shrink-0 text-xs text-text-grey">Date de visite</span><span className="text-xs font-semibold text-text-dark">{fmtDate(detail.date_visite)}</span></div>}
              </div>
            )}
            {statutLabel(detail) === 'Payé' && detail.reference && (isVisite(detail) || isLoyer(detail)) && (
              <button onClick={() => { const t = detail; setDetail(null); ouvrirRecu(t) }}
                className="w-full mt-5 py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: colorFor(detail) }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"/></svg>
                Télécharger le reçu
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
