import { useState, useEffect, useMemo } from 'react'
import { Outlet, useNavigate, useMatch } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { chatApi } from '../../api/chatApi'

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', '#16A34A', '#0891B2']
function avatarColor(id: number): string {
  return AVATAR_COLORS[Math.abs(id || 0) % AVATAR_COLORS.length]
}
function displayName(other: any): string {
  return other?.prenom || other?.pseudonyme || other?.nom || 'Contact'
}
function getInitiale(other: any): string {
  return (displayName(other)[0] || '?').toUpperCase()
}
function formatConvTime(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 86_400_000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 604_800_000) return d.toLocaleDateString('fr-FR', { weekday: 'short' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function useTokens(isDark: boolean) {
  return {
    bg:         isDark ? '#0F0F14'                    : '#F5F5F7',
    panelBg:    isDark ? 'rgba(22,22,34,0.97)'        : '#FFFFFF',
    panelBdr:   isDark ? 'rgba(255,255,255,0.07)'     : 'rgba(0,0,0,0.08)',
    headerBg:   isDark ? 'rgba(15,15,20,0.95)'        : 'rgba(255,255,255,0.95)',
    searchBg:   isDark ? 'rgba(255,255,255,0.05)'     : 'rgba(0,0,0,0.04)',
    searchBdr:  isDark ? 'rgba(255,255,255,0.08)'     : 'rgba(0,0,0,0.08)',
    activeBg:   isDark ? 'rgba(75,107,255,0.14)'      : 'rgba(75,107,255,0.08)',
    hoverBg:    isDark ? 'rgba(255,255,255,0.04)'     : 'rgba(0,0,0,0.03)',
    divider:    isDark ? 'rgba(255,255,255,0.06)'     : 'rgba(0,0,0,0.07)',
    textPrimary:isDark ? '#E8E8EF'                    : '#1D1D1F',
    textSecond: isDark ? 'rgba(255,255,255,0.55)'     : 'rgba(0,0,0,0.55)',
    textMuted:  isDark ? 'rgba(255,255,255,0.35)'     : 'rgba(0,0,0,0.35)',
    emptyBg:    isDark ? 'rgba(75,107,255,0.12)'      : 'rgba(75,107,255,0.08)',
    chatBg:     isDark ? 'rgba(18,18,28,0.6)'         : '#F8FAFC',
  }
}

const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const ChatBubbleIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#4B6BFF" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

export default function ConversationsPage() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const tk = useTokens(isDark)
  const navigate = useNavigate()
  const chatMatch = useMatch('/conversations/:id')
  const activeId = chatMatch?.params?.id ? Number(chatMatch.params.id) : null

  const [convs, setConvs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    chatApi.conversations()
      .then(d => setConvs(Array.isArray(d) ? d : d.data || []))
      .catch(e => setError(e?.message || 'Erreur'))
      .finally(() => setLoading(false))
  }, [])

  const getOther = (conv: any) => {
    if (!user || !Array.isArray(conv.participants)) return null
    return conv.participants.find((p: any) => p.id !== user.id) || conv.participants[0] || null
  }

  const filteredConvs = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return convs
    return convs.filter(conv => {
      const other = getOther(conv)
      const name = `${other?.prenom || ''} ${other?.nom || ''} ${other?.pseudonyme || ''}`.toLowerCase()
      return name.includes(q)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convs, search, user])

  const SearchRow = () => (
    <div className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0"
      style={{ borderBottom: `1px solid ${tk.divider}` }}>
      <span style={{ color: tk.textMuted }}><SearchIcon /></span>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher une conversation…"
        className="flex-1 min-w-0 border-none outline-none bg-transparent text-[13px]"
        style={{ color: tk.textPrimary }}
      />
    </div>
  )

  const ConvList = ({ list }: { list: any[] }) => {
    if (loading) return (
      <div className="p-4 space-y-2">
        {[1, 2, 3].map(n => <div key={n} className="skeleton h-[64px] rounded-xl" />)}
      </div>
    )

    if (error) return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <p className="text-[15px] font-bold mb-2" style={{ color: tk.textPrimary }}>Impossible de charger</p>
        <p className="text-xs mb-4" style={{ color: tk.textMuted }}>{error}</p>
        <button onClick={() => window.location.reload()}
          className="text-white px-6 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#4B6BFF' }}>
          Réessayer
        </button>
      </div>
    )

    if (list.length === 0) return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mb-3" style={{ background: tk.emptyBg }}>
          <ChatBubbleIcon />
        </div>
        <p className="text-sm font-bold mb-1" style={{ color: tk.textPrimary }}>
          {search ? 'Aucun résultat' : 'Aucune conversation'}
        </p>
        <p className="text-xs" style={{ color: tk.textMuted }}>
          {search ? `Rien ne correspond à « ${search} ».` : 'Vos échanges apparaîtront ici.'}
        </p>
      </div>
    )

    return (
      <div>
        {list.map((conv, idx) => {
          const other = getOther(conv)
          const name = displayName(other)
          const lastMsg = conv.dernierMessage
          const lastContenu = lastMsg?.contenu === '__supprime__'
            ? 'Message supprimé par l\'administrateur'
            : (lastMsg?.contenu || (conv.bien ? "À propos d'un bien" : 'Nouvelle conversation'))
          const unread = conv.nonLus || 0
          const hasUnread = unread > 0
          const timeStr = formatConvTime(lastMsg?.created_at)
          const isActive = conv.id === activeId

          return (
            <div key={conv.id}>
              <button
                onClick={() => navigate(`/conversations/${conv.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left cursor-pointer"
                style={{
                  background: isActive ? tk.activeBg : 'transparent',
                  borderLeft: isActive ? '3px solid #4B6BFF' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = tk.hoverBg }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: avatarColor(other?.id ?? conv.id) }}>
                  <span className="text-white font-bold text-xs">{getInitiale(other)}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-[13px] truncate font-semibold" style={{ color: hasUnread ? tk.textPrimary : tk.textSecond, fontWeight: hasUnread ? 700 : 600 }}>{name}</p>
                    {timeStr && <p className="text-[11px] flex-shrink-0" style={{ color: hasUnread ? '#4B6BFF' : tk.textMuted }}>{timeStr}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs truncate flex-1" style={{
                      color: hasUnread ? tk.textPrimary : tk.textMuted,
                      fontWeight: hasUnread ? 500 : 400,
                      fontStyle: lastMsg?.contenu === '__supprime__' ? 'italic' : 'normal',
                    }}>
                      {lastContenu}
                    </p>
                    {hasUnread && (
                      <div className="min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#4B6BFF' }}>
                        <span className="text-white text-[10px] font-bold">{unread > 9 ? '9+' : unread}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
              {idx < list.length - 1 && <div className="h-px ml-[62px]" style={{ background: tk.divider }} />}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-full" style={{ background: tk.bg }}>

      {/* ── MOBILE ── */}
      <div className="md:hidden">
        {activeId === null ? (
          <div>
            <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-shrink-0"
              style={{ background: tk.headerBg, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', borderBottom: `1px solid ${tk.panelBdr}` }}>
              <h1 className="text-lg font-bold" style={{ color: tk.textPrimary }}>Messages</h1>
              {!loading && convs.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white" style={{ background: '#4B6BFF' }}>
                  {convs.length}
                </span>
              )}
            </div>
            <div style={{ background: tk.panelBg }}>
              <SearchRow />
              <ConvList list={filteredConvs} />
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:flex h-[calc(100dvh-4rem)]">

        {/* Panneau gauche */}
        <div className="w-72 lg:w-80 flex-shrink-0 flex flex-col" style={{ background: tk.panelBg, borderRight: `1px solid ${tk.panelBdr}` }}>
          <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-shrink-0"
            style={{ borderBottom: `1px solid ${tk.divider}` }}>
            <h2 className="text-[15px] font-extrabold" style={{ color: tk.textPrimary }}>Messages</h2>
            {!loading && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white" style={{ background: '#4B6BFF' }}>
                {convs.length}
              </span>
            )}
          </div>
          <SearchRow />
          <div className="flex-1 overflow-y-auto scrollbar-auto">
            <ConvList list={filteredConvs} />
          </div>
        </div>

        {/* Panneau droit */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: tk.chatBg }}>
          {activeId !== null ? (
            <Outlet />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-4" style={{ background: tk.emptyBg }}>
                <ChatBubbleIcon />
              </div>
              <p className="text-[15px] font-bold mb-1.5" style={{ color: tk.textPrimary }}>Sélectionnez une conversation</p>
              <p className="text-[13px] max-w-xs" style={{ color: tk.textMuted }}>
                Choisissez un contact dans la liste pour afficher les messages.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
