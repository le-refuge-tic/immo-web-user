import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
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
function initial(name: string) { return name?.[0]?.toUpperCase() || '?' }

function useTokens(isDark: boolean) {
  return {
    bg:           isDark ? '#0F0F14'                      : '#F5F5F7',
    headerBg:     isDark ? 'rgba(15,15,20,0.96)'          : 'rgba(245,245,247,0.92)',
    headerBdr:    isDark ? 'rgba(255,255,255,0.07)'       : 'rgba(0,0,0,0.08)',
    inputBg:      isDark ? 'rgba(15,15,20,0.96)'          : 'rgba(245,245,247,0.92)',
    inputBdr:     isDark ? 'rgba(255,255,255,0.07)'       : 'rgba(0,0,0,0.08)',
    bubbleMeBg:   isDark ? 'linear-gradient(135deg,#3a54d4,#5b36c9)' : 'linear-gradient(135deg,#4B6BFF,#7B4BFF)',
    bubbleOtherBg:isDark ? 'rgba(38,38,58,0.9)'           : 'rgba(255,255,255,0.9)',
    bubbleOtherBdr:isDark ? 'rgba(255,255,255,0.08)'      : 'rgba(0,0,0,0.07)',
    textPrimary:  isDark ? '#E8E8EF'                      : '#1D1D1F',
    textSecond:   isDark ? 'rgba(255,255,255,0.55)'       : 'rgba(0,0,0,0.55)',
    textMuted:    isDark ? 'rgba(255,255,255,0.35)'       : 'rgba(0,0,0,0.38)',
    divider:      isDark ? 'rgba(255,255,255,0.06)'       : 'rgba(0,0,0,0.07)',
    menuBg:       isDark ? 'rgba(28,28,42,0.98)'          : '#FFFFFF',
    menuBdr:      isDark ? 'rgba(255,255,255,0.08)'       : 'rgba(0,0,0,0.08)',
    menuHover:    isDark ? 'rgba(255,255,255,0.06)'       : 'rgba(0,0,0,0.04)',
    pinnedBg:     isDark ? 'rgba(38,38,58,0.85)'          : 'rgba(255,255,255,0.85)',
    inputFieldBg: isDark ? 'rgba(255,255,255,0.06)'       : 'rgba(255,255,255,0.9)',
    inputFieldBdr:isDark ? 'rgba(255,255,255,0.10)'       : 'rgba(0,0,0,0.10)',
    bienCardBg:   isDark ? 'rgba(255,255,255,0.07)'       : 'rgba(0,0,0,0.05)',
    bienCardBdr:  isDark ? 'rgba(255,255,255,0.10)'       : 'rgba(0,0,0,0.10)',
    deletedBg:    isDark ? 'rgba(255,255,255,0.04)'       : 'rgba(0,0,0,0.04)',
    deletedBdr:   isDark ? 'rgba(255,255,255,0.12)'       : 'rgba(0,0,0,0.15)',
    calBtnBg:     isDark ? 'rgba(75,107,255,0.15)'        : 'rgba(75,107,255,0.10)',
    separatorBg:  isDark ? 'rgba(255,255,255,0.08)'       : 'rgba(0,0,0,0.06)',
  }
}

/* ── Icônes statuts lecture ── */
const CheckSentIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const CheckDeliveredIcon = ({ color }: { color: string }) => (
  <svg width="14" height="12" viewBox="0 0 28 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 6 11 17 6 12" />
    <polyline points="28 6 17 17 15 15" />
  </svg>
)
const CheckReadIcon = ({ color }: { color: string }) => (
  <svg width="14" height="12" viewBox="0 0 28 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 6 11 17 6 12" />
    <polyline points="28 6 17 17 15 15" />
  </svg>
)

function MessageStatusIcon({ status, isMe }: { status?: string; isMe: boolean }) {
  if (!isMe) return null
  if (status === 'read') return <CheckReadIcon color="#4B6BFF" />
  if (status === 'delivered') return <CheckDeliveredIcon color="rgba(255,255,255,0.6)" />
  return <CheckSentIcon color="rgba(255,255,255,0.5)" />
}

