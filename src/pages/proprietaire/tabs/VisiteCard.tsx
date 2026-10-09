import { useState } from 'react'
import { IcHome, IcCal, IcChat, BLUE, DARK_BLUE, bienLabel, statutVisite } from './shared'
import type { Tab } from './shared'

// ─── Tab: Réservations ────────────────────────────────────────────────────────
export function isEchouee(v: any): boolean {
  if (v.statut === 'effectuee' || v.statut === 'annulee') return false
  const raw = v.date_contre_proposee || v.date_souhaitee
  if (!raw) return false
  return new Date(raw).getTime() < Date.now()
}

/** Date de la visite déjà passée (sans le délai de grâce de isEchouee) — désactive Confirmer. */
export function isDatePassee(v: any): boolean {
  const raw = v.date_contre_proposee || v.date_souhaitee
  if (!raw) return false
  return new Date(raw).getTime() < Date.now()
}

/** Minutes avant la visite (peut être négatif si déjà passée) — équivalent de
 *  minutesAvantVisite côté mobile, utilisé pour le compte à rebours WhatsApp
 *  et le bandeau d'urgence. */
export function minutesAvant(v: any, now: number): number | null {
  const raw = v.date_confirmee || v.date_contre_proposee || v.date_souhaitee
  if (!raw) return null
  return Math.round((new Date(raw).getTime() - now) / 60000)
}
/** Visite imminente à traiter d'urgence (< 125 min, comme _buildAlerteUrgente mobile). */
export function isUrgente(v: any, now: number): boolean {
  if (v.statut !== 'en_attente' && v.statut !== 'confirmee') return false
  const m = minutesAvant(v, now)
  return m != null && m >= 0 && m <= 125
}

