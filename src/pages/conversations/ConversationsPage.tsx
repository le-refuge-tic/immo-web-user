import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useMatch } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { chatApi } from '../../api/chatApi'

const SIDEBAR = {
  background: 'rgba(255,255,255,0.60)',
  backdropFilter: 'blur(40px) saturate(160%)',
  WebkitBackdropFilter: 'blur(40px) saturate(160%)',
  borderRight: '1px solid rgba(0,0,0,0.07)',
} as const

function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (isToday) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function getInitiale(name: string): string {
  return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function ConversationsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const chatMatch = useMatch('/conversations/:id')
  const activeId = chatMatch?.params?.id ? Number(chatMatch.params.id) : null

  const [convs, setConvs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const ConvList = () => {
    if (loading) return (
      <div className="p-4 space-y-2">
        {[1, 2, 3].map(n => <div key={n} className="skeleton h-[72px] rounded-xl" />)}
      </div>
    )

    if (error) return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <p className="text-[15px] font-bold text-text-dark mb-2">Impossible de charger</p>
        <p className="text-xs text-text-grey mb-4">{error}</p>
        <button onClick={() => window.location.reload()}
          className="text-white px-6 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
          Réessayer
        </button>
      </div>
    )

    if (convs.length === 0) return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mb-3"
          style={{ background: 'rgba(75,107,255,0.1)' }}>
          <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm font-bold text-text-dark mb-1">Aucune conversation</p>
        <p className="text-xs text-text-grey">Vos échanges apparaîtront ici.</p>
      </div>
    )

    return (
      <div>
        {convs.map((conv, idx) => {
          const other = getOther(conv)
          const name = other?.pseudonyme || 'Contact'
          const lastMsg = conv.dernierMessage
          const lastContenu = lastMsg?.contenu || (conv.bien ? "À propos d'un bien" : 'Nouvelle conversation')
          const unread = conv.nonLus || 0
          const hasUnread = unread > 0
          const timeStr = formatTime(lastMsg?.created_at || '')
          const isActive = conv.id === activeId

          return (
            <div key={conv.id}>
              <button
                onClick={() => navigate(`/conversations/${conv.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left"
                style={{
                  background: isActive ? 'rgba(75,107,255,0.10)' : 'transparent',
                  borderLeft: isActive ? '3px solid #4B6BFF' : '3px solid transparent',
                }}
              >
                <div className="w-[46px] h-[46px] rounded-[14px] flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
                  <span className="text-white font-bold">{getInitiale(name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-[13px] truncate ${hasUnread ? 'font-bold text-text-dark' : 'font-semibold text-text-dark'}`}>{name}</p>
                    {timeStr && (
                      <p className={`text-[11px] ml-2 flex-shrink-0 ${hasUnread ? 'font-bold' : 'text-text-grey'}`}
                        style={{ color: hasUnread ? '#4B6BFF' : undefined }}>{timeStr}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-xs truncate flex-1 ${hasUnread ? 'text-text-dark font-medium' : 'text-text-grey'}`}>
                      {lastContenu}
                    </p>
                    {hasUnread && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: '#4B6BFF' }}>
                        <span className="text-white text-[10px] font-bold">{unread}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
              {idx < convs.length - 1 && <div className="h-px bg-divider ml-[67px]" />}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-full">

      {/* ── MOBILE ── */}
      <div className="md:hidden">
        {activeId === null ? (
          <div>
            <div className="px-4 pt-12 pb-3"
              style={{ background: 'rgba(245,245,247,0.88)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              <h1 className="text-lg font-bold text-text-dark">Messages</h1>
            </div>
            <ConvList />
          </div>
        ) : (
          <Outlet />
        )}
      </div>

      {/* ── DESKTOP : deux panneaux ── */}
      <div className="hidden md:flex" style={{ height: 'calc(100vh - 64px)' }}>

        {/* Panneau gauche — liste */}
        <div className="w-[320px] flex-shrink-0 flex flex-col" style={SIDEBAR}>
          <div className="px-5 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            <h2 className="text-xl font-bold text-text-dark">Messages</h2>
            {!loading && <p className="text-xs text-text-grey mt-0.5">{convs.length} conversation{convs.length > 1 ? 's' : ''}</p>}
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConvList />
          </div>
        </div>

        {/* Panneau droit — chat actif ou placeholder */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeId !== null ? (
            <Outlet />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-24 h-24 rounded-[24px] flex items-center justify-center mb-5"
                style={{ background: 'rgba(75,107,255,0.08)' }}>
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="#4B6BFF" strokeWidth={1.3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-xl font-bold text-text-dark mb-2">Vos messages</p>
              <p className="text-text-grey text-sm leading-relaxed max-w-xs">
                Sélectionnez une conversation dans la liste pour afficher les messages.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
