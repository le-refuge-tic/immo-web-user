import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { visitesApi } from '../../../api/visitesApi'
import { chatApi } from '../../../api/chatApi'
import { AnimatedGroup } from '../../../components/ui/animated-group'
import { IcRefresh } from './icons'
import { IcPin, IcChat, BLUE, bienLabel, fmtPrix, statutVisite } from './shared'
import { isEchouee, isDatePassee, minutesAvant, isUrgente } from './VisiteCard'
import { ReservationDetailModal } from './ReservationDetailModal'
import type { Visite } from '../../../types/api'

export function ReservationsTab({ biens, onScrolled, onOpenMessages }: { biens: any[]; onScrolled?: (v: boolean) => void; onOpenMessages?: (convId: number, draftMessage?: string) => void }) {
  const navigate = useNavigate()
  const [visites, setVisites] = useState<Visite[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Toutes')
  const [bienIdFilter, setBienIdFilter] = useState<number | null>(null)
  const [cpId, setCpId] = useState<number | null>(null)
  const [cpDate, setCpDate] = useState('')
  const [cpTime, setCpTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [chatLoadingId, setChatLoadingId] = useState<number | null>(null)
  const [modalVisiteId, setModalVisiteId] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [chatError, setChatError] = useState('')
  const [hoveredVisiteEl, setHoveredVisiteEl] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try { const d = await visitesApi.reservationsRecues(); setVisites(Array.isArray(d) ? d : d.data || []) } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(id) }, [])

  const biensUniques = (() => {
    const seen = new Set<number>()
    const list: { id: number; label: string }[] = []
    for (const v of visites) {
      const id = v.bien?.id
      if (!id || seen.has(id)) continue
      seen.add(id)
      const loc = v.bien?.localisation
      list.push({ id, label: `${v.bien ? bienLabel(v.bien) : ''} — ${loc?.quartier || loc?.ville || ''}` })
    }
    return list
  })()

  const byBien = bienIdFilter ? visites.filter(v => v.bien?.id === bienIdFilter) : visites
  const filtered = filter === 'Toutes' ? byBien
    : filter === 'À traiter' ? byBien.filter(v => !isEchouee(v) && (v.statut === 'en_attente' || v.statut === 'contre_proposee'))
    : filter === 'Confirmées' ? byBien.filter(v => !isEchouee(v) && v.statut === 'confirmee')
    : filter === 'Effectuées' ? byBien.filter(v => v.statut === 'effectuee')
    : filter === 'Échouées' ? byBien.filter(v => isEchouee(v))
    : byBien.filter(v => v.statut === 'annulee')

  const confirmer = async (id: number) => {
    try { await visitesApi.confirmerVisite(id); load() } catch (_) {}
  }

  const marquerEffectuee = async (id: number) => {
    try { await visitesApi.marquerEffectuee(id); load() } catch (_) {}
  }

  const ouvrirChat = async (v: any) => {
    const clientId = v.client?.id
    const bienId = v.bien?.id
    if (!clientId || !bienId) return
    setChatLoadingId(v.id)
    try {
      const convs = await chatApi.conversations()
      const list = Array.isArray(convs) ? convs : convs.data || []
      const match = list.find((c: any) => c.bien?.id === bienId && c.participants?.some((p: any) => p.id === clientId))
      if (match) {
        const draftMessage = isEchouee(v)
          ? `Bonjour, concernant votre visite du ${new Date(v.date_souhaitee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} qui ne s'est pas tenue, peut-on reprogrammer ?`
          : undefined
        if (onOpenMessages) onOpenMessages(match.id, draftMessage)
        else navigate(`/conversations/${match.id}`, draftMessage ? { state: { draftMessage } } : undefined)
      }
      else setChatError('Ce client n\'a pas encore démarré de conversation pour ce bien.')
    } catch (_) {}
    setChatLoadingId(null)
  }

  const contreProposer = async () => {
    if (!cpId || !cpDate || !cpTime) return
    setSubmitting(true)
    try {
      await visitesApi.contreProposer(cpId, `${cpDate}T${cpTime}:00`)
      setCpId(null); setCpDate(''); setCpTime('')
      load()
    } catch (_) {}
    setSubmitting(false)
  }

  const modalVisite = modalVisiteId ? visites.find(v => v.id === modalVisiteId) || null : null

  const STATUS_FILTERS = ['Toutes', 'À traiter', 'Confirmées', 'Effectuées', 'Annulées', 'Échouées']

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: 'var(--p-deep)' }}>
      {chatError && (
        <div className="mx-5 mt-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171' }}>
          {chatError}
          <button onClick={() => setChatError('')} className="text-base leading-none flex-shrink-0" style={{ color: '#F87171' }}>✕</button>
        </div>
      )}

      {/* ── En-tête + filtres ── */}
      <div className="flex-shrink-0 px-5 md:px-8 xl:px-10 pt-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-1" style={{ color: 'var(--p-muted)' }}>Agenda</p>
            <h2 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--p-text)' }}>
              Réservations
              {!loading && <span className="ml-2 text-[15px] font-bold" style={{ color: BLUE }}>{filtered.length}</span>}
            </h2>
          </div>
          <button onClick={load}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all"
            style={{ color: 'var(--p-muted)', borderColor: 'var(--p-border)', background: 'var(--p-card)' }}>
            <IcRefresh /> Actualiser
          </button>
        </div>

        {/* Filtre statut */}
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={filter === f
                ? { background: BLUE, color: '#fff', borderColor: BLUE, boxShadow: `0 4px 12px ${BLUE}35` }
                : { background: 'var(--p-card)', color: 'var(--p-muted)', borderColor: 'var(--p-border)' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Filtre par bien (si plusieurs) */}
        {biensUniques.length >= 2 && (
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            <button onClick={() => setBienIdFilter(null)}
              className="flex-shrink-0 px-3.5 py-1 rounded-full text-[11px] font-semibold border transition-all"
              style={bienIdFilter === null
                ? { background: BLUE + '14', color: BLUE, borderColor: BLUE + '30' }
                : { background: 'var(--p-card)', color: 'var(--p-muted)', borderColor: 'var(--p-border)' }}>
              Tous les biens
            </button>
            {biensUniques.map(b => (
              <button key={b.id} onClick={() => setBienIdFilter(b.id)}
                className="flex-shrink-0 px-3.5 py-1 rounded-full text-[11px] font-semibold border transition-all whitespace-nowrap"
                style={bienIdFilter === b.id
                  ? { background: BLUE + '14', color: BLUE, borderColor: BLUE + '30' }
                  : { background: 'var(--p-card)', color: 'var(--p-muted)', borderColor: 'var(--p-border)' }}>
                {b.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Contenu ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 md:px-8 xl:px-10 pb-24"
        onScroll={e => onScrolled?.(e.currentTarget.scrollTop > 50)}>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {[1,2,3,4,5,6].map(n => (
              <div key={n} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
                <div className="h-40 w-full" style={{ background: 'var(--p-border)' }} />
                <div className="p-4 space-y-3">
                  <div className="h-4 rounded-full w-2/3" style={{ background: 'var(--p-border)' }} />
                  <div className="h-3 rounded-full w-1/2" style={{ background: 'var(--p-border)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: BLUE + '12', border: `1.5px solid ${BLUE}25` }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={1.4} className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <p className="font-bold text-lg mb-1" style={{ color: 'var(--p-text)' }}>Aucune réservation</p>
            <p className="text-sm text-center max-w-xs" style={{ color: 'var(--p-muted)' }}>
              {filter === 'Toutes' ? 'Les demandes de visite de vos clients apparaîtront ici' : `Aucune visite « ${filter} »`}
            </p>
          </div>
        ) : (
          <AnimatedGroup preset="blur-slide" stagger={0.055}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {filtered.map(v => {
                const echouee = isEchouee(v)
                const urgente = !echouee && isUrgente(v, now)
                const mins = urgente ? minutesAvant(v, now) : null
                const { label: sLabel, color: sColor } = echouee
                  ? { label: 'Échouée', color: 'var(--tx-red)' }
                  : statutVisite(v.statut)
                const clientNom = `${v.client?.prenom || ''} ${v.client?.nom || ''}`.trim() || 'Client'
                const initiale = clientNom[0]?.toUpperCase() || '?'
                const bType = v.bien ? bienLabel(v.bien) : ''
                const loc = v.bien?.localisation
                const bLoc = loc ? `${loc.quartier ? loc.quartier + ', ' : ''}${loc.ville || ''}` : '—'
                const dateRef = v.date_contre_proposee || v.date_souhaitee
                const dateStr = dateRef
                  ? new Date(dateRef).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                  : '—'
                const heureStr = dateRef
                  ? new Date(dateRef).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                  : ''
                const peutConfirmer = (v.statut === 'en_attente' || v.statut === 'contre_proposee') && !echouee && !isDatePassee(v)
                const bien = biens?.find((b: any) => b.id === v.bien?.id)
                const cover = bien?.photos?.find((p: any) => p.is_cover) || bien?.photos?.[0]
                const accentColor = urgente ? '#DC2626' : sColor

                return (
                  <div key={v.id}
                    className="group rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(75,107,255,0.12),_0_2px_8px_rgba(15,23,42,0.08)]"
                    style={{
                      background: 'var(--p-card)',
                      border: '1px solid var(--p-border)',
                      boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)',
                    }}
                    onClick={() => setModalVisiteId(v.id)}>

                    {/* ── Photo / Avatar ── */}
                    <div className="relative overflow-hidden" style={{ height: 156 }}>
                      {cover?.url
                        ? <img loading="lazy" src={cover.url} alt={bType}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        : <div className="w-full h-full flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${accentColor}18, ${BLUE}14)` }}>
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-4xl"
                              style={{ background: accentColor + '20', color: accentColor }}>{initiale}</div>
                          </div>
                      }
                      {/* Gradient bas */}
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.60) 0%, transparent 50%)' }} />

                      {/* Badge statut haut-gauche */}
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                        style={{ background: accentColor, boxShadow: `0 2px 8px ${accentColor}55` }}>
                        {urgente ? '⚡ Urgent' : sLabel}
                      </span>

                      {/* Badge heure haut-droite */}
                      {heureStr && (
                        <span className="absolute top-3 right-3 px-2 py-1 rounded-lg text-[10px] font-bold text-white"
                          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
                          {heureStr}
                        </span>
                      )}

                      {/* Date + frais bas */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <p className="text-white font-bold text-[13px] leading-none drop-shadow capitalize">{dateStr}</p>
                        {Number(v.frais_visite) > 0 && (
                          <p className="text-white font-black text-[14px] leading-none drop-shadow">{fmtPrix(v.frais_visite)}</p>
                        )}
                      </div>
                    </div>

                    {/* ── Corps ── */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="font-bold text-[15px] leading-tight" style={{ color: 'var(--p-text)' }}>{clientNom}</p>
                        {v.paiement_effectue && (
                          <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: '#22C55E15', color: 'var(--tx-green)' }}>✓ Payé</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mb-4">
                        <span style={{ color: 'var(--p-muted)' }}><IcPin /></span>
                        <p className="text-[12px] truncate" style={{ color: 'var(--p-muted)' }}>{bType} · {bLoc}</p>
                      </div>

                      {/* Urgence compte à rebours */}
                      {urgente && mins !== null && (
                        <div className="flex items-center gap-1.5 mb-3 px-3 py-2 rounded-lg text-xs font-bold animate-pulse"
                          style={{ background: '#EF444412', color: 'var(--tx-red)' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          Dans {mins < 60 ? `${mins} min` : `${Math.round(mins / 60)}h`}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); setModalVisiteId(v.id) }}
                          className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                          style={{ background: hoveredVisiteEl === `detail-${v.id}` ? BLUE + '22' : BLUE + '12', color: BLUE, border: `1px solid ${BLUE}20` }}
                          onMouseEnter={() => setHoveredVisiteEl(`detail-${v.id}`)}
                          onMouseLeave={() => setHoveredVisiteEl(null)}>
                          Voir le détail
                        </button>
                        {peutConfirmer && (
                          <button
                            onClick={e => { e.stopPropagation(); confirmer(v.id) }}
                            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                            style={{ background: hoveredVisiteEl === `confirmer-${v.id}` ? '#22C55E22' : '#22C55E12', color: 'var(--tx-green)', border: '1px solid #22C55E20' }}
                            onMouseEnter={() => setHoveredVisiteEl(`confirmer-${v.id}`)}
                            onMouseLeave={() => setHoveredVisiteEl(null)}>
                            Confirmer ✓
                          </button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); ouvrirChat(v) }}
                          disabled={chatLoadingId === v.id}
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                          style={{ background: hoveredVisiteEl === `chat-${v.id}` ? BLUE + '18' : 'var(--p-border)', color: hoveredVisiteEl === `chat-${v.id}` ? BLUE : 'var(--p-muted)' }}
                          onMouseEnter={() => setHoveredVisiteEl(`chat-${v.id}`)}
                          onMouseLeave={() => setHoveredVisiteEl(null)}>
                          {chatLoadingId === v.id
                            ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            : <IcChat />}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </AnimatedGroup>
        )}
      </div>

      {modalVisite && (
        <ReservationDetailModal v={modalVisite} onClose={() => setModalVisiteId(null)}
          chatLoadingId={chatLoadingId} onChat={ouvrirChat} onConfirm={confirmer} onMarquerEffectuee={marquerEffectuee}
          cpId={cpId} setCpId={setCpId} cpDate={cpDate} setCpDate={setCpDate} cpTime={cpTime} setCpTime={setCpTime}
          submitting={submitting} onContrePropose={contreProposer} now={now} />
      )}
    </div>
  )
}

