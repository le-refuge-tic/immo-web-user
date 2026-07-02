import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { chatApi } from '../../api/chatApi'
import { io, Socket } from 'socket.io-client'

const WS_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1').replace('/api/v1', '')

function timeLabel(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function initials(name: string) {
  return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [conv, setConv] = useState<any>(null)
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const convId = Number(id)

  useEffect(() => {
    const load = async () => {
      try {
        const [msgsData, convsData] = await Promise.all([
          chatApi.messages(convId),
          chatApi.conversations(),
        ])
        const msgs = Array.isArray(msgsData) ? msgsData : msgsData.data || []
        setMessages(msgs)
        const convsList = Array.isArray(convsData) ? convsData : convsData.data || []
        setConv(convsList.find((c: any) => c.id === convId) || null)
      } catch (_) {}
      setLoading(false)
    }
    load()
  }, [convId])

  useEffect(() => {
    if (!token) return
    const socket = io(WS_URL, {
      namespace: '/chat',
      auth: { token },
      transports: ['websocket'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('rejoindre', { conversation_id: convId })
    })

    socket.on('message', (msg: any) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    })

    return () => { socket.disconnect() }
  }, [token, convId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    try {
      await chatApi.envoyer(convId, text)
    } catch (_) {}
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const getOther = () => {
    if (!user || !conv) return null
    if (conv.prospect?.id !== user.id) return conv.prospect
    return conv.proprietaire || conv.demarcheur
  }

  const other = getOther()
  const otherName = other ? `${other.prenom || ''} ${other.nom || ''}`.trim() : 'Conversation'

  return (
    <div className="h-dvh flex flex-col bg-app-bg">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-3 flex items-center gap-3 border-b border-divider flex-shrink-0">
        <button onClick={() => navigate('/conversations')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-g">
          <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {other?.photo_profil ? (
          <img src={other.photo_profil} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary-l flex items-center justify-center">
            <span className="text-primary font-bold text-sm">{initials(otherName)}</span>
          </div>
        )}

        <div>
          <p className="font-bold text-text-dark text-sm">{otherName}</p>
          {conv?.visite && (
            <p className="text-xs text-text-grey">
              Visite – {conv.visite.bien?.localisation?.ville || 'Bien'}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center pt-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-text-grey text-sm">Démarrez la conversation</div>
        ) : messages.map(msg => {
          const isMe = msg.expediteur_id === user?.id || msg.sender_role === 'user'
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl ${
                isMe
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-white text-text-dark rounded-bl-sm shadow-sm'
              }`}>
                <p className="text-sm leading-relaxed">{msg.contenu}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-white/60' : 'text-text-grey'}`}>
                  {timeLabel(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-divider px-4 py-3 flex items-end gap-3 safe-bottom flex-shrink-0">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Écrire un message…"
          rows={1}
          className="flex-1 bg-surface-g rounded-2xl px-4 py-2.5 text-sm outline-none resize-none max-h-28 leading-relaxed"
          style={{ minHeight: '42px' }}
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          className="w-11 h-11 bg-primary rounded-full flex items-center justify-center shadow-btn disabled:opacity-40 flex-shrink-0"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )
}
