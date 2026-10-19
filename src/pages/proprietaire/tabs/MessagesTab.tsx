import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { chatApi } from '../../../api/chatApi'
import ChatThread from '../../conversations/ChatThread'
import { IcMessagesNav } from './icons'
import { BLUE, MSG_AVATAR_COLORS, formatConvTime } from './shared'
import type { Conversation } from '../../../types/api'

// ─── Tab: Messages ────────────────────────────────────────────────────────────
// Reprend chatApi + ChatThread directement (au lieu de naviguer vers la page
// /conversations globale) pour que la sidebar et le topbar du dashboard
// propriétaire restent affichés pendant la messagerie.
export function MessagesTab({ initialConvId, initialDraft }: { initialConvId?: number | null; initialDraft?: string | null }) {
  const { user } = useAuth()
  const [convs, setConvs] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeConvId, setActiveConvId] = useState<number | null>(initialConvId ?? null)
  // Résultats de recherche dans le CONTENU des messages (endpoint /chat/search,
  // équivalent de ConversationsScreen._doSearch côté mobile — jusqu'ici jamais
  // appelé côté web, qui ne filtrait que le nom du contact localement).
  const [messageHits, setMessageHits] = useState<any[]>([])
  const [searchingMsgs, setSearchingMsgs] = useState(false)
  const [hoveredConvId, setHoveredConvId] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    chatApi.conversations()
      .then(d => setConvs(Array.isArray(d) ? d : d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const q = search.trim()
    if (q.length < 2) { setMessageHits([]); return }
    setSearchingMsgs(true)
    const t = setTimeout(() => {
      chatApi.search(q)
        .then(d => setMessageHits(Array.isArray(d?.messages) ? d.messages : []))
        .catch(() => setMessageHits([]))
        .finally(() => setSearchingMsgs(false))
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const getOther = (conv: any) => {
    if (!user || !Array.isArray(conv.participants)) return null
    return conv.participants.find((p: any) => p.id !== user.id) || conv.participants[0] || null
  }

  const filtered = (() => {
    const q = search.trim().toLowerCase()
    if (!q) return convs
    return convs.filter(conv => {
      const other = getOther(conv)
      const name = `${other?.prenom || ''} ${other?.nom || ''} ${other?.pseudonyme || ''}`.toLowerCase()
      return name.includes(q)
    })
  })()

  return (
    <div className="flex flex-1 overflow-hidden" style={{ background: 'var(--p-deep)' }}>
      {/* Liste — masquée sur mobile/tablette quand une conversation est ouverte */}
      <div className={`w-full md:w-[300px] flex-shrink-0 flex-col overflow-hidden ${activeConvId != null ? 'hidden md:flex' : 'flex'}`}
        style={{ background: 'var(--p-card)', borderRight: '1px solid var(--p-border)' }}>
        <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid var(--p-border)' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-0.5" style={{ color: 'var(--p-muted)' }}>CHAT</p>
            <h2 className="text-[20px] font-black tracking-tight" style={{ color: 'var(--p-text)' }}>
              Messages
              {!loading && <span className="ml-2 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold text-white align-middle" style={{ background: BLUE }}>{convs.length}</span>}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--p-border)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--p-muted)', flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une conversation…"
            className="flex-1 min-w-0 border-none outline-none bg-transparent text-[13px]"
            style={{ color: 'var(--p-text)' }} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-2">{[1, 2, 3].map(n => <div key={n} className="h-[64px] rounded-xl animate-pulse" style={{ background: 'var(--p-border)' }} />)}</div>
          ) : filtered.length === 0 && messageHits.length === 0 && !searchingMsgs ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: BLUE + '14' }}>
                <span style={{ color: BLUE }}><IcMessagesNav /></span>
              </div>
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--p-text)' }}>{search ? 'Aucun résultat' : 'Aucune conversation'}</p>
              <p className="text-xs" style={{ color: 'var(--p-muted)' }}>{search ? `Rien ne correspond à « ${search} ».` : 'Vos échanges avec vos clients apparaîtront ici.'}</p>
            </div>
          ) : <>
          {search.trim().length >= 2 && filtered.length > 0 && (
            <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-muted)' }}>Conversations</p>
          )}
          {filtered.map(conv => {
            const other = getOther(conv)
            const name = other?.prenom || other?.pseudonyme || other?.nom || 'Contact'
            const initiale = (name[0] || '?').toUpperCase()
            const lastMsg = conv.dernierMessage
            const lastContenu = lastMsg?.contenu || (conv.bien ? "À propos d'un bien" : 'Nouvelle conversation')
            const unread = conv.nonLus || 0
            const hasUnread = unread > 0
            const timeStr = formatConvTime(lastMsg?.created_at)
            const isActive = conv.id === activeConvId
            return (
              <button key={conv.id} onClick={() => setActiveConvId(conv.id)}
                className="w-full flex items-center gap-2.5 px-4 py-3 transition-colors text-left"
                style={{ background: isActive ? BLUE + '0C' : 'transparent', borderLeft: isActive ? `3px solid ${BLUE}` : '3px solid transparent' }}>
                <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: MSG_AVATAR_COLORS[Math.abs(other?.id ?? conv.id) % MSG_AVATAR_COLORS.length] }}>
                  <span className="text-white font-bold text-xs">{initiale}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={`text-[13px] truncate ${hasUnread ? 'font-bold' : 'font-semibold'}`} style={{ color: 'var(--p-text)' }}>{name}</p>
                    {timeStr && <p className="text-[11px] flex-shrink-0" style={{ color: 'var(--p-muted)' }}>{timeStr}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-xs truncate flex-1 ${hasUnread ? 'font-medium' : ''}`} style={{ color: hasUnread ? 'var(--p-text)' : 'var(--p-muted)' }}>{lastContenu}</p>
                    {hasUnread && (
                      <div className="min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BLUE }}>
                        <span className="text-white text-[10px] font-bold">{unread}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
          {search.trim().length >= 2 && (searchingMsgs || messageHits.length > 0) && (
            <>
              <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-muted)' }}>Messages</p>
              {searchingMsgs ? (
                <p className="px-4 py-2 text-xs" style={{ color: 'var(--p-muted)' }}>Recherche…</p>
              ) : messageHits.map(hit => {
                const other = hit.conversation?.participants?.find((p: any) => p.id !== user?.id) || hit.conversation?.participants?.[0]
                const name = other?.prenom || other?.pseudonyme || other?.nom || 'Contact'
                const initiale = (name[0] || '?').toUpperCase()
                return (
                  <button key={hit.id} onClick={() => setActiveConvId(hit.conversationId)}
                    className="w-full flex items-center gap-2.5 px-4 py-3 transition-colors text-left"
                    style={{ background: hoveredConvId === hit.id ? 'var(--p-border)' : 'transparent' }}
                    onMouseEnter={() => setHoveredConvId(hit.id)}
                    onMouseLeave={() => setHoveredConvId(null)}>
                    <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: MSG_AVATAR_COLORS[Math.abs(other?.id ?? hit.conversationId) % MSG_AVATAR_COLORS.length] }}>
                      <span className="text-white font-bold text-xs">{initiale}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-[13px] truncate font-semibold" style={{ color: 'var(--p-text)' }}>{name}</p>
                        <p className="text-[11px] flex-shrink-0" style={{ color: 'var(--p-muted)' }}>{formatConvTime(hit.created_at)}</p>
                      </div>
                      <p className="text-xs truncate" style={{ color: 'var(--p-muted)' }}>{hit.contenu}</p>
                    </div>
                  </button>
                )
              })}
            </>
          )}
          </>}
        </div>
      </div>

      {/* Fil de discussion */}
      <div className={`flex-1 flex-col overflow-hidden ${activeConvId != null ? 'flex' : 'hidden md:flex'}`}>
        {activeConvId != null ? (
          <ChatThread convId={activeConvId} onBack={() => setActiveConvId(null)} initialDraft={initialDraft ?? undefined} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8" style={{ background: 'var(--p-deep)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: BLUE + '12' }}>
              <span style={{ color: BLUE }}><IcMessagesNav /></span>
            </div>
            <p className="text-[15px] font-bold mb-1.5" style={{ color: 'var(--p-text)' }}>Sélectionnez une conversation</p>
            <p className="text-[13px] max-w-xs" style={{ color: 'var(--p-muted)' }}>Choisissez un contact dans la liste pour afficher les messages.</p>
          </div>
        )}
      </div>
    </div>
  )
}

