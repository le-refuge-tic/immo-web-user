import { useState, useEffect } from 'react'
import { IcChat, BLUE, bienLabel, fmtPrix, statutVisite } from './shared'
import { isEchouee, isDatePassee, minutesAvant, isUrgente } from './VisiteCard'

/** Carte compacte (grille) — aperçu d'une réservation, ouvre le détail complet au clic. */
/** Génère un placeholder SVG coloré pour une réservation sans photo. */
function reservationPlaceholderSrc(letter: string, colorHex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="${colorHex}"/><text x="200" y="230" text-anchor="middle" font-size="160" font-weight="800" fill="rgba(255,255,255,0.18)" font-family="sans-serif">${letter.toUpperCase()}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** Modal de détail — thème clair, sections bien délimitées. */
export function ReservationDetailModal({ v, onClose, chatLoadingId, onChat, onConfirm, onMarquerEffectuee, cpId, setCpId, cpDate, setCpDate, cpTime, setCpTime, submitting, onContrePropose, now }: {
  v: any
  onClose: () => void
  chatLoadingId: number | null
  onChat: (v: any) => void
  onConfirm: (id: number) => void
  onMarquerEffectuee: (id: number) => void
  cpId: number | null
  setCpId: (id: number | null) => void
  cpDate: string
  setCpDate: (s: string) => void
  cpTime: string
  setCpTime: (s: string) => void
  submitting: boolean
  onContrePropose: () => void
  now: number
}) {
  const [confirmEffectuee, setConfirmEffectuee] = useState(false)
  const echouee = isEchouee(v)
  const urgente = !echouee && isUrgente(v, now)
  const { label: sLabel, color: sColor } = echouee ? { label: 'Échouée', color: 'var(--tx-red)' } : statutVisite(v.statut)
  const clientNom = `${v.client?.prenom || ''} ${v.client?.nom || ''}`.trim() || 'Client'
  const initiale = clientNom[0]?.toUpperCase() || '?'
  const bType = v.bien ? bienLabel(v.bien) : ''
  const loc = v.bien?.localisation
  const bLoc = loc ? `${loc.quartier ? loc.quartier + ', ' : ''}${loc.ville || ''}` : '—'
  const dateRef = v.date_contre_proposee || v.date_souhaitee
  const dateStr = dateRef
    ? new Date(dateRef).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—'
  const heureStr = dateRef
    ? new Date(dateRef).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : ''
  const contactNumero = v.client?.numero_whatsapp || v.client?.telephone
  const peutConfirmer = (v.statut === 'en_attente' || v.statut === 'contre_proposee') && !echouee && !isDatePassee(v)
  const mins = urgente ? minutesAvant(v, now) : null

  const [shown, setShown] = useState(false)
  const [closing, setClosing] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
    return () => cancelAnimationFrame(id)
  }, [])
  const handleClose = () => {
    setShown(false)
    setClosing(true)
    setTimeout(onClose, 220)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: shown ? 'rgba(10,16,30,0.45)' : 'rgba(10,16,30,0)',
        backdropFilter: shown ? 'blur(6px)' : 'blur(0px)',
        transition: 'background 0.25s ease, backdrop-filter 0.25s ease',
        pointerEvents: closing ? 'none' : 'auto',
      }}
      onClick={handleClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Détail"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background: '#F8FAFF',
          boxShadow: '0 32px 96px rgba(10,16,30,0.32), 0 8px 24px rgba(10,16,30,0.12)',
          transform: shown ? 'scale(1)' : 'scale(0.82)',
          opacity: shown ? 1 : 0,
          transition: shown
            ? 'transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.22s ease'
            : 'transform 0.2s cubic-bezier(0.4, 0, 1, 1), opacity 0.18s ease',
          transformOrigin: 'center center',
        }}
        onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b"
          style={{ background: '#F8FAFF', borderColor: '#E8EDFB' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${BLUE}, #3A5AEE)` }}>{initiale}</div>
            <div>
              <p className="font-bold text-[14px] text-gray-900 leading-tight">{clientNom}</p>
              <p className="text-[11px] text-gray-500">{bType} · {bLoc}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: (urgente ? '#DC2626' : sColor) + '18', color: urgente ? '#DC2626' : sColor }}>
              {urgente ? '⚡ Urgent' : sLabel}
            </span>
            <button onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-700 transition-colors"
              style={{ background: '#EEF1FA' }}>✕</button>
          </div>
        </div>

        <div className="p-5 space-y-3">

          {/* ── Bannière urgence / échouée ── */}
          {urgente && mins !== null && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold"
              style={{ background: '#FEF2F2', borderColor: '#FECACA', color: 'var(--tx-red)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Créneau dans {mins < 60 ? `${mins} min` : `${Math.round(mins / 60)}h`} — à traiter d'urgence
            </div>
          )}
          {echouee && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold"
              style={{ background: '#FEF2F2', borderColor: '#FECACA', color: 'var(--tx-red)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
              </svg>
              Cette visite ne s'est pas tenue.
            </div>
          )}
          {v.statut === 'contre_proposee' && !echouee && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold"
              style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#B45309' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Contre-proposition envoyée — en attente du client
            </div>
          )}

          {/* ── Date ── */}
          <div className="rounded-xl p-4 border" style={{ background: '#fff', borderColor: '#E8EDFB' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Créneau demandé</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: BLUE + '12' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900 capitalize text-[15px]">{dateStr}</p>
                {heureStr && <p className="text-sm text-gray-500">{heureStr}</p>}
              </div>
            </div>
          </div>

          {/* ── Frais + paiement ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4 border" style={{ background: '#fff', borderColor: '#E8EDFB' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Frais de visite</p>
              <p className="font-black text-[18px]" style={{ color: BLUE }}>
                {Number(v.frais_visite) > 0 ? fmtPrix(v.frais_visite) : 'Gratuit'}
              </p>
            </div>
            <div className="rounded-xl p-4 border" style={{ background: '#fff', borderColor: '#E8EDFB' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Paiement</p>
              <p className="font-black text-[18px]" style={{ color: v.paiement_effectue ? '#16A34A' : '#9CA3AF' }}>
                {v.paiement_effectue ? '✓ Payé' : 'En attente'}
              </p>
            </div>
          </div>

          {/* ── Contact (si numeros_partages) ── */}
          {!echouee && v.statut === 'confirmee' && v.numeros_partages && contactNumero && (
            <div className="flex items-center gap-3 p-4 rounded-xl border"
              style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#25D36620' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-green-600">
                  {mins != null && mins >= 0 ? `Visite dans ${mins} min — ` : ''}Contact client
                </p>
                <p className="font-bold text-gray-900">{contactNumero}</p>
              </div>
              <a href={`https://wa.me/${contactNumero.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl text-white text-xs font-bold flex-shrink-0"
                style={{ background: '#25D366' }}>
                WhatsApp
              </a>
            </div>
          )}
          {v.numeros_partages === false && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm"
              style={{ background: '#F8FAFF', borderColor: '#E8EDFB', color: '#6B7280' }}>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="5" y="11" width="14" height="9" rx="2"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4"/>
              </svg>
              Contact partagé 30 min avant la visite
            </div>
          )}

          {/* ── Avis client (si effectuée) ── */}
          {v.statut === 'effectuee' && v.feedback_donne && v.note_client != null && (
            <div className="rounded-xl p-4 border" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-amber-600">Avis du client</p>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(n => (
                    <svg key={n} viewBox="0 0 24 24" className="w-3.5 h-3.5"
                      fill={n <= v.note_client ? '#B45309' : 'none'} stroke="#F59E0B" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                  ))}
                </div>
              </div>
              {v.feedback_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {v.feedback_tags.map((t: string) => (
                    <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: '#F59E0B18', color: 'var(--tx-amber)' }}>{t}</span>
                  ))}
                </div>
              )}
              {v.feedback_libre && (
                <p className="text-xs text-gray-500 italic">« {v.feedback_libre} »</p>
              )}
            </div>
          )}

          {/* ── Contre-proposition ── */}
          {cpId === v.id && (
            <div className="rounded-xl p-4 border" style={{ background: '#fff', borderColor: '#E8EDFB' }}>
              <p className="font-bold text-gray-800 mb-3 text-sm">Proposer un autre créneau</p>
              <div className="space-y-2 mb-3">
                <input type="date" value={cpDate} onChange={e => setCpDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  max={new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border text-gray-800"
                  style={{ borderColor: '#CBD5E1', background: '#F8FAFF' }}
                  onFocus={e => (e.target.style.borderColor = BLUE)}
                  onBlur={e => (e.target.style.borderColor = '#CBD5E1')} />
                <input type="time" value={cpTime} onChange={e => setCpTime(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border text-gray-800"
                  style={{ borderColor: '#CBD5E1', background: '#F8FAFF' }}
                  onFocus={e => (e.target.style.borderColor = BLUE)}
                  onBlur={e => (e.target.style.borderColor = '#CBD5E1')} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCpId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border text-gray-600"
                  style={{ borderColor: '#E2E8F0', background: '#F8FAFF' }}>Annuler</button>
                <button onClick={onContrePropose} disabled={!cpDate || !cpTime || submitting}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${BLUE}, #3A5AEE)` }}>
                  {submitting ? 'Envoi…' : 'Envoyer'}
                </button>
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-2 pt-1 pb-1 flex-wrap">
            <button onClick={() => onChat(v)} disabled={chatLoadingId === v.id}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold disabled:opacity-50 transition-all"
              style={{ borderColor: BLUE + '40', color: BLUE, background: BLUE + '08' }}>
              {chatLoadingId === v.id
                ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <IcChat />}
              Chat
            </button>
            {peutConfirmer && (
              <button onClick={() => onConfirm(v.id)}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all"
                style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)', boxShadow: '0 4px 14px rgba(22,163,74,0.25)' }}>
                Confirmer ✓
              </button>
            )}
            {v.statut === 'en_attente' && !echouee && !isDatePassee(v) && cpId !== v.id && (
              <button onClick={() => setCpId(v.id)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all text-gray-700"
                style={{ borderColor: '#CBD5E1', background: '#F8FAFF' }}>
                Autre créneau
              </button>
            )}
            {v.statut === 'confirmee' && !echouee && (
              confirmEffectuee ? (
                <div className="flex items-center gap-2 flex-1">
                  <button onClick={() => { onMarquerEffectuee(v.id); setConfirmEffectuee(false) }} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: '#4CAF50' }}>Confirmer</button>
                  <button onClick={() => setConfirmEffectuee(false)} className="py-2.5 px-4 rounded-xl border text-sm font-semibold" style={{ borderColor: '#CBD5E1', color: '#6B7280' }}>Annuler</button>
                </div>
              ) : (
                <button onClick={() => setConfirmEffectuee(true)}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold"
                  style={{ background: `linear-gradient(135deg, ${BLUE}, #3A5AEE)` }}>
                  Marquer effectuée
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

