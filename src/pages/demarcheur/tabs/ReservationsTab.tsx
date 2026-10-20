import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { tokenStore } from '../../../utils/tokenStore'
import { visitesApi } from '../../../api/visitesApi'
import { chatApi } from '../../../api/chatApi'
import { BASE } from '../../../api/apiBase'
import { bienTypeLabel } from '../../../utils/bienType'
import { suggestPush } from '../../../lib/push'
import { PURPLE, DARK_PURPLE, statutVisite } from '../shared'
import { IcHome, IcCal, IcChat } from '../icons'
import { unwrapList } from '../../../utils/unwrapList'
import type { Visite } from '../../../types/api'

function isEchouee(v: Pick<Visite, 'statut' | 'date_contre_proposee' | 'date_souhaitee'>): boolean {
  if (v.statut === 'effectuee' || v.statut === 'annulee') return false
  const raw = v.date_contre_proposee || v.date_souhaitee
  if (!raw) return false
  return new Date(raw).getTime() < Date.now()
}

export default function ReservationsTab() {
  const navigate = useNavigate()
  const [visites, setVisites] = useState<Visite[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Toutes')
  const [cpId, setCpId] = useState<number | null>(null)
  const [cpDate, setCpDate] = useState('')
  const [cpTime, setCpTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [chatLoadingId, setChatLoadingId] = useState<number | null>(null)
  const [chatError, setChatError] = useState('')

  const load = async () => {
    setLoading(true)
    try { const d = await visitesApi.reservationsRecues(); setVisites(unwrapList(d)) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = filter === 'Toutes' ? visites
    : filter === 'À traiter' ? visites.filter(v => !isEchouee(v) && v.statut === 'en_attente')
    : filter === 'Confirmées' ? visites.filter(v => !isEchouee(v) && v.statut === 'confirmee')
    : filter === 'Échouées' ? visites.filter(v => isEchouee(v))
    : visites.filter(v => v.statut === 'annulee')

  const confirmer = async (id: number) => {
    try { await visitesApi.confirmerVisite(id); load(); suggestPush() } catch {}
  }

  const ouvrirChat = async (v: Visite, draftMessage?: string) => {
    const clientId = v.client?.id
    const bienId = v.bien?.id
    if (!clientId || !bienId) return
    setChatLoadingId(v.id)
    try {
      const convs = await chatApi.conversations()
      const list = unwrapList(convs)
      const match = list.find(c => c.bien?.id === bienId && c.participants?.some(p => p.id === clientId))
      if (match) navigate(`/conversations/${match.id}`, draftMessage ? { state: { draftMessage } } : undefined)
      else setChatError('Ce client n\'a pas encore démarré de conversation pour ce bien.')
    } catch {}
    setChatLoadingId(null)
  }

  // Message de relance pré-rempli pour une visite échouée — comme
  // demarcheur_reservations.dart::_ouvrirChatEchouee sur mobile.
  const ouvrirChatEchouee = (v: Visite) => {
    const prenom = v.client?.prenom || ''
    const bType = v.bien ? bienTypeLabel(v.bien) : ''
    const bLoc = v.bien?.localisation ? `${v.bien.localisation.quartier || ''} ${v.bien.localisation.ville || ''}`.trim() : ''
    const raw = v.date_contre_proposee || v.date_souhaitee
    const dateStr = raw ? new Date(raw).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) + ' à ' + new Date(raw).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''
    const msg = `Bonjour${prenom ? ' ' + prenom : ''}, je vous contacte au sujet de notre visite prévue le ${dateStr} pour le bien ${bType}${bLoc ? ' à ' + bLoc : ''}, qui ne s'est pas tenue. Peut-on reprogrammer ?`
    ouvrirChat(v, msg)
  }

  const contreProposer = async () => {
    if (!cpId || !cpDate || !cpTime) return
    setSubmitting(true)
    try {
      await fetch(`${BASE}/visites/${cpId}/contre-proposer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenStore.getToken()}` },
        body: JSON.stringify({ date_proposee: `${cpDate}T${cpTime}:00` }),
      })
      setCpId(null); setCpDate(''); setCpTime(''); load()
    } catch {}
    setSubmitting(false)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {chatError && (
        <div className="mx-4 mt-3 flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--tx-red)' }}>
          {chatError}
          <button onClick={() => setChatError('')} className="text-base leading-none flex-shrink-0">✕</button>
        </div>
      )}
      <div className="bg-white border-b border-divider flex flex-shrink-0">
        {['Toutes', 'À traiter', 'Confirmées', 'Échouées', 'Annulées'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="flex-1 py-3 text-xs font-bold border-b-2 transition-colors"
            style={filter === f ? { borderColor: PURPLE, color: PURPLE } : { borderColor: 'transparent', color: '#6B7280' }}>
            {f}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
        {loading ? (
          <div className="md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-4">
            {[1,2].map(n => <div key={n} className="h-40 skeleton rounded-2xl mb-3 md:mb-0" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: PURPLE + '15' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <p className="font-bold text-text-dark mb-1">Aucune réservation</p>
            <p className="text-sm text-text-grey text-center">Les demandes de visite apparaîtront ici</p>
          </div>
        ) : (
        <div className="md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-4 md:items-start">
        {filtered.map((v, i) => {
          const echouee = isEchouee(v)
          const { label, color } = echouee ? { label: 'Échouée', color: 'var(--tx-red)' } : statutVisite(v.statut)
          const nom = 'Client'
          const init = 'C'
          const bType = v.bien ? bienTypeLabel(v.bien) : ''
          const bLoc = v.bien?.localisation ? `${v.bien.localisation.quartier || ''} ${v.bien.localisation.ville || ''}`.trim() : '—'
          const dateStr = v.date_souhaitee
            ? new Date(v.date_souhaitee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
              + ' à ' + new Date(v.date_souhaitee).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            : '—'
          const contactNumero = v.client?.numero_whatsapp || v.client?.telephone
          return (
            <div key={v.id || i} className="card-soft rounded-2xl mb-3 md:mb-0 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-[13px] flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${PURPLE}, ${DARK_PURPLE})` }}>{init}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-dark text-sm">{nom}</p>
                  <p className="text-xs text-text-grey">Identité masquée avant confirmation</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-caption font-bold flex-shrink-0" style={{ background: color + '20', color }}>{label}</span>
              </div>
              <div className="bg-surface-g rounded-xl p-3 mb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span style={{ color: PURPLE }}><IcHome /></span>
                  <p className="text-xs font-medium text-text-dark truncate">{bType} — {bLoc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-grey"><IcCal /></span>
                  <p className="text-xs text-text-grey">Demandé pour : {dateStr}</p>
                </div>
              </div>
              {v.paiement_effectue && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-3 text-xs font-semibold" style={{ background: '#4CAF5010', borderColor: '#4CAF5030', color: '#4CAF50' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Frais de visite payés
                </div>
              )}
              {!echouee && v.statut === 'confirmee' && v.numeros_partages && contactNumero && (
                <div className="flex items-center gap-3 p-3 rounded-xl mb-3" style={{ background: '#25D36614', border: '1px solid #25D36650' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#25D36626' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-micro font-semibold" style={{ color: '#25D366' }}>Visite dans 30 min — Contact client</p>
                    <p className="text-sm font-bold text-text-dark">{contactNumero}</p>
                  </div>
                  <a href={`https://wa.me/${contactNumero.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-white text-caption font-bold flex-shrink-0" style={{ background: '#25D366' }}>
                    WhatsApp
                  </a>
                </div>
              )}
              {echouee && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl mb-3" style={{ background: '#EF444410', border: '1px solid #EF444440' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} className="w-4 h-4 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 16l6-6" /></svg>
                  <p className="text-xs font-medium" style={{ color: 'var(--tx-red)' }}>Cette visite ne s'est pas tenue.</p>
                </div>
              )}
              <div className="flex gap-2">
                {echouee ? (
                  <button onClick={() => ouvrirChatEchouee(v)} disabled={chatLoadingId === v.id}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold disabled:opacity-50" style={{ borderColor: '#EF444450', color: 'var(--tx-red)', background: '#EF444410' }}>
                    <IcChat /> {chatLoadingId === v.id ? '…' : 'Contacter le client'}
                  </button>
                ) : (
                  <button onClick={() => ouvrirChat(v)} disabled={chatLoadingId === v.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold disabled:opacity-50" style={{ borderColor: PURPLE + '50', color: PURPLE, background: PURPLE + '10' }}>
                    <IcChat /> {chatLoadingId === v.id ? '…' : 'Chat'}
                  </button>
                )}
                {!echouee && v.statut === 'en_attente' && <>
                  <button onClick={() => setCpId(v.id)} className="flex-1 py-2 rounded-xl border text-xs font-bold" style={{ borderColor: PURPLE + '80', color: PURPLE }}>Autre créneau</button>
                  <button onClick={() => confirmer(v.id)} className="flex-1 py-2 rounded-xl text-white text-xs font-bold" style={{ background: '#4CAF50' }}>Confirmer</button>
                </>}
                {!echouee && v.statut === 'confirmee' && (
                  <button onClick={() => visitesApi.marquerEffectuee(v.id).then(load)} className="flex-1 py-2 rounded-xl text-white text-xs font-bold" style={{ background: PURPLE }}>Marquer effectuée</button>
                )}
              </div>
              {cpId === v.id && (
                <div className="mt-3 pt-3 border-t border-divider">
                  <p className="text-sm font-bold text-text-dark mb-3">Proposer un autre créneau</p>
                  <div className="space-y-2 mb-3">
                    <input type="date" value={cpDate} onChange={e => setCpDate(e.target.value)}
                      className="w-full bg-surface-g rounded-xl px-3 py-2.5 text-sm outline-none border border-divider" />
                    <input type="time" value={cpTime} onChange={e => setCpTime(e.target.value)}
                      className="w-full bg-surface-g rounded-xl px-3 py-2.5 text-sm outline-none border border-divider" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setCpId(null)} className="flex-1 py-2.5 rounded-xl border border-divider text-sm font-semibold text-text-grey">Annuler</button>
                    <button onClick={contreProposer} disabled={!cpDate || !cpTime || submitting}
                      className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: PURPLE }}>
                      {submitting ? 'Envoi…' : 'Envoyer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        </div>
        )}
      </div>
    </div>
  )
}
