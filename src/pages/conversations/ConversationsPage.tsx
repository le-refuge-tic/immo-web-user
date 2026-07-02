import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { chatApi } from '../../api/chatApi'

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

const ChatEmptyIcon = () => (
  <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

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

  return (
    <div className="min-h-full bg-app-bg">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-3 border-b border-divider">
        <h1 className="text-lg font-bold text-text-dark">Messages</h1>
      </div>

      {loading ? (
        <div className="px-4 py-3 space-y-0">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-[72px] bg-white animate-pulse border-b border-divider" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <p className="text-[15px] font-bold text-text-dark mb-2">Impossible de charger les messages</p>
          <p className="text-xs text-text-grey mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold"
          >
            Reessayer
          </button>
        </div>
      ) : convs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-[20px] flex items-center justify-center mb-4">
            <ChatEmptyIcon />
          </div>
          <p className="text-base font-bold text-text-dark mb-2">Aucune conversation</p>
          <p className="text-[13px] text-text-grey leading-relaxed">
            Vos echanges avec les agents et clients<br />apparaitront ici.
          </p>
        </div>
      ) : (
        <div>
          {convs.map((conv, idx) => {
            const other = getOther(conv)
            const name = other
              ? `${other.prenom || ''} ${other.nom || ''}`.trim() || 'Contact'
              : 'Contact'
            const lastMsg = conv.last_message
            const lastContenu = lastMsg?.contenu || conv.lastContenu || (conv.bienType ? "A propos d'un bien" : 'Nouvelle conversation')
            const unread = conv.unread_count || conv.unreadCount || 0
            const hasUnread = unread > 0
            const timeStr = formatTime(lastMsg?.created_at || conv.last_message_at || conv.created_at || '')

            return (
              <div key={conv.id}>
                <button
                  onClick={() => navigate(`/conversations/${conv.id}`)}
                  className="w-full flex items-center gap-4 px-4 py-4 active:bg-surface-g transition-colors text-left"
                >
                  {/* Avatar gradient rectangulaire – fidèle Flutter */}
                  {other?.photo_profil ? (
                    <img
                      src={other.photo_profil}
                      alt=""
                      className="w-[50px] h-[50px] rounded-[15px] object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-[50px] h-[50px] rounded-[15px] flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #4B6BFF 0%, #7B4BFF 100%)' }}
                    >
                      <span className="text-white font-bold text-[18px]">{getInitiale(name)}</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p
                        className={`text-sm truncate ${hasUnread ? 'font-bold text-text-dark' : 'font-semibold text-text-dark'}`}
                      >
                        {name}
                      </p>
                      {timeStr && (
                        <p className={`text-[11px] ml-2 flex-shrink-0 ${hasUnread ? 'text-primary font-bold' : 'text-text-grey'}`}>
                          {timeStr}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-[13px] truncate flex-1 ${
                          hasUnread ? 'text-text-dark font-medium' : 'text-text-grey'
                        }`}
                      >
                        {lastContenu}
                      </p>
                      {hasUnread && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[11px] font-bold">{unread}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
                {idx < convs.length - 1 && (
                  <div className="h-px bg-divider ml-[76px]" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
