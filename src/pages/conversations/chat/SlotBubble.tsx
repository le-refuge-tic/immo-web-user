import { fmtSlot, timeLabel } from './helpers'
import type { ChatMessage } from '../../../types/chat-ui'
import { withAlpha } from '../../../utils/color'

interface SlotBubbleProps {
  m: ChatMessage
  userId: number | undefined
  isDark: boolean
  tp: string
  tm: string
  /** Identifiant du bien de la conversation (le bouton « Payer » n'apparaît que s'il existe). */
  bienId: number | undefined
  isClientRole: boolean
  paying: boolean
  onRepondre: (m: ChatMessage, r: 'accepted' | 'declined' | 'countered') => void
  onPayer: () => void
}

/* ── Bulle slot ── */
export function SlotBubble({ m, userId, isDark, tp, tm, bienId, isClientRole, paying, onRepondre, onPayer }: SlotBubbleProps) {
  const isMe = m.sender_id === userId
  const status = m.metadata?.status || 'pending'
  const dt = m.metadata?.proposed_at ? new Date(m.metadata.proposed_at) : null
  const p: Record<string, { bg: string; accent: string; label: string }> = {
    accepted: { bg: 'rgba(34,197,94,0.10)', accent: 'var(--c-success)', label: 'Confirmé ✓' },
    declined:  { bg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', accent: '#94A3B8', label: 'Refusé' },
    countered: { bg: 'rgba(251,146,60,0.10)', accent: '#FB923C', label: 'Contre-proposé' },
    pending:   { bg: isMe ? 'rgba(75,107,255,0.12)' : (isDark ? 'rgba(32,32,48,0.9)' : 'rgba(255,255,255,0.9)'), accent: 'var(--tx-brand)', label: isMe ? 'En attente…' : 'Créneau proposé' },
  }
  const pal = p[status] || p.pending
  return (
    <div className={`flex mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className="rounded-2xl overflow-hidden max-w-[270px]" style={{ background: pal.bg, border: `1.5px solid ${withAlpha(pal.accent, '44')}` }}>
        <div className="px-3 pt-2.5 pb-0.5">
          <p className="text-micro font-bold uppercase tracking-widest mb-1.5" style={{ color: pal.accent }}>Créneau de visite</p>
          <p className="text-[13.5px] font-bold leading-snug" style={{ color: tp }}>{dt ? fmtSlot(dt) : '—'}</p>
          <p className="text-caption mt-1 font-medium" style={{ color: pal.accent }}>{pal.label}</p>
        </div>
        {!isMe && status === 'pending' && (
          <div className="px-3 pb-2.5 pt-2 flex flex-col gap-1.5" style={{ borderTop: `1px solid ${withAlpha(pal.accent, '22')}` }}>
            <div className="flex gap-1.5">
              <button onClick={() => onRepondre(m, 'accepted')} className="flex-1 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer" style={{ background: 'rgba(34,197,94,0.14)', color: 'var(--tx-green)' }}>Confirmer</button>
              <button onClick={() => onRepondre(m, 'declined')} className="flex-1 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer" style={{ background: 'rgba(239,68,68,0.10)', color: 'var(--tx-red)' }}>Rejeter</button>
            </div>
            <button onClick={() => onRepondre(m, 'countered')} className="w-full py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer" style={{ background: 'rgba(75,107,255,0.10)', color: 'var(--tx-blue)' }}>Autre date</button>
          </div>
        )}
        {status === 'accepted' && bienId && isClientRole && (
          <div className="px-3 pb-2.5 pt-2" style={{ borderTop: `1px solid ${withAlpha(pal.accent, '22')}` }}>
            <button onClick={onPayer} disabled={paying} className="w-full py-1.5 rounded-lg text-[12px] font-bold cursor-pointer disabled:opacity-50" style={{ background: 'rgba(34,197,94,0.14)', color: 'var(--tx-green)' }}>
              {paying ? '…' : 'Payer maintenant'}
            </button>
          </div>
        )}
        <div className="px-3 pb-2">
          <p className="text-micro text-right" style={{ color: tm }}>{timeLabel(m.created_at)}</p>
        </div>
      </div>
    </div>
  )
}
