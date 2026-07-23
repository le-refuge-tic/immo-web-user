import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { chatApi } from '../../api/chatApi'
import { visitesApi } from '../../api/visitesApi'
import { io, Socket } from 'socket.io-client'

const WS_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1').replace('/api/v1', '')

const BIEN_TYPE_LABELS: Record<string, string> = {
  maison: 'Maison', appart_vide: 'Appartement', appart_meuble: 'Appartement meublé',
  guesthouse: 'Guesthouse', terrain: 'Terrain',
}
const SOUS_TYPE_LABELS: Record<string, string> = {
  villa: 'Villa', maison_individuelle: 'Maison individuelle', appartement: 'Appartement',
  chambre_salon: 'Chambre-Salon', entree_coucher: 'Entrée-Coucher', boutique: 'Boutique', terrain: 'Terrain',
}

function timeLabel(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function sameDay(a: string, b: string) {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

function dateSeparatorLabel(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (sameDay(dateStr, now.toISOString())) return "Aujourd'hui"
  if (sameDay(dateStr, yesterday.toISOString())) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatSlotDate(dt: Date) {
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  const h = String(dt.getHours()).padStart(2, '0')
  const m = String(dt.getMinutes()).padStart(2, '0')
  return `${jours[dt.getDay()]} ${dt.getDate()} ${mois[dt.getMonth()]} ${dt.getFullYear()} à ${h}:${m}`
}

function initial(name: string) {
  return name?.[0]?.toUpperCase() || '?'
}

function SlotPickerModal({ onConfirm, onCancel }: { onConfirm: (iso: string) => void; onCancel: () => void }) {
  const tomorrow = new Date(Date.now() + 86400000)
  const [date, setDate] = useState(tomorrow.toISOString().slice(0, 10))
  const [time, setTime] = useState('09:00')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onCancel}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <p className="font-bold text-text-dark mb-4">Proposer un créneau</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-text-grey mb-1 block">Date</label>
            <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={e => setDate(e.target.value)}
              className="w-full border border-divider rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-grey mb-1 block">Heure</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full border border-divider rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-divider text-sm font-semibold text-text-dark">Annuler</button>
          <button onClick={() => onConfirm(new Date(`${date}T${time}`).toISOString())}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold">Confirmer</button>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [conv, setConv] = useState<any>(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [replyingTo, setReplyingTo] = useState<any>(null)
  const [editingMessage, setEditingMessage] = useState<any>(null)
  const [hiddenForMe, setHiddenForMe] = useState<Set<number>>(new Set())
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [showSlotPicker, setShowSlotPicker] = useState(false)
  const [counterFor, setCounterFor] = useState<any>(null)
  const [isProposingSlot, setIsProposingSlot] = useState(false)
  const [payingFromChat, setPayingFromChat] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const convId = Number(id)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [msgsData, convsData] = await Promise.all([
          chatApi.messages(convId),
          chatApi.conversations(),
        ])
        const msgs = Array.isArray(msgsData) ? msgsData : msgsData.data || []
        setMessages(msgs.filter((m: any) => m.sender_id !== null))
        const convsList = Array.isArray(convsData) ? convsData : convsData.data || []
        setConv(convsList.find((c: any) => c.id === convId) || null)
      } catch (_) {}
      setLoading(false)
    }
    load()
    setHiddenForMe(new Set())
    setReplyingTo(null)
    setEditingMessage(null)
  }, [convId])

  useEffect(() => {
    if (!token) return
    const socket = io(`${WS_URL}/chat`, { auth: { token }, transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', () => socket.emit('rejoindre', { conversation_id: convId }))

    socket.on('message', (msg: any) => {
      if (msg.sender_id === null) return
      setMessages(prev => {
        const idx = prev.findIndex(m => m.id === msg.id)
        if (idx !== -1) {
          const copy = [...prev]
          copy[idx] = msg
          return copy
        }
        return [...prev, msg]
      })
    })

    return () => { socket.disconnect() }
  }, [token, convId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const other = conv?.participants?.find((p: any) => p.id !== user?.id) || conv?.participants?.[0] || null
  const otherName = other?.pseudonyme || 'Conversation'
  const roleLabel = other?.role === 'demarcheur' ? 'Agent immobilier' : other?.role === 'proprietaire' ? 'Propriétaire' : ''
  const isClientRole = other?.role === 'demarcheur' || other?.role === 'proprietaire'
  const bienTypeLabel = conv?.bien ? (conv.bien.sousType ? SOUS_TYPE_LABELS[conv.bien.sousType] : BIEN_TYPE_LABELS[conv.bien.type]) || conv.bien.type : null
  const bienLoc = conv?.bien?.localisation ? (conv.bien.localisation.quartier || conv.bien.localisation.ville) : null

  const showBlockedOrError = (err: any) => {
    const msg = err?.response?.data?.message || "Erreur d'envoi. Réessayez."
    setError(msg)
    setTimeout(() => setError(''), 6000)
  }

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return

    if (editingMessage) {
      setInput('')
      const editing = editingMessage
      setEditingMessage(null)
      try {
        const updated = await chatApi.modifierMessage(editing.id, text)
        setMessages(prev => prev.map(m => m.id === editing.id ? updated : m))
      } catch (e) { showBlockedOrError(e) }
      return
    }

    setInput('')
    setSending(true)
    try {
      const replyId = replyingTo?.id
      const replyContenu = replyingTo?.contenu
      setReplyingTo(null)
      const sent = await chatApi.envoyer(convId, text, replyId, replyContenu)
      setMessages(prev => prev.some(m => m.id === sent.id) ? prev : [...prev, sent])
    } catch (e) {
      showBlockedOrError(e)
    }
    setSending(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const startReply = (msg: any) => {
    if (msg.type === 'slot_proposal') return
    setReplyingTo(msg); setEditingMessage(null); setOpenMenuId(null)
  }
  const startEdit = (msg: any) => {
    setEditingMessage(msg); setReplyingTo(null); setInput(msg.contenu); setOpenMenuId(null)
  }
  const cancelReplyOrEdit = () => {
    const wasEditing = !!editingMessage
    setReplyingTo(null); setEditingMessage(null)
    if (wasEditing) setInput('')
  }

  const deleteForMe = (msg: any) => {
    setHiddenForMe(prev => new Set(prev).add(msg.id))
    setOpenMenuId(null)
  }

  const confirmDeleteForAll = async (msg: any) => {
    setOpenMenuId(null)
    if (!window.confirm('Ce message sera masqué pour tous les participants. Continuer ?')) return
    try {
      await chatApi.supprimerMessage(msg.id)
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, contenu: '🚫 Message supprimé', supprime_pour_tous: true, epingle: false } : m))
    } catch (e) { showBlockedOrError(e) }
  }

  const togglePin = async (msg: any) => {
    setOpenMenuId(null)
    const newPinnedId = msg.epingle ? null : msg.id
    try {
      await chatApi.togglePin(convId, newPinnedId)
      setMessages(prev => prev.map(m => ({ ...m, epingle: m.id === newPinnedId })))
    } catch (e) { showBlockedOrError(e) }
  }

  const pinnedMessage = messages.filter(m => m.epingle && !m.supprime_pour_tous).slice(-1)[0]

  const proposerCreneau = async (iso: string) => {
    setShowSlotPicker(false)
    setIsProposingSlot(true)
    try {
      const msg = await chatApi.proposerCreneau(convId, iso)
      setMessages(prev => [...prev, msg])
      scrollToBottom()
    } catch (e) { showBlockedOrError(e) }
    setIsProposingSlot(false)
  }

  const repondreProposition = async (msg: any, response: 'accepted' | 'declined' | 'countered') => {
    if (response === 'countered') { setCounterFor(msg); return }
    try {
      const updated = await chatApi.repondreProposition(msg.id, response)
      setMessages(prev => prev.map(m => m.id === msg.id ? updated : m))
    } catch (e) { showBlockedOrError(e) }
  }

  const confirmCounter = async (iso: string) => {
    const msg = counterFor
    setCounterFor(null)
    if (!msg) return
    try {
      const newMsg = await chatApi.repondreProposition(msg.id, 'countered', iso)
      setMessages(prev => {
        const updated = prev.map(m => m.id === msg.id ? { ...m, metadata: { ...m.metadata, status: 'countered' } } : m)
        return updated.some(m => m.id === newMsg.id) ? updated : [...updated, newMsg]
      })
      scrollToBottom()
    } catch (e) { showBlockedOrError(e) }
  }

  const copyCode = () => {
    if (!conv?.code_visite) return
    navigator.clipboard?.writeText(conv.code_visite)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const payerDepuisChat = async () => {
    if (!conv?.bien?.id) return
    setPayingFromChat(true)
    try {
      const data = await visitesApi.mesVisites()
      const list = Array.isArray(data) ? data : data.data || []
      const visite = list.find((v: any) => v.bien?.id === conv.bien.id)
      if (!visite) { alert('Aucune visite trouvée pour ce bien.'); return }
      if (visite.paiement_effectue) { alert('Visite déjà payée ✓'); return }
      if (!(Number(visite.frais_visite) > 0)) { alert('Visite gratuite — aucun paiement requis.'); return }
      navigate('/mes-visites')
    } catch (_) {
      alert("Impossible de récupérer la visite. Réessayez.")
    }
    setPayingFromChat(false)
  }

  const visibleMessages = messages.filter(m => !hiddenForMe.has(m.id))

  const canEdit = (msg: any) =>
    msg.sender_id === user?.id && !msg.supprime_pour_tous &&
    (Date.now() - new Date(msg.created_at).getTime()) <= 15 * 60 * 1000

  const MessageMenu = ({ msg }: { msg: any }) => (
    <div className="absolute z-20 top-full mt-1 right-0 bg-white rounded-xl shadow-lg border border-divider py-1 min-w-[170px]"
      onClick={e => e.stopPropagation()}>
      <button onClick={() => startReply(msg)} className="w-full text-left px-4 py-2 text-sm text-text-dark hover:bg-surface-g">Répondre</button>
      {canEdit(msg) && <button onClick={() => startEdit(msg)} className="w-full text-left px-4 py-2 text-sm text-text-dark hover:bg-surface-g">Modifier</button>}
      <button onClick={() => togglePin(msg)} className="w-full text-left px-4 py-2 text-sm text-text-dark hover:bg-surface-g">{msg.epingle ? 'Désépingler' : 'Épingler'}</button>
      {!msg.supprime_pour_tous && <button onClick={() => deleteForMe(msg)} className="w-full text-left px-4 py-2 text-sm text-text-dark hover:bg-surface-g">Supprimer pour moi</button>}
      {msg.sender_id === user?.id && !msg.supprime_pour_tous && (
        <button onClick={() => confirmDeleteForAll(msg)} className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-surface-g">Supprimer pour tous</button>
      )}
    </div>
  )

  const SlotBubble = ({ msg }: { msg: any }) => {
    const isMe = msg.sender_id === user?.id
    const status = msg.metadata?.status || 'pending'
    const dt = msg.metadata?.proposed_at ? new Date(msg.metadata.proposed_at) : null

    const palette: Record<string, { bg: string; accent: string; label: string }> = {
      accepted: { bg: 'rgba(76,175,80,0.10)', accent: '#4CAF50', label: 'Confirmé' },
      declined: { bg: 'rgba(0,0,0,0.03)', accent: '#9E9E9E', label: 'Refusé' },
      countered: { bg: 'rgba(255,152,0,0.08)', accent: '#FF9800', label: 'Contre-proposé' },
      pending: { bg: isMe ? 'rgba(75,107,255,0.11)' : '#fff', accent: '#4B6BFF', label: isMe ? 'En attente de réponse' : 'Créneau proposé' },
    }
    const p = palette[status] || palette.pending

    return (
      <div className={`flex mb-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[300px] rounded-2xl p-3.5" style={{ background: p.bg, border: `1.5px solid ${p.accent}55` }}>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: p.accent }}>Proposition de créneau</span>
          </div>
          <p className="text-sm font-bold text-text-dark leading-snug">{dt ? formatSlotDate(dt) : '—'}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs font-semibold" style={{ color: p.accent }}>{p.label}</span>
          </div>
          {!isMe && status === 'pending' && (
            <div className="flex gap-2 mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${p.accent}33` }}>
              <button onClick={() => repondreProposition(msg, 'accepted')}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(76,175,80,0.13)', color: '#4CAF50' }}>Accepter</button>
              <button onClick={() => repondreProposition(msg, 'countered')}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(75,107,255,0.10)', color: '#4B6BFF' }}>Modifier</button>
            </div>
          )}
          {status === 'accepted' && conv?.bien?.id && isClientRole && (
            <div className="mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${p.accent}33` }}>
              <button onClick={payerDepuisChat} disabled={payingFromChat}
                className="w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
                style={{ background: 'rgba(76,175,80,0.13)', color: '#4CAF50' }}>
                {payingFromChat ? '…' : (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="5" width="20" height="14" rx="2" /><path strokeLinecap="round" d="M2 10h20" /></svg>
                    Payer maintenant
                  </>
                )}
              </button>
            </div>
          )}
          <p className="text-[10px] text-text-grey mt-1.5">{timeLabel(msg.created_at)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-dvh md:h-full flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 md:pt-4 pb-3 flex-shrink-0" style={{ background: 'rgba(245,245,247,0.88)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/conversations')} className="md:hidden glass-btn w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0">
            <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
            <span className="text-white font-bold text-sm">{initial(otherName)}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-text-dark text-sm truncate">{otherName}</p>
            {roleLabel && <p className="text-xs text-text-grey truncate">{roleLabel}</p>}
          </div>

          {(bienTypeLabel || bienLoc) && conv?.bien && (
            <button onClick={() => navigate(`/biens/${conv.bien.id}`)}
              className="flex-shrink-0 text-left px-2.5 py-1.5 rounded-xl bg-white border border-divider max-w-[110px]">
              {bienTypeLabel && <p className="text-[11px] font-bold text-text-dark truncate">{bienTypeLabel}</p>}
              {bienLoc && <p className="text-[10px] text-text-grey truncate">{bienLoc}</p>}
            </button>
          )}
        </div>

        {conv?.code_visite && (
          <button onClick={copyCode} className="mt-2.5 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-divider">
            <svg className="w-3.5 h-3.5 text-text-grey" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
            <span className="text-xs font-bold text-text-dark tracking-wider">Code visite : {conv.code_visite}</span>
            <span className="text-[10px] text-primary font-semibold">{codeCopied ? 'Copié !' : 'Copier'}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 pt-2 flex-shrink-0">
          <div className="bg-text-dark text-white text-xs rounded-xl px-4 py-2.5 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" onClick={() => setOpenMenuId(null)}>
        {pinnedMessage && (
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 mb-3 border-l-[3px]" style={{ borderLeftColor: '#4B6BFF' }}>
            <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" /></svg>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-text-grey">Message épinglé</p>
              <p className="text-xs text-text-dark truncate">{pinnedMessage.contenu}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center pt-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="text-center py-12 text-text-grey text-sm">Démarrez la conversation</div>
        ) : visibleMessages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id
          const needsSeparator = i === 0 || !sameDay(visibleMessages[i - 1].created_at, msg.created_at)
          if (msg.type === 'slot_proposal') {
            return (
              <div key={msg.id}>
                {needsSeparator && <div className="text-center text-[11px] text-text-grey my-3">{dateSeparatorLabel(msg.created_at)}</div>}
                <SlotBubble msg={msg} />
              </div>
            )
          }
          const isSupprime = msg.supprime_pour_tous
          return (
            <div key={msg.id}>
              {needsSeparator && <div className="text-center text-[11px] text-text-grey my-3">{dateSeparatorLabel(msg.created_at)}</div>}
              <div className={`flex mb-2.5 group ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="relative max-w-[78%]">
                  <div className={`px-4 py-2.5 rounded-2xl ${isMe ? 'bg-primary text-white rounded-br-sm' : 'glass-card text-text-dark rounded-bl-sm'}`}>
                    {msg.reply_to_contenu && (
                      <div className={`text-xs px-2.5 py-1.5 rounded-lg mb-1.5 border-l-2 truncate ${isMe ? 'border-white/50 bg-white/15' : 'border-primary bg-black/5'}`}>
                        {msg.reply_to_contenu}
                      </div>
                    )}
                    <p className={`text-sm leading-relaxed ${isSupprime ? 'italic opacity-70' : ''}`}>{msg.contenu}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {msg.epingle && <span className={`text-[10px] ${isMe ? 'text-white/70' : 'text-primary'}`}>📌</span>}
                      {msg.modifie && <span className={`text-xs ${isMe ? 'text-white/60' : 'text-text-grey'} italic`}>Modifié · </span>}
                      <p className={`text-xs ${isMe ? 'text-white/60' : 'text-text-grey'}`}>{timeLabel(msg.created_at)}</p>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === msg.id ? null : msg.id) }}
                    className={`absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full flex items-center justify-center text-xs ${isMe ? '-left-7' : '-right-7'}`}
                    style={{ background: 'rgba(0,0,0,0.06)' }}>
                    ⋯
                  </button>
                  {openMenuId === msg.id && <MessageMenu msg={msg} />}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0" style={{ background: 'rgba(245,245,247,0.88)', backdropFilter: 'blur(32px)', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
        {(replyingTo || editingMessage) && (
          <div className="px-4 pt-2.5 flex items-center gap-2.5">
            <div className="w-[3px] h-9 bg-primary rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-primary">{editingMessage ? 'Modifier le message' : `Répondre à ${otherName.split(' ')[0]}`}</p>
              <p className="text-xs text-text-grey truncate">{editingMessage?.contenu ?? replyingTo?.contenu}</p>
            </div>
            <button onClick={cancelReplyOrEdit} className="w-7 h-7 flex items-center justify-center text-text-grey flex-shrink-0">✕</button>
          </div>
        )}
        <div className="px-4 py-3 flex items-end gap-2.5 safe-bottom">
          <button onClick={() => setShowSlotPicker(true)} disabled={isProposingSlot}
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-50" style={{ background: 'rgba(75,107,255,0.10)' }}>
            {isProposingSlot ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            )}
          </button>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Écrire un message…"
            rows={1}
            className="glass-input flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none resize-none max-h-28 leading-relaxed"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="w-11 h-11 bg-primary rounded-full flex items-center justify-center shadow-btn disabled:opacity-40 flex-shrink-0"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {showSlotPicker && <SlotPickerModal onConfirm={proposerCreneau} onCancel={() => setShowSlotPicker(false)} />}
      {counterFor && <SlotPickerModal onConfirm={confirmCounter} onCancel={() => setCounterFor(null)} />}
    </div>
  )
}