function VisiteCard({ v, chatLoadingId, onChat, onConfirm, onMarquerEffectuee, cpId, setCpId, cpDate, setCpDate, cpTime, setCpTime, submitting, onContrePropose, now }: {
  v: any
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
  const { label, color } = echouee ? { label: 'Échouée', color: '#DC2626' } : statutVisite(v.statut)
  // L'identité du client n'est jamais masquée côté API (nom/prénom toujours
  // renvoyés) — miroir exact de proprietaire_reservations.dart, qui affiche
  // le prénom réel sans condition de statut.
  const nom = v.client?.prenom || v.client?.nom || 'Client'
  const init = nom ? nom[0].toUpperCase() : 'C'
  const bType = v.bien ? bienLabel(v.bien) : ''
  const bLoc = v.bien?.localisation ? `${v.bien.localisation.quartier || ''} ${v.bien.localisation.ville || ''}`.trim() : '—'
  const dateStr = v.date_souhaitee
    ? new Date(v.date_souhaitee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
      + ' à ' + new Date(v.date_souhaitee).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—'
  const contactNumero = v.client?.numero_whatsapp || v.client?.telephone
  return (
    <div className="card-soft rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-[13px] flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${BLUE}, ${DARK_BLUE})` }}>{init}</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#F0EDE8] text-sm">{nom}</p>
          {v.numeros_partages ? (
            <div className="flex items-center gap-1">
              <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs" style={{ color: '#25D366' }}>Infos de visite disponibles</p>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <svg className="w-2.5 h-2.5 flex-shrink-0 text-[#8A9BB5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><rect x="5" y="11" width="14" height="9" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4" /></svg>
              <p className="text-xs text-[#8A9BB5]">Contact partagé à -30min</p>
            </div>
          )}
        </div>
        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex-shrink-0" style={{ background: color + '20', color }}>{label}</span>
      </div>
      {echouee && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border mb-3 text-xs font-semibold" style={{ background: '#EF444410', borderColor: '#EF444430', color: 'var(--tx-red)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
          Cette visite ne s'est pas tenue.
        </div>
      )}
      {!echouee && isUrgente(v, now) && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border mb-3 text-xs font-semibold" style={{ background: '#F4433610', borderColor: '#F4433630', color: '#F44336' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Créneau dans {minutesAvant(v, now)} min — à traiter d'urgence
        </div>
      )}
      <div className="bg-[#0B1C30] rounded-xl p-3 mb-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span style={{ color: BLUE }}><IcHome /></span>
          <p className="text-xs font-medium text-[#F0EDE8] truncate">{bType} — {bLoc}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#8A9BB5]"><IcCal /></span>
          <p className="text-xs text-[#8A9BB5]">Demandé pour : {dateStr}</p>
        </div>
      </div>
      {v.statut === 'contre_proposee' && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-3 text-xs font-medium" style={{ background: '#E67E2210', borderColor: '#E67E2240', color: 'var(--tx-amber)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Contre-proposition envoyée. En attente du client.
        </div>
      )}
      {v.statut === 'effectuee' && v.feedback_donne && v.note_client != null && (
        <div className="rounded-xl p-3 mb-3" style={{ background: '#F59E0B10', border: '1px solid #F59E0B30' }}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold" style={{ color: 'var(--tx-amber)' }}>Avis du client</p>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(n => (
                <svg key={n} viewBox="0 0 24 24" className="w-3.5 h-3.5" fill={n <= v.note_client ? '#B45309' : 'none'} stroke="#F59E0B" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              ))}
            </div>
          </div>
          {v.feedback_tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {v.feedback_tags.map((t: string) => (
                <span key={t} className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: '#F59E0B18', color: 'var(--tx-amber)' }}>{t}</span>
              ))}
            </div>
          )}
          {v.feedback_libre && (
            <p className="text-xs text-[#8A9BB5] italic">« {v.feedback_libre} »</p>
          )}
        </div>
      )}
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
            <p className="text-[10px] font-semibold" style={{ color: '#25D366' }}>
              {(() => { const m = minutesAvant(v, now); return m != null && m >= 0 ? `Visite dans ${m} min — Contact client` : 'Contact client' })()}
            </p>
            <p className="text-sm font-bold text-[#F0EDE8]">{contactNumero}</p>
          </div>
          <a href={`https://wa.me/${contactNumero.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-white text-[11px] font-bold flex-shrink-0" style={{ background: '#25D366' }}>
            WhatsApp
          </a>
        </div>
      )}
      <div className="flex gap-2">
        {echouee ? (
          <button onClick={() => onChat(v)} disabled={chatLoadingId === v.id}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-bold disabled:opacity-50" style={{ background: '#DC2626' }}>
            <IcChat /> {chatLoadingId === v.id ? '…' : 'Contacter le client'}
          </button>
        ) : <>
        <button onClick={() => onChat(v)} disabled={chatLoadingId === v.id}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold disabled:opacity-50" style={{ borderColor: BLUE + '50', color: BLUE, background: BLUE + '10' }}>
          <IcChat /> {chatLoadingId === v.id ? '…' : 'Chat'}
        </button>
        {v.statut === 'en_attente' && <>
          <button onClick={() => setCpId(v.id)} className="flex-1 py-2 rounded-xl border text-xs font-bold text-center" style={{ borderColor: BLUE + '80', color: BLUE }}>Autre créneau</button>
          <button onClick={() => onConfirm(v.id)} disabled={isDatePassee(v)}
            className="flex-1 py-2 rounded-xl text-white text-xs font-bold disabled:cursor-not-allowed"
            style={{ background: isDatePassee(v) ? 'rgba(158,158,158,0.5)' : '#4CAF50' }}>
            {isDatePassee(v) ? 'Date dépassée' : 'Confirmer'}
          </button>
        </>}
        {v.statut === 'confirmee' && (
          confirmEffectuee ? (
            <div className="flex items-center gap-1 flex-1">
              <button onClick={() => { onMarquerEffectuee(v.id); setConfirmEffectuee(false) }} className="flex-1 py-2 rounded-xl text-white text-xs font-bold" style={{ background: '#4CAF50' }}>Confirmer</button>
              <button onClick={() => setConfirmEffectuee(false)} className="py-2 px-3 rounded-xl text-xs font-bold" style={{ background: '#1A3355', color: '#6B7280' }}>✕</button>
            </div>
          ) : (
            <button onClick={() => setConfirmEffectuee(true)} className="flex-1 py-2 rounded-xl text-white text-xs font-bold" style={{ background: BLUE }}>Marquer effectuée</button>
          )
        )}
        </>}
      </div>
      {cpId === v.id && (
        <div className="mt-3 pt-3 border-t border-[#1A3355]">
          <p className="text-sm font-bold text-[#F0EDE8] mb-3">Proposer un autre créneau</p>
          <div className="space-y-2 mb-3">
            <input type="date" value={cpDate} onChange={e => setCpDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              max={new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)}
              className="w-full bg-[#112440] rounded-xl px-3 py-2.5 text-sm outline-none border border-[#1A3355] text-[#F0EDE8] focus:border-[#4B6BFF]" />
            <input type="time" value={cpTime} onChange={e => setCpTime(e.target.value)}
              className="w-full bg-[#112440] rounded-xl px-3 py-2.5 text-sm outline-none border border-[#1A3355] text-[#F0EDE8] focus:border-[#4B6BFF]" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCpId(null)} className="flex-1 py-2.5 rounded-xl border border-[#1A3355] text-sm font-semibold text-[#8A9BB5] bg-[#0B1C30]">Annuler</button>
            <button onClick={onContrePropose} disabled={!cpDate || !cpTime || submitting}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: BLUE }}>
              {submitting ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

