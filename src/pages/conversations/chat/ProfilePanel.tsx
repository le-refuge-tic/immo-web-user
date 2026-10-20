import { avatarGrad, initial, type ChatColors } from './helpers'
import { XIcon } from './icons'
import type { ChatConversation, ChatUser } from '../../../types/chat-ui'

interface ProfilePanelProps {
  onClose: () => void
  colors: ChatColors
  other: ChatUser | null
  otherName: string
  role: string
  isVerified: boolean
  isOnline: boolean
  conv: ChatConversation | null
  bienTypeLabel: string | null
  bienLoc: string | null | undefined
  hoveredSettingsIdx: number | null
  onHoverSettings: (i: number | null) => void
  onOpenBien: (bienId: number) => void
}

/* ── Panneau profil (desktop droit / mobile drawer) ── */
export function ProfilePanel({
  onClose, colors, other, otherName, role, isVerified, isOnline, conv, bienTypeLabel, bienLoc,
  hoveredSettingsIdx, onHoverSettings, onOpenBien,
}: ProfilePanelProps) {
  const { tp, ts, tm, profileBg, profileBdr, divider, iconBtn, menuHov } = colors
  const bienId = conv?.bien?.id
  return (
    <div className="h-full flex flex-col" style={{ background: profileBg, borderLeft: `1px solid ${profileBdr}` }}>
      {/* Header profil */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: `1px solid ${divider}` }}>
        <p className="text-[13px] font-bold uppercase tracking-widest" style={{ color: tm }}>Infos du contact</p>
        <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-colors hover:opacity-80" style={{ background: iconBtn, color: ts }}>
          <XIcon />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-auto px-5 py-5 space-y-5">
        {/* Avatar grand */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg" style={{ background: avatarGrad(other?.id ?? 0) }}>
            <span className="text-white font-extrabold text-2xl">{initial(otherName)}</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5">
              <p className="text-[16px] font-bold" style={{ color: tp }}>{otherName}</p>
              {isVerified && (
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#4160F2" aria-label="Vérifié">
                  <path d="M12 2l2.2 1.6 2.7-.3 1 2.5 2.3 1.4-.6 2.7 1.4 2.3-1.9 2 .1 2.7-2.6.8-1.4 2.3-2.6-.7L12 22l-2-1.4-2.6.7-1.4-2.3-2.6-.8.1-2.7-1.9-2 1.4-2.3-.6-2.7 2.3-1.4 1-2.5 2.7.3z"/>
                  <path d="M10.6 14.6l-2.2-2.2 1.1-1.1 1.1 1.1 3.3-3.3 1.1 1.1z" fill="#fff"/>
                </svg>
              )}
            </div>
            {role && (
              <span className="inline-block mt-1 px-2.5 py-1 rounded-full text-caption font-bold" style={{ background: 'rgba(75,107,255,0.12)', color: 'var(--tx-blue)' }}>
                {role}
              </span>
            )}
          </div>
          {/* Présence — affichée seulement si connue */}
          {isOnline && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-[12px] font-medium" style={{ color: ts }}>En ligne</span>
            </div>
          )}
        </div>

        {/* Rôle + Bien concerné */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${divider}` }}>
          {/* Rôle */}
          <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${divider}` }}>
            <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--tx-blue)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <div className="min-w-0">
              <p className="text-micro font-bold uppercase tracking-widest mb-0.5" style={{ color: ts }}>Rôle</p>
              <p className="text-[13px] font-semibold" style={{ color: role ? tp : ts }}>{role || 'Non renseigné'}</p>
            </div>
          </div>
          {/* Bien concerné */}
          <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: conv?.bien?.id ? `1px solid ${divider}` : undefined }}>
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--tx-blue)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-micro font-bold uppercase tracking-widest mb-0.5" style={{ color: ts }}>Bien concerné</p>
              {conv?.bien?.id ? (
                <>
                  <p className="text-[13px] font-semibold" style={{ color: tp }}>{bienTypeLabel || 'Bien'}</p>
                  {bienLoc && <p className="text-caption mt-0.5" style={{ color: ts }}>{bienLoc}</p>}
                </>
              ) : (
                <p className="text-[13px] font-semibold" style={{ color: ts }}>Non renseigné</p>
              )}
            </div>
          </div>
          {/* Lien vers le bien */}
          {bienId && (
            <button onClick={() => onOpenBien(bienId)}
              className="w-full flex items-center justify-between px-4 py-2.5 cursor-pointer transition-opacity hover:opacity-80"
              style={{ color: 'var(--tx-blue)' }}>
              <span className="text-[12px] font-bold">Voir le bien</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${divider}` }}>
          {[
            { label: 'Mode silencieux', action: () => {}, danger: false },
            { label: 'Bloquer ce contact', action: () => {}, danger: true },
            { label: 'Signaler', action: () => {}, danger: true },
          ].map(({ label, action, danger }, i, arr) => (
            <button key={label} onClick={action}
              className="w-full text-left px-4 py-3.5 text-[13.5px] font-medium transition-colors cursor-pointer flex items-center justify-between"
              style={{ color: danger ? '#DC2626' : tp, borderBottom: i < arr.length - 1 ? `1px solid ${divider}` : 'none', background: hoveredSettingsIdx === i ? menuHov : 'transparent' }}
              onMouseEnter={() => onHoverSettings(i)}
              onMouseLeave={() => onHoverSettings(null)}>
              {label}
              {!danger && <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