/* ── Icônes ── */
const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)
const DotsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
  </svg>
)
const PinIcon = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
  </svg>
)
const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const SendIcon = () => (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
)
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const CheckSuccessIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

/* ── Modal slot picker ── */
function SlotPickerModal({ onConfirm, onCancel, tk }: { onConfirm: (iso: string) => void; onCancel: () => void; tk: ReturnType<typeof useTokens> }) {
  const tomorrow = new Date(Date.now() + 86400000)
  const [date, setDate] = useState(tomorrow.toISOString().slice(0, 10))
  const [time, setTime] = useState('09:00')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onCancel}>
      <div className="rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}
        style={{ background: tk.menuBg, border: `1px solid ${tk.menuBdr}`, boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
        <p className="font-bold mb-4" style={{ color: tk.textPrimary }}>Proposer un créneau</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: tk.textSecond }}>Date</label>
            <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={e => setDate(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: tk.inputFieldBg, border: `1px solid ${tk.inputFieldBdr}`, color: tk.textPrimary }} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: tk.textSecond }}>Heure</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: tk.inputFieldBg, border: `1px solid ${tk.inputFieldBdr}`, color: tk.textPrimary }} />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ border: `1px solid ${tk.menuBdr}`, color: tk.textPrimary }}>Annuler</button>
          <button onClick={() => onConfirm(new Date(`${date}T${time}`).toISOString())}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: '#4B6BFF' }}>Confirmer</button>
        </div>
      </div>
    </div>
  )
}

