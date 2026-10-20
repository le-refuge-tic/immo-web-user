import type { RefObject } from 'react'
import { dateSep, sameDay, timeLabel, type ChatColors } from './helpers'
import { MsgStatus } from './icons'
import { SlotBubble } from './SlotBubble'
import type { ChatMessage } from '../../../types/chat-ui'

interface MessageListProps {
  scrollRef: RefObject<HTMLDivElement | null>
  bottomRef: RefObject<HTMLDivElement | null>
  onScroll: () => void
  /** Clic dans la zone : ferme les menus ouverts. */
  onBackgroundClick: () => void
  loading: boolean
  visible: ChatMessage[]
  userId: number | undefined
  isDark: boolean
  colors: ChatColors
  menuId: number | null
  /** Ouvre (id + position) ou ferme (null) le menu contextuel d'un message. */
  onToggleMenu: (id: number | null, pos: { top: number; right: number } | null) => void
  onComplain: (msg: ChatMessage) => void
  slot: {
    bienId: number | undefined
    isClientRole: boolean
    paying: boolean
    onRepondre: (m: ChatMessage, r: 'accepted' | 'declined' | 'countered') => void
    onPayer: () => void
  }
}

export function MessageList({
  scrollRef, bottomRef, onScroll, onBackgroundClick, loading, visible, userId, isDark, colors,
  menuId, onToggleMenu, onComplain, slot,
}: MessageListProps) {
  const { tp, ts, tm, sepBg, bubbleMeBg, bubbleOtherBg, bubbleOtherBdr } = colors
  return (
    <>
      {/* ── Messages ── */}
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- un clic dans la zone ferme les menus ouverts ; Échap les ferme au clavier (MenuPopover) */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 scrollbar-auto relative"
        onClick={onBackgroundClick}>

        {/* Liste messages */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="w-7 h-7 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: 'var(--c-brand)', borderTopColor: 'transparent' }} />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(75,107,255,0.10)' }}>
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#4160F2" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <p className="text-[13px] font-semibold" style={{ color: tm }}>Démarrez la conversation</p>
          </div>
        ) : visible.map((msg, i) => {
          const isMe = msg.sender_id === userId
          const sep = i === 0 || !sameDay(visible[i - 1].created_at, msg.created_at)
          const prevIsMe = i > 0 && visible[i - 1].sender_id === userId && visible[i - 1].type !== 'slot_proposal'
          const grouped = !sep && isMe === prevIsMe

          if (msg.type === 'slot_proposal') {
            return (
              <div key={msg.id} id={`msg-${msg.id}`}>
                {sep && <div className="flex items-center gap-3 my-3"><div className="flex-1 h-px" style={{ background: sepBg }} /><span className="text-caption px-2 font-medium" style={{ color: tm }}>{dateSep(msg.created_at)}</span><div className="flex-1 h-px" style={{ background: sepBg }} /></div>}
                <SlotBubble m={msg} userId={userId} isDark={isDark} tp={tp} tm={tm} bienId={slot.bienId} isClientRole={slot.isClientRole}
                  paying={slot.paying} onRepondre={slot.onRepondre} onPayer={slot.onPayer} />
              </div>
            )
          }

          const isSupprime = msg.supprime_pour_tous
          return (
            <div key={msg.id} id={`msg-${msg.id}`}>
              {sep && <div className="flex items-center gap-3 my-3"><div className="flex-1 h-px" style={{ background: sepBg }} /><span className="text-caption px-2 font-medium" style={{ color: tm }}>{dateSep(msg.created_at)}</span><div className="flex-1 h-px" style={{ background: sepBg }} /></div>}

              <div className={`flex group items-end gap-1 ${isMe ? 'justify-end' : 'justify-start'} ${grouped ? 'mb-[3px]' : 'mb-1'}`}>
                <div className="relative max-w-[78%] sm:max-w-[62%] md:max-w-[54%]">

                  {isSupprime ? (
                    <div className="px-2.5 py-1.5 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px dashed ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}` }}>
                      <p className="text-[12.5px] italic" style={{ color: tm }}>Message supprimé</p>
                      <button onClick={e => { e.stopPropagation(); onComplain(msg) }}
                        className="text-caption underline mt-0.5 cursor-pointer" style={{ color: 'var(--tx-blue)' }}>En savoir plus</button>
                      <p className="text-micro mt-0.5" style={{ color: tm }}>{timeLabel(msg.created_at)}</p>
                    </div>
                  ) : (
                    <div className={`${isMe ? 'rounded-xl rounded-br-[4px]' : 'rounded-xl rounded-bl-[4px]'} ${grouped && isMe ? 'rounded-tr-[6px]' : ''} ${grouped && !isMe ? 'rounded-tl-[6px]' : ''}`}
                      style={isMe
                        ? { background: bubbleMeBg, padding: '6px 10px' }
                        : { background: bubbleOtherBg, border: `1px solid ${bubbleOtherBdr}`, padding: '6px 10px', color: tp }
                      }>
                      {/* Citation */}
                      {msg.reply_to_contenu && (
                        <div className="text-[11.5px] px-2 py-1 rounded-lg mb-1 border-l-2 line-clamp-2"
                          style={isMe
                            ? { borderLeftColor: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }
                            : { borderLeftColor: 'var(--c-brand)', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(75,107,255,0.06)', color: ts }
                          }>
                          {msg.reply_to_contenu}
                        </div>
                      )}
                      {/* Texte */}
                      <p className="text-[14px] leading-[1.4] break-words" style={{ color: isMe ? 'rgb(255,255,255)' : tp }}>{msg.contenu}</p>
                      {/* Footer */}
                      <div className="flex items-center gap-1 -mt-0.5 justify-end">
                        {msg.modifie && <span className="text-[9.5px] italic" style={{ color: isMe ? 'rgba(255,255,255,0.50)' : tm }}>modifié ·</span>}
                        <span className="text-[9.5px]" style={{ color: isMe ? 'rgba(255,255,255,0.55)' : tm }}>{timeLabel(msg.created_at)}</span>
                        <MsgStatus status={msg.status} isMe={isMe} />
                      </div>
                    </div>
                  )}

                  {/* Bouton ⋯ visible au hover */}
                  {!isSupprime && (
                    <button onClick={e => {
                        e.stopPropagation()
                        const rect = e.currentTarget.getBoundingClientRect()
                        if (menuId === msg.id) onToggleMenu(null, null)
                        else onToggleMenu(msg.id, { top: rect.top, right: window.innerWidth - rect.right })
                      }}
                      className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                      style={{ background: isMe ? 'rgba(255,255,255,0.22)' : (isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.10)'), color: isMe ? 'rgb(255,255,255)' : ts, backdropFilter: 'blur(4px)' }}
                      aria-label="Options" aria-haspopup="menu" aria-expanded={menuId === msg.id}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} className="h-1" />
      </div>
    </>
  )
}
