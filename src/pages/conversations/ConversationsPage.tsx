import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { chatApi } from '../../api/chatApi'

const GLASS = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(40px) saturate(160%)',
  WebkitBackdropFilter: 'blur(40px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.85)',
  boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 40px rgba(0,0,0,0.08)',
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
    if (!user) return null
    if (conv.prospect?.id !== user.id) return conv.prospect
    return conv.proprietaire || conv.demarcheur
  }

  const ConvList = () => {
    if (loading) return (
      <div className="p-4 space-y-2">
        {[1, 2, 3].map(n => <div key={n} className="skeleton h-[72px] rounded-xl" />)}
      </div>
    )

    if (error) return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <p className="text-[15px] font-bold text-text-dark mb-2">Impossible de charger les messages</p>
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
        <div className="w-20 h-20 rounded-[20px] flex items-center justify-center mb-4"
          style={{ background: 'rgba(75,107,255,0.1)' }}>
          <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-base font-bold text-text-dark mb-2">Aucune conversation</p>
        <p className="text-[13px] text-text-grey leading-relaxed">
          Vos échanges avec les agents et clients<br />apparaîtront ici.
        </p>
      </div>
    )

    return (
      <div>
        {convs.map((conv, idx) => {
          const other = getOther(conv)
          const name = other ? `${other.prenom || ''} ${other.nom || ''}`.trim() || 'Contact' : 'Contact'
          const lastMsg = conv.last_message
          const lastContenu = lastMsg?.contenu || conv.lastContenu || (conv.bienType ? "À propos d'un bien" : 'Nouvelle conversation')
          const unread = conv.unread_count || conv.unreadCount || 0
          const hasUnread = unread > 0
          const timeStr = formatTime(lastMsg?.created_at || conv.last_message_at || conv.created_at || '')

          return (
            <div key={conv.id}>
              <button
                onClick={() => navigate(`/conversations/${conv.id}`)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-black/[0.03] active:bg-black/5 transition-colors text-left"
              >
                {other?.photo_profil ? (
                  <img src={other.photo_profil} alt="" className="w-[50px] h-[50px] rounded-[15px] object-cover flex-shrink-0" />
                ) : (
                  <div className="w-[50px] h-[50px] rounded-[15px] flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
                    <span className="text-white font-bold text-lg">{getInitiale(name)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm truncate ${hasUnread ? 'font-bold text-text-dark' : 'font-semibold text-text-dark'}`}>{name}</p>
                    {timeStr && (
                      <p className={`text-[11px] ml-2 flex-shrink-0 ${hasUnread ? 'font-bold' : 'text-text-grey'}`}
                        style={{ color: hasUnread ? '#4B6BFF' : undefined }}>{timeStr}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-[13px] truncate flex-1 ${hasUnread ? 'text-text-dark font-medium' : 'text-text-grey'}`}>
                      {lastContenu}
                    </p>
                    {hasUnread && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: '#4B6BFF' }}>
                        <span className="text-white text-[11px] font-bold">{unread}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
              {idx < convs.length - 1 && <div className="h-px bg-divider ml-[76px]" />}
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
        <div className="px-4 pt-12 pb-3"
          style={{ background: 'rgba(245,245,247,0.88)', backdropFilter: 'blur(32px)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <h1 className="text-lg font-bold text-text-dark">Messages</h1>
        </div>
        <ConvList />
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:block py-10 px-6 md:px-16">
        <h1 className="text-2xl font-bold text-text-dark mb-6">Messages</h1>
        <div className="max-w-2xl rounded-2xl overflow-hidden" style={GLASS}>
          <ConvList />
        </div>
      </div>

    </div>
  )
}