export default function ChatThread({ convId, onBack }: { convId: number; onBack: () => void }) {
  const { user, token } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const tk = useTokens(isDark)
  const navigate = useNavigate()
  const location = useLocation()

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
  const [complainMsg, setComplainMsg] = useState<any>(null)
  const [complainText, setComplainText] = useState('')
  const [complainSending, setComplainSending] = useState(false)
  const [complainSent, setComplainSent] = useState(false)
  const [showHeaderMenu, setShowHeaderMenu] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const headerMenuRef = useRef<HTMLDivElement>(null)

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
    const draft = (location.state as any)?.draftMessage
    if (draft) {
      setInput(draft)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state])

  useEffect(() => {
    if (!token) return
    const socket = io(`${WS_URL}/chat`, { auth: { token }, transports: ['websocket'] })
    socketRef.current = socket
    socket.on('connect', () => socket.emit('rejoindre', { conversation_id: convId }))
    socket.on('message', (msg: any) => {
      if (msg.sender_id === null) return
      setMessages(prev => {
        const idx = prev.findIndex(m => m.id === msg.id)
        if (idx !== -1) { const copy = [...prev]; copy[idx] = msg; return copy }
        return [...prev, msg]
      })
    })
    return () => { socket.disconnect() }
  }, [token, convId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* Fermer menu header au clic extérieur */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setShowHeaderMenu(false)
      }
    }
    if (showHeaderMenu) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showHeaderMenu])

  const other = conv?.participants?.find((p: any) => p.id !== user?.id) || conv?.participants?.[0] || null
  const otherName = other?.prenom || other?.pseudonyme || other?.nom || 'Conversation'
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
    } catch (e) { showBlockedOrError(e) }
    setSending(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const startReply = (msg: any) => { if (msg.type === 'slot_proposal') return; setReplyingTo(msg); setEditingMessage(null); setOpenMenuId(null) }
  const startEdit = (msg: any) => { setEditingMessage(msg); setReplyingTo(null); setInput(msg.contenu); setOpenMenuId(null) }
  const cancelReplyOrEdit = () => { const wasEditing = !!editingMessage; setReplyingTo(null); setEditingMessage(null); if (wasEditing) setInput('') }
  const deleteForMe = (msg: any) => { setHiddenForMe(prev => new Set(prev).add(msg.id)); setOpenMenuId(null) }

  const confirmDeleteForAll = async (msg: any) => {
    setOpenMenuId(null)
    if (!window.confirm('Ce message sera masqué pour tous les participants. Continuer ?')) return
    try {
      await chatApi.supprimerMessage(msg.id)
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, contenu: 'Message supprimé', supprime_pour_tous: true, epingle: false } : m))
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
  const lastSlotMessage = messages.filter(m => m.type === 'slot_proposal' && !m.supprime_pour_tous).slice(-1)[0]

  const findVisitePourBien = async () => {
    if (!conv?.bien?.id) return null
    try {
      const data = await visitesApi.mesVisites()
      const list = Array.isArray(data) ? data : data.data || []
      return list.find((v: any) => v.bien?.id === conv.bien.id) || null
    } catch { return null }
  }

  const syncVisiteContreProposer = async (iso: string) => {
    const visite = await findVisitePourBien()
    if (visite && visite.statut === 'en_attente') {
      try { await visitesApi.contreProposer(visite.id, iso) } catch (_) {}
    }
  }

  const syncVisiteStatusAfterAccept = async () => {
    const visite = await findVisitePourBien()
    if (!visite) return
    try {
      if (isClientRole) {
        if (visite.statut === 'contre_proposee' || visite.statut === 'en_attente') await visitesApi.accepterContreProposition(visite.id)
      } else {
        if (visite.statut === 'en_attente' || visite.statut === 'contre_proposee') await visitesApi.confirmerVisite(visite.id)
      }
    } catch (_) {}
  }

  const proposerCreneau = async (iso: string) => {
    setShowSlotPicker(false); setIsProposingSlot(true)
    try {
      const msg = await chatApi.proposerCreneau(convId, iso)
      setMessages(prev => [...prev, msg]); scrollToBottom()
      if (!isClientRole) syncVisiteContreProposer(iso)
    } catch (e) { showBlockedOrError(e) }
    setIsProposingSlot(false)
  }

  const repondreProposition = async (msg: any, response: 'accepted' | 'declined' | 'countered') => {
    if (response === 'countered') { setCounterFor(msg); return }
    try {
      const updated = await chatApi.repondreProposition(msg.id, response)
      setMessages(prev => prev.map(m => m.id === msg.id ? updated : m))
      if (response === 'accepted') syncVisiteStatusAfterAccept()
    } catch (e) { showBlockedOrError(e) }
  }

  const confirmCounter = async (iso: string) => {
    const msg = counterFor; setCounterFor(null)
    if (!msg) return
    try {
      const newMsg = await chatApi.repondreProposition(msg.id, 'countered', iso)
      setMessages(prev => {
        const updated = prev.map(m => m.id === msg.id ? { ...m, metadata: { ...m.metadata, status: 'countered' } } : m)
        return updated.some(m => m.id === newMsg.id) ? updated : [...updated, newMsg]
      }); scrollToBottom()
    } catch (e) { showBlockedOrError(e) }
  }

  const copyCode = () => {
    if (!conv?.code_visite) return
    navigator.clipboard?.writeText(conv.code_visite)
    setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000)
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
      navigate('/mes-visites', { state: { openPayForVisiteId: visite.id } })
    } catch (_) { alert("Impossible de récupérer la visite. Réessayez.") }
    setPayingFromChat(false)
  }

  const canEdit = (msg: any) =>
    msg.sender_id === user?.id && !msg.supprime_pour_tous &&
    (Date.now() - new Date(msg.created_at).getTime()) <= 15 * 60 * 1000

  const visibleMessages = messages.filter(m => !hiddenForMe.has(m.id))

  /* ── Menu contextuel message ── */
  const MessageMenu = ({ msg }: { msg: any }) => (
    <div className="rounded-xl py-1 min-w-[170px]"
      style={{ background: tk.menuBg, border: `1px solid ${tk.menuBdr}`, boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
      onClick={e => e.stopPropagation()}>
      <button onClick={() => startReply(msg)} className="w-full text-left px-4 py-2 text-sm transition-colors"
        style={{ color: tk.textPrimary }} onMouseEnter={e => (e.currentTarget.style.background = tk.menuHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        Répondre
      </button>
      {canEdit(msg) && (
        <button onClick={() => startEdit(msg)} className="w-full text-left px-4 py-2 text-sm transition-colors"
          style={{ color: tk.textPrimary }} onMouseEnter={e => (e.currentTarget.style.background = tk.menuHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          Modifier
        </button>
      )}
      <button onClick={() => togglePin(msg)} className="w-full text-left px-4 py-2 text-sm transition-colors"
        style={{ color: tk.textPrimary }} onMouseEnter={e => (e.currentTarget.style.background = tk.menuHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        {msg.epingle ? 'Désépingler' : 'Épingler'}
      </button>
      {!msg.supprime_pour_tous && (
        <button onClick={() => deleteForMe(msg)} className="w-full text-left px-4 py-2 text-sm transition-colors"
          style={{ color: tk.textPrimary }} onMouseEnter={e => (e.currentTarget.style.background = tk.menuHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          Supprimer pour moi
        </button>
      )}
      {msg.sender_id === user?.id && !msg.supprime_pour_tous && (
        <button onClick={() => confirmDeleteForAll(msg)} className="w-full text-left px-4 py-2 text-sm transition-colors"
          style={{ color: '#EF4444' }} onMouseEnter={e => (e.currentTarget.style.background = tk.menuHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          Supprimer pour tous
        </button>
      )}
    </div>
  )

  /* ── Menu 3 points header ── */
  const HeaderMenu = () => (
    <div ref={headerMenuRef} className="absolute right-0 top-full mt-2 z-50 rounded-xl py-1 min-w-[200px]"
      style={{ background: tk.menuBg, border: `1px solid ${tk.menuBdr}`, boxShadow: '0 12px 40px rgba(0,0,0,0.22)' }}>
      {conv?.bien?.id && (
        <button onClick={() => { navigate(`/biens/${conv.bien.id}`); setShowHeaderMenu(false) }}
          className="w-full text-left px-4 py-2.5 text-sm transition-colors"
          style={{ color: tk.textPrimary }} onMouseEnter={e => (e.currentTarget.style.background = tk.menuHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          Voir le bien
        </button>
      )}
      <button onClick={() => { navigate(`/profil/${other?.id}`); setShowHeaderMenu(false) }}
        className="w-full text-left px-4 py-2.5 text-sm transition-colors"
        style={{ color: tk.textPrimary }} onMouseEnter={e => (e.currentTarget.style.background = tk.menuHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        Voir le profil
      </button>
      <div className="h-px my-1" style={{ background: tk.divider }} />
      <button onClick={() => setShowHeaderMenu(false)}
        className="w-full text-left px-4 py-2.5 text-sm transition-colors"
        style={{ color: '#EF4444' }} onMouseEnter={e => (e.currentTarget.style.background = tk.menuHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        Signaler
      </button>
    </div>
  )

  /* ── Bulle créneaux ── */
  const SlotBubble = ({ msg }: { msg: any }) => {
    const isMe = msg.sender_id === user?.id
    const status = msg.metadata?.status || 'pending'
    const dt = msg.metadata?.proposed_at ? new Date(msg.metadata.proposed_at) : null
    const palette: Record<string, { bg: string; accent: string; label: string }> = {
      accepted: { bg: 'rgba(76,175,80,0.10)', accent: '#4CAF50', label: 'Confirmé' },
      declined: { bg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', accent: '#9E9E9E', label: 'Refusé' },
      countered: { bg: 'rgba(255,152,0,0.08)', accent: '#FF9800', label: 'Contre-proposé' },
      pending: { bg: isMe ? 'rgba(75,107,255,0.11)' : (isDark ? 'rgba(38,38,58,0.9)' : '#fff'), accent: '#4B6BFF', label: isMe ? 'En attente de réponse' : 'Créneau proposé' },
    }
    const p = palette[status] || palette.pending
    return (
      <div className={`flex mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[280px] rounded-xl p-3" style={{ background: p.bg, border: `1.5px solid ${p.accent}55` }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: p.accent }}>Créneau proposé</span>
          </div>
          <p className="text-sm font-bold leading-snug" style={{ color: tk.textPrimary }}>{dt ? formatSlotDate(dt) : '—'}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-xs font-semibold" style={{ color: p.accent }}>{p.label}</span>
          </div>
          {!isMe && status === 'pending' && (
            <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${p.accent}33` }}>
              <div className="flex gap-2">
                <button onClick={() => repondreProposition(msg, 'accepted')} className="flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                  style={{ background: 'rgba(76,175,80,0.13)', color: '#4CAF50' }}>Confirmer</button>
                <button onClick={() => repondreProposition(msg, 'declined')} className="flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                  style={{ background: 'rgba(239,68,68,0.10)', color: '#EF4444' }}>Rejeter</button>
              </div>
              <button onClick={() => repondreProposition(msg, 'countered')} className="w-full mt-1.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                style={{ background: 'rgba(75,107,255,0.10)', color: '#4B6BFF' }}>Autre date</button>
            </div>
          )}
          {status === 'accepted' && conv?.bien?.id && isClientRole && (
            <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${p.accent}33` }}>
              <button onClick={payerDepuisChat} disabled={payingFromChat} className="w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                style={{ background: 'rgba(76,175,80,0.13)', color: '#4CAF50' }}>
                {payingFromChat ? '…' : 'Payer maintenant'}
              </button>
            </div>
          )}
          <p className="text-[10px] mt-1.5" style={{ color: tk.textMuted }}>{timeLabel(msg.created_at)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col" style={{ background: tk.bg }}>

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0 safe-top"
        style={{ background: tk.headerBg, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', borderBottom: `1px solid ${tk.headerBdr}` }}>
        <div className="flex items-center gap-3">
          {/* Bouton retour mobile */}
          <button onClick={onBack} className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 transition-colors cursor-pointer"
            style={{ background: tk.bienCardBg }} aria-label="Retour">
            <span style={{ color: tk.textPrimary }}><BackIcon /></span>
          </button>

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
            <span className="text-white font-bold text-sm">{initial(otherName)}</span>
          </div>

          {/* Nom + rôle */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: tk.textPrimary }}>{otherName}</p>
            {roleLabel && <p className="text-xs truncate" style={{ color: tk.textMuted }}>{roleLabel}</p>}
          </div>

          {/* Bien lié */}
          {(bienTypeLabel || bienLoc) && conv?.bien && (
            <button onClick={() => navigate(`/biens/${conv.bien.id}`)}
              className="flex-shrink-0 text-left px-2.5 py-1.5 rounded-xl max-w-[110px] cursor-pointer transition-opacity hover:opacity-80"
              style={{ background: tk.bienCardBg, border: `1px solid ${tk.bienCardBdr}` }}>
              {bienTypeLabel && <p className="text-[11px] font-bold truncate" style={{ color: tk.textPrimary }}>{bienTypeLabel}</p>}
              {bienLoc && <p className="text-[10px] truncate" style={{ color: tk.textMuted }}>{bienLoc}</p>}
            </button>
          )}

          {/* Menu 3 points PERMANENT */}
          <div className="relative flex-shrink-0" ref={headerMenuRef}>
            <button
              onClick={() => setShowHeaderMenu(v => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer"
              style={{ background: showHeaderMenu ? tk.bienCardBg : 'transparent', color: tk.textSecond }}
              aria-label="Plus d'options">
              <DotsIcon />
            </button>
            {showHeaderMenu && <HeaderMenu />}
          </div>
        </div>

        {/* Code visite */}
        {conv?.code_visite && (
          <button onClick={copyCode} className="mt-2.5 flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
            style={{ background: tk.bienCardBg, border: `1px solid ${tk.bienCardBdr}` }}>
            <svg className="w-3.5 h-3.5" style={{ color: tk.textMuted }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
            <span className="text-xs font-bold tracking-wider" style={{ color: tk.textPrimary }}>Code : {conv.code_visite}</span>
            <span className="text-[10px] font-semibold" style={{ color: '#4B6BFF' }}>{codeCopied ? 'Copié !' : 'Copier'}</span>
          </button>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <div className="px-4 pt-2 flex-shrink-0">
          <div className="text-white text-xs rounded-xl px-4 py-2.5 flex items-center gap-2" style={{ background: '#EF4444' }}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* ── Zone messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-auto" onClick={() => { setOpenMenuId(null); setShowHeaderMenu(false) }}>

        {/* Message épinglé */}
        {pinnedMessage && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3 border-l-[3px]"
            style={{ background: tk.pinnedBg, borderLeftColor: '#4B6BFF', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <span style={{ color: '#4B6BFF' }}><PinIcon /></span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold" style={{ color: tk.textMuted }}>Message épinglé</p>
              <p className="text-xs truncate" style={{ color: tk.textPrimary }}>{pinnedMessage.contenu}</p>
            </div>
          </div>
        )}

        {/* Dernier créneau */}
        {lastSlotMessage && (() => {
          const status = lastSlotMessage.metadata?.status || 'pending'
          const dt = lastSlotMessage.metadata?.proposed_at ? new Date(lastSlotMessage.metadata.proposed_at) : null
          const cfg: Record<string, { accent: string; label: string }> = {
            accepted: { accent: '#4CAF50', label: 'Créneau confirmé' },
            declined: { accent: '#EF4444', label: 'Créneau refusé' },
            countered: { accent: '#FF9800', label: 'Contre-proposition' },
            pending: { accent: '#4B6BFF', label: 'Créneau en discussion' },
          }
          const c = cfg[status] || cfg.pending
          return (
            <button onClick={() => document.getElementById(`msg-${lastSlotMessage.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3 border-l-[3px] text-left cursor-pointer"
              style={{ background: tk.pinnedBg, borderLeftColor: c.accent, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold" style={{ color: c.accent }}>{c.label}</p>
                <p className="text-xs font-semibold truncate" style={{ color: tk.textPrimary }}>{dt ? formatSlotDate(dt) : '—'}</p>
              </div>
              <svg className="w-4 h-4 flex-shrink-0 opacity-60" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )
        })()}

        {/* Messages */}
        {loading ? (
          <div className="flex justify-center pt-8">
            <div className="w-7 h-7 border-[3px] border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4B6BFF', borderTopColor: 'transparent' }} />
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: tk.textMuted }}>Démarrez la conversation</div>
        ) : visibleMessages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id
          const needsSeparator = i === 0 || !sameDay(visibleMessages[i - 1].created_at, msg.created_at)

          if (msg.type === 'slot_proposal') {
            return (
              <div key={msg.id} id={`msg-${msg.id}`}>
                {needsSeparator && (
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px" style={{ background: tk.separatorBg }} />
                    <span className="text-[11px] px-2" style={{ color: tk.textMuted }}>{dateSeparatorLabel(msg.created_at)}</span>
                    <div className="flex-1 h-px" style={{ background: tk.separatorBg }} />
                  </div>
                )}
                <SlotBubble msg={msg} />
              </div>
            )
          }

          const isSupprime = msg.supprime_pour_tous
          return (
            <div key={msg.id} id={`msg-${msg.id}`}>
              {needsSeparator && (
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px" style={{ background: tk.separatorBg }} />
                  <span className="text-[11px] px-2" style={{ color: tk.textMuted }}>{dateSeparatorLabel(msg.created_at)}</span>
                  <div className="flex-1 h-px" style={{ background: tk.separatorBg }} />
                </div>
              )}

              <div className={`flex mb-1.5 group ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="relative max-w-[75%]">
                  {isSupprime ? (
                    <div className="px-3 py-2 rounded-xl" style={{ background: tk.deletedBg, border: `1px dashed ${tk.deletedBdr}` }}>
                      <p className="text-sm italic" style={{ color: tk.textMuted }}>Message supprimé</p>
                      <button onClick={e => { e.stopPropagation(); setComplainMsg(msg); setComplainText(''); setComplainSent(false) }}
                        className="text-[11px] underline mt-1 cursor-pointer" style={{ color: '#4B6BFF' }}>
                        En savoir plus
                      </button>
                      <p className="text-[10px] mt-1" style={{ color: tk.textMuted }}>{timeLabel(msg.created_at)}</p>
                    </div>
                  ) : (
                    <div className={`px-3 py-2 ${isMe ? 'rounded-2xl rounded-br-sm text-white' : 'rounded-2xl rounded-bl-sm'}`}
                      style={isMe ? { background: tk.bubbleMeBg } : { background: tk.bubbleOtherBg, border: `1px solid ${tk.bubbleOtherBdr}`, color: tk.textPrimary }}>
                      {/* Citer */}
                      {msg.reply_to_contenu && (
                        <div className={`text-xs px-2 py-1 rounded-lg mb-1.5 border-l-2 truncate ${isMe ? 'border-white/40 bg-white/15' : 'border-[#4B6BFF] bg-black/5'}`}
                          style={isMe ? {} : { background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                          {msg.reply_to_contenu}
                        </div>
                      )}
                      {/* Texte — 14px, line-height 1.4 */}
                      <p className="text-[14px] leading-[1.4]">{msg.contenu}</p>
                      {/* Footer : heure + statut */}
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        {msg.epingle && <span className="text-[10px]" style={{ color: isMe ? 'rgba(255,255,255,0.65)' : '#4B6BFF' }}>📌</span>}
                        {msg.modifie && <span className="text-[10px] italic" style={{ color: isMe ? 'rgba(255,255,255,0.55)' : tk.textMuted }}>modifié ·</span>}
                        <p className="text-[10px]" style={{ color: isMe ? 'rgba(255,255,255,0.55)' : tk.textMuted }}>{timeLabel(msg.created_at)}</p>
                        <MessageStatusIcon status={msg.status} isMe={isMe} />
                      </div>
                    </div>
                  )}

                  {/* Bouton menu contextuel */}
                  <button
                    onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === msg.id ? null : msg.id) }}
                    className={`absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer ${isMe ? '-left-8' : '-right-8'}`}
                    style={{ background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', color: tk.textSecond }}
                    aria-label="Options">
                    ⋯
                  </button>
                  {/* Menu positionné selon côté pour rester dans l'écran */}
                  {openMenuId === msg.id && (
                    <div className={`absolute z-20 bottom-full mb-1 ${isMe ? 'right-0' : 'left-0'}`}>
                      <MessageMenu msg={msg} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Zone saisie ── */}
      <div className="flex-shrink-0" style={{ background: tk.inputBg, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', borderTop: `1px solid ${tk.inputBdr}` }}>
        {/* Répondre / Modifier */}
        {(replyingTo || editingMessage) && (
          <div className="px-4 pt-2.5 flex items-center gap-2.5">
            <div className="w-[3px] h-9 rounded-full flex-shrink-0" style={{ background: '#4B6BFF' }} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold" style={{ color: '#4B6BFF' }}>
                {editingMessage ? 'Modifier le message' : `Répondre à ${otherName.split(' ')[0]}`}
              </p>
              <p className="text-xs truncate" style={{ color: tk.textMuted }}>{editingMessage?.contenu ?? replyingTo?.contenu}</p>
            </div>
            <button onClick={cancelReplyOrEdit} className="w-7 h-7 flex items-center justify-center flex-shrink-0 cursor-pointer" style={{ color: tk.textMuted }}>
              <XIcon />
            </button>
          </div>
        )}

        <div className="px-4 py-3 flex items-end gap-2.5 safe-bottom">
          {/* Bouton calendrier */}
          <button onClick={() => setShowSlotPicker(true)} disabled={isProposingSlot}
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-50 cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: tk.calBtnBg }} aria-label="Proposer un créneau">
            {isProposingSlot
              ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4B6BFF', borderTopColor: 'transparent' }} />
              : <span style={{ color: '#4B6BFF' }}><CalendarIcon /></span>
            }
          </button>

          {/* Textarea */}
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Écrire un message…"
            rows={1}
            className="flex-1 min-w-0 rounded-2xl px-4 py-2.5 text-sm outline-none resize-none max-h-28 leading-relaxed"
            style={{ background: tk.inputFieldBg, border: `1px solid ${tk.inputFieldBdr}`, color: tk.textPrimary, minHeight: '42px' }}
          />

          {/* Envoyer */}
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)', boxShadow: '0 4px 14px rgba(75,107,255,0.35)' }}
            aria-label="Envoyer">
            {sending
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <SendIcon />
            }
          </button>
        </div>
      </div>

      {/* Modals */}
      {showSlotPicker && <SlotPickerModal onConfirm={proposerCreneau} onCancel={() => setShowSlotPicker(false)} tk={tk} />}
      {counterFor && <SlotPickerModal onConfirm={confirmCounter} onCancel={() => setCounterFor(null)} tk={tk} />}

      {/* Modal plainte */}
      {complainMsg && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={e => { if (e.target === e.currentTarget) setComplainMsg(null) }}>
          <div className="rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}
            style={{ background: tk.menuBg, border: `1px solid ${tk.menuBdr}`, boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="font-bold text-base" style={{ color: tk.textPrimary }}>Message supprimé</p>
                <p className="text-xs mt-0.5" style={{ color: tk.textMuted }}>Supprimé par un administrateur de la plateforme.</p>
              </div>
              <button onClick={() => setComplainMsg(null)} className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer" style={{ color: tk.textMuted }}>
                <XIcon />
              </button>
            </div>
            <div className="rounded-xl px-3 py-2 mb-4 text-xs italic" style={{ background: tk.deletedBg, border: `1px dashed ${tk.deletedBdr}`, color: tk.textMuted }}>
              Les administrateurs peuvent supprimer des messages qui enfreignent les conditions d'utilisation.
            </div>
            {complainSent ? (
              <div className="text-center py-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: 'rgba(76,175,80,0.12)' }}>
                  <CheckSuccessIcon />
                </div>
                <p className="font-bold text-sm" style={{ color: tk.textPrimary }}>Plainte envoyée</p>
                <p className="text-xs mt-1" style={{ color: tk.textMuted }}>Notre équipe examinera votre signalement.</p>
                <button onClick={() => setComplainMsg(null)} className="mt-3 w-full py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: '#4B6BFF' }}>Fermer</button>
              </div>
            ) : (
              <>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: tk.textPrimary }}>Motif de la plainte</label>
                <textarea
                  value={complainText}
                  onChange={e => setComplainText(e.target.value)}
                  placeholder="Expliquez pourquoi vous pensez que cette suppression est injustifiée…"
                  rows={4}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                  style={{ background: tk.inputFieldBg, border: `1px solid ${tk.inputFieldBdr}`, color: tk.textPrimary }}
                />
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setComplainMsg(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{ border: `1px solid ${tk.menuBdr}`, color: tk.textPrimary }}>Annuler</button>
                  <button
                    disabled={!complainText.trim() || complainSending}
                    onClick={async () => {
                      if (!complainText.trim()) return
                      setComplainSending(true)
                      try {
                        await chatApi.creerPlainte({ message_id: complainMsg.id, conversation_id: convId, contenu: complainText.trim() })
                        setComplainSent(true)
                      } catch {
                        setError("Impossible d'envoyer la plainte.")
                        setTimeout(() => setError(''), 5000)
                      }
                      setComplainSending(false)
                    }}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{ background: '#4B6BFF' }}>
                    {complainSending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Envoyer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
