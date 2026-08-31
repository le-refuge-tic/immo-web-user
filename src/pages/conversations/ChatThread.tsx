import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { chatApi } from '../../api/chatApi'
import { visitesApi } from '../../api/visitesApi'
import { io, Socket } from 'socket.io-client'

const WS_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1').replace('/api/v1', '')

const BIEN_TYPE_LABELS: Record<string, string> = {
  maison: 'Maison', appart_vide: 'Appartement', appart_meuble: 'Appt. meublé',
  guesthouse: 'Guesthouse', terrain: 'Terrain',
}
const SOUS_TYPE_LABELS: Record<string, string> = {
  villa: 'Villa', maison_individuelle: 'Maison indiv.', appartement: 'Appartement',
  chambre_salon: 'Chambre-Salon', entree_coucher: 'Entrée-Coucher', boutique: 'Boutique', terrain: 'Terrain',
}
const AVATAR_PALETTE = [
  'linear-gradient(135deg,#4B6BFF,#7B4BFF)',
  'linear-gradient(135deg,#FF6B35,#FF3B7A)',
  'linear-gradient(135deg,#00C6A2,#0099CC)',
  'linear-gradient(135deg,#F7B731,#F55252)',
  'linear-gradient(135deg,#A855F7,#6366F1)',
  'linear-gradient(135deg,#10B981,#3B82F6)',
]
function avatarGrad(id: number) { return AVATAR_PALETTE[Math.abs(id || 0) % AVATAR_PALETTE.length] }
function initial(name: string) { return name?.[0]?.toUpperCase() || '?' }
function timeLabel(s: string) { return new Date(s).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
function sameDay(a: string, b: string) {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}
function dateSep(s: string) {
  const d = new Date(s), now = new Date(), yest = new Date(now); yest.setDate(now.getDate() - 1)
  if (sameDay(s, now.toISOString())) return "Aujourd'hui"
  if (sameDay(s, yest.toISOString())) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}
function fmtSlot(dt: Date) {
  const J = ['dim.','lun.','mar.','mer.','jeu.','ven.','sam.']
  const M = ['janv','févr','mars','avr','mai','juin','juil','août','sept','oct','nov','déc']
  return `${J[dt.getDay()]} ${dt.getDate()} ${M[dt.getMonth()]} à ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
}
function displayName(o: any) { return o?.prenom || o?.pseudonyme || o?.nom || 'Contact' }
function roleLabel(o: any) {
  if (o?.role === 'demarcheur') return 'Agent immobilier'
  if (o?.role === 'proprietaire') return 'Propriétaire'
  if (o?.role === 'locataire') return 'Locataire'
  return ''
}

/* ── Statut lecture ── */
function MsgStatus({ status, isMe }: { status?: string; isMe: boolean }) {
  if (!isMe) return null
  const color = status === 'read' ? '#4B6BFF' : 'rgba(255,255,255,0.55)'
  if (status === 'sent') return (
    <svg width="11" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
  return (
    <svg width="15" height="10" viewBox="0 0 30 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="24 6 11 17 6 12" />
      <polyline points="30 6 17 17 15 15" />
    </svg>
  )
}

/* ── Icônes ── */
const BackIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
const DotsV = () => <svg width="4" height="18" viewBox="0 0 4 18" fill="currentColor"><circle cx="2" cy="2" r="1.8"/><circle cx="2" cy="9" r="1.8"/><circle cx="2" cy="16" r="1.8"/></svg>
const SendIcon = () => <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
const CalIcon = () => <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
const XIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const PinFill = () => <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
const ChevDown = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>

export default function ChatThread({ convId, onBack }: { convId: number; onBack: () => void }) {
  const { user, token } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const location = useLocation()

  /* ── state ── */
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [conv, setConv] = useState<any>(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [replyingTo, setReplyingTo] = useState<any>(null)
  const [editingMsg, setEditingMsg] = useState<any>(null)
  const [hidden, setHidden] = useState<Set<number>>(new Set())
  const [menuId, setMenuId] = useState<number | null>(null)
  const [showSlot, setShowSlot] = useState(false)
  const [counterFor, setCounterFor] = useState<any>(null)
  const [proposing, setProposing] = useState(false)
  const [paying, setPaying] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [complainMsg, setComplainMsg] = useState<any>(null)
  const [complainText, setComplainText] = useState('')
  const [complainSending, setComplainSending] = useState(false)
  const [complainSent, setComplainSent] = useState(false)
  const [showHeaderMenu, setShowHeaderMenu] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [atBottom, setAtBottom] = useState(true)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const headerMenuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  /* ── tokens ── */
  const tp   = isDark ? '#E8E8EF' : '#1D1D1F'
  const ts   = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)'
  const tm   = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)'
  const hdrBg = isDark ? 'rgba(12,12,20,0.95)' : 'rgba(245,245,250,0.92)'
  const hdrBdr = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const inpBg  = isDark ? 'rgba(12,12,20,0.95)' : 'rgba(245,245,250,0.92)'
  const inpFieldBg  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.88)'
  const inpFieldBdr = isDark ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.10)'
  const bubbleMeBg  = isDark ? 'linear-gradient(135deg,#3B55D4 0%,#5B30C4 100%)' : 'linear-gradient(135deg,#4B6BFF 0%,#7B4BFF 100%)'
  const bubbleOtherBg  = isDark ? 'rgba(32,32,48,0.95)' : 'rgba(255,255,255,0.92)'
  const bubbleOtherBdr = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'
  const menuBg  = isDark ? 'rgba(22,22,34,0.98)' : 'rgba(255,255,255,0.98)'
  const menuBdr = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)'
  const menuHov = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const divider = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const pinBg   = isDark ? 'rgba(28,28,44,0.92)' : 'rgba(255,255,255,0.92)'
  const sepBg   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const profileBg = isDark ? 'rgba(14,14,24,0.97)' : 'rgba(248,248,255,0.97)'
  const profileBdr = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const chatBg  = isDark ? '#0A0A12' : '#E8ECF4'
  const iconBtn = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)'

  /* ── load ── */
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [md, cd] = await Promise.all([chatApi.messages(convId), chatApi.conversations()])
        const msgs = Array.isArray(md) ? md : md.data || []
        setMessages(msgs.filter((m: any) => m.sender_id !== null))
        const list = Array.isArray(cd) ? cd : cd.data || []
        setConv(list.find((c: any) => c.id === convId) || null)
      } catch (_) {}
      setLoading(false)
    }
    load(); setHidden(new Set()); setReplyingTo(null); setEditingMsg(null)
  }, [convId])

  useEffect(() => {
    const draft = (location.state as any)?.draftMessage
    if (draft) { setInput(draft); navigate(location.pathname, { replace: true, state: {} }) }
  }, [location.state])

  useEffect(() => {
    if (!token) return
    const s = io(`${WS_URL}/chat`, { auth: { token }, transports: ['websocket'] })
    socketRef.current = s
    s.on('connect', () => s.emit('rejoindre', { conversation_id: convId }))
    s.on('message', (msg: any) => {
      if (msg.sender_id === null) return
      setMessages(prev => {
        const idx = prev.findIndex(m => m.id === msg.id)
        if (idx !== -1) { const c = [...prev]; c[idx] = msg; return c }
        return [...prev, msg]
      })
    })
    return () => { s.disconnect() }
  }, [token, convId])

  /* scroll tracking */
  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80)
  }, [])

  useEffect(() => {
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, atBottom])

  /* click outside header menu */
  useEffect(() => {
    if (!showHeaderMenu) return
    const fn = (e: MouseEvent) => { if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) setShowHeaderMenu(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [showHeaderMenu])

  const other = conv?.participants?.find((p: any) => p.id !== user?.id) || conv?.participants?.[0] || null
  const otherName = displayName(other)
  const role = roleLabel(other)
  const isClientRole = other?.role === 'demarcheur' || other?.role === 'proprietaire'
  const bienTypeLabel = conv?.bien ? (conv.bien.sousType ? SOUS_TYPE_LABELS[conv.bien.sousType] : BIEN_TYPE_LABELS[conv.bien.type]) || conv.bien.type : null
  const bienLoc = conv?.bien?.localisation ? (conv.bien.localisation.quartier || conv.bien.localisation.ville) : null

  const showError = (e: any) => { setError(e?.response?.data?.message || "Erreur d'envoi."); setTimeout(() => setError(''), 5000) }
  const scrollBot = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

  const send = async () => {
    const text = input.trim(); if (!text || sending) return
    if (editingMsg) {
      setInput(''); const ed = editingMsg; setEditingMsg(null)
      try { const u = await chatApi.modifierMessage(ed.id, text); setMessages(p => p.map(m => m.id === ed.id ? u : m)) } catch (e) { showError(e) }
      return
    }
    setInput(''); setSending(true)
    try {
      const rid = replyingTo?.id, rc = replyingTo?.contenu; setReplyingTo(null)
      const sent = await chatApi.envoyer(convId, text, rid, rc)
      setMessages(p => p.some(m => m.id === sent.id) ? p : [...p, sent])
    } catch (e) { showError(e) }
    setSending(false)
  }

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }
  const startReply = (m: any) => { if (m.type === 'slot_proposal') return; setReplyingTo(m); setEditingMsg(null); setMenuId(null); inputRef.current?.focus() }
  const startEdit  = (m: any) => { setEditingMsg(m); setReplyingTo(null); setInput(m.contenu); setMenuId(null); inputRef.current?.focus() }
  const cancelCtx  = () => { const wasEdit = !!editingMsg; setReplyingTo(null); setEditingMsg(null); if (wasEdit) setInput('') }
  const deleteForMe = (m: any) => { setHidden(p => new Set(p).add(m.id)); setMenuId(null) }

  const deleteForAll = async (m: any) => {
    setMenuId(null)
    if (!window.confirm('Supprimer pour tous ?')) return
    try {
      await chatApi.supprimerMessage(m.id)
      setMessages(p => p.map(x => x.id === m.id ? { ...x, contenu: 'Message supprimé', supprime_pour_tous: true, epingle: false } : x))
    } catch (e) { showError(e) }
  }

  const togglePin = async (m: any) => {
    setMenuId(null)
    const newId = m.epingle ? null : m.id
    try { await chatApi.togglePin(convId, newId); setMessages(p => p.map(x => ({ ...x, epingle: x.id === newId }))) } catch (e) { showError(e) }
  }

  const pinnedMsg = messages.filter(m => m.epingle && !m.supprime_pour_tous).slice(-1)[0]
  const lastSlot  = messages.filter(m => m.type === 'slot_proposal' && !m.supprime_pour_tous).slice(-1)[0]

  const findVisite = async () => {
    if (!conv?.bien?.id) return null
    try { const d = await visitesApi.mesVisites(); const l = Array.isArray(d) ? d : d.data || []; return l.find((v: any) => v.bien?.id === conv.bien.id) || null } catch { return null }
  }
  const proposerSlot = async (iso: string) => {
    setShowSlot(false); setProposing(true)
    try { const m = await chatApi.proposerCreneau(convId, iso); setMessages(p => [...p, m]); scrollBot() } catch (e) { showError(e) }
    setProposing(false)
  }
  const repondre = async (m: any, r: 'accepted'|'declined'|'countered') => {
    if (r === 'countered') { setCounterFor(m); return }
    try { const u = await chatApi.repondreProposition(m.id, r); setMessages(p => p.map(x => x.id === m.id ? u : x)) } catch (e) { showError(e) }
  }
  const confirmCounter = async (iso: string) => {
    const m = counterFor; setCounterFor(null); if (!m) return
    try {
      const nm = await chatApi.repondreProposition(m.id, 'countered', iso)
      setMessages(p => { const u = p.map(x => x.id === m.id ? { ...x, metadata: { ...x.metadata, status: 'countered' } } : x); return u.some(x => x.id === nm.id) ? u : [...u, nm] }); scrollBot()
    } catch (e) { showError(e) }
  }
  const copyCode = () => { if (!conv?.code_visite) return; navigator.clipboard?.writeText(conv.code_visite); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000) }
  const payer = async () => {
    if (!conv?.bien?.id) return; setPaying(true)
    try {
      const d = await visitesApi.mesVisites(); const l = Array.isArray(d) ? d : d.data || []
      const v = l.find((x: any) => x.bien?.id === conv.bien.id)
      if (!v) { alert('Aucune visite.'); return }
      if (v.paiement_effectue) { alert('Déjà payé ✓'); return }
      if (!(Number(v.frais_visite) > 0)) { alert('Visite gratuite.'); return }
      navigate('/mes-visites', { state: { openPayForVisiteId: v.id } })
    } catch { alert('Erreur.') }
    setPaying(false)
  }

  const canEdit = (m: any) => m.sender_id === user?.id && !m.supprime_pour_tous && Date.now() - new Date(m.created_at).getTime() <= 15 * 60_000
  const visible = messages.filter(m => !hidden.has(m.id))

  /* ── Menu item ── */
  const MI = ({ label, onClick, danger = false }: { label: string; onClick: () => void; danger?: boolean }) => (
    <button onClick={onClick} className="w-full text-left px-4 py-2.5 text-[13px] transition-colors cursor-pointer"
      style={{ color: danger ? '#EF4444' : tp }}
      onMouseEnter={e => (e.currentTarget.style.background = menuHov)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      {label}
    </button>
  )

  /* ── Bulle slot ── */
  const SlotBubble = ({ m }: { m: any }) => {
    const isMe = m.sender_id === user?.id
    const status = m.metadata?.status || 'pending'
    const dt = m.metadata?.proposed_at ? new Date(m.metadata.proposed_at) : null
    const p: Record<string, { bg: string; accent: string; label: string }> = {
      accepted: { bg: 'rgba(34,197,94,0.10)', accent: '#22C55E', label: 'Confirmé ✓' },
      declined:  { bg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', accent: '#94A3B8', label: 'Refusé' },
      countered: { bg: 'rgba(251,146,60,0.10)', accent: '#FB923C', label: 'Contre-proposé' },
      pending:   { bg: isMe ? 'rgba(75,107,255,0.12)' : (isDark ? 'rgba(32,32,48,0.9)' : 'rgba(255,255,255,0.9)'), accent: '#4B6BFF', label: isMe ? 'En attente…' : 'Créneau proposé' },
    }
    const pal = p[status] || p.pending
    return (
      <div className={`flex mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div className="rounded-2xl overflow-hidden max-w-[270px]" style={{ background: pal.bg, border: `1.5px solid ${pal.accent}44` }}>
          <div className="px-3 pt-2.5 pb-0.5">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: pal.accent }}>Créneau de visite</p>
            <p className="text-[13.5px] font-bold leading-snug" style={{ color: tp }}>{dt ? fmtSlot(dt) : '—'}</p>
            <p className="text-[11px] mt-1 font-medium" style={{ color: pal.accent }}>{pal.label}</p>
          </div>
          {!isMe && status === 'pending' && (
            <div className="px-3 pb-2.5 pt-2 flex flex-col gap-1.5" style={{ borderTop: `1px solid ${pal.accent}22` }}>
              <div className="flex gap-1.5">
                <button onClick={() => repondre(m, 'accepted')} className="flex-1 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer" style={{ background: 'rgba(34,197,94,0.14)', color: '#22C55E' }}>Confirmer</button>
                <button onClick={() => repondre(m, 'declined')} className="flex-1 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer" style={{ background: 'rgba(239,68,68,0.10)', color: '#EF4444' }}>Rejeter</button>
              </div>
              <button onClick={() => repondre(m, 'countered')} className="w-full py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer" style={{ background: 'rgba(75,107,255,0.10)', color: '#4B6BFF' }}>Autre date</button>
            </div>
          )}
          {status === 'accepted' && conv?.bien?.id && isClientRole && (
            <div className="px-3 pb-2.5 pt-2" style={{ borderTop: `1px solid ${pal.accent}22` }}>
              <button onClick={payer} disabled={paying} className="w-full py-1.5 rounded-lg text-[12px] font-bold cursor-pointer disabled:opacity-50" style={{ background: 'rgba(34,197,94,0.14)', color: '#22C55E' }}>
                {paying ? '…' : 'Payer maintenant'}
              </button>
            </div>
          )}
          <div className="px-3 pb-2">
            <p className="text-[10px] text-right" style={{ color: tm }}>{timeLabel(m.created_at)}</p>
          </div>
        </div>
      </div>
    )
  }

  /* ── Panneau profil (desktop droit / mobile drawer) ── */
  const ProfilePanel = ({ onClose }: { onClose: () => void }) => (
    <div className="h-full flex flex-col" style={{ background: profileBg, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', borderLeft: `1px solid ${profileBdr}` }}>
      {/* Header profil */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: `1px solid ${divider}` }}>
        <p className="text-[13px] font-bold uppercase tracking-widest" style={{ color: tm }}>Infos du contact</p>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: iconBtn, color: ts }}>
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
            <p className="text-[16px] font-bold" style={{ color: tp }}>{otherName}</p>
            {role && (
              <span className="inline-block mt-1 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: 'rgba(75,107,255,0.12)', color: '#4B6BFF' }}>
                {role}
              </span>
            )}
          </div>
          {/* Présence */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-[12px] font-medium" style={{ color: ts }}>En ligne</span>
          </div>
        </div>

        {/* Action rapide — voir le bien */}
        {conv?.bien?.id && (
          <button onClick={() => navigate(`/biens/${conv.bien.id}`)}
            className="flex items-center gap-2.5 w-full px-3.5 py-3 rounded-2xl cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: 'rgba(75,107,255,0.10)', border: '1px solid rgba(75,107,255,0.18)' }}>
            <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#4B6BFF' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            <div className="text-left min-w-0">
              <p className="text-[12px] font-bold" style={{ color: '#4B6BFF' }}>Voir le bien</p>
              {bienTypeLabel && <p className="text-[11px] truncate" style={{ color: ts }}>{bienTypeLabel}{bienLoc ? ` · ${bienLoc}` : ''}</p>}
            </div>
            <svg className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: '#4B6BFF' }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        )}

        {/* Actions signalement */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${divider}` }}>
          {[
            { label: 'Mode silencieux', action: () => {} },
            { label: 'Bloquer ce contact', action: () => {}, danger: true },
            { label: 'Signaler', action: () => {}, danger: true },
          ].map(({ label, action, danger }) => (
            <button key={label} onClick={action} className="w-full text-left px-4 py-3 text-[13px] transition-colors cursor-pointer flex items-center justify-between"
              style={{ color: danger ? '#EF4444' : tp, borderBottom: `1px solid ${divider}` }}
              onMouseEnter={e => (e.currentTarget.style.background = menuHov)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {label}
              {!danger && <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  /* ── Modal slot picker ── */
  const SlotModal = ({ onConfirm, onCancel }: { onConfirm: (iso: string) => void; onCancel: () => void }) => {
    const tom = new Date(Date.now() + 86400000)
    const [date, setDate] = useState(tom.toISOString().slice(0, 10))
    const [time, setTime] = useState('09:00')
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onCancel}>
        <div className="rounded-3xl p-5 w-full max-w-xs anim-scale-in" onClick={e => e.stopPropagation()}
          style={{ background: menuBg, border: `1px solid ${menuBdr}`, boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}>
          <p className="font-bold text-[15px] mb-4" style={{ color: tp }}>Proposer un créneau</p>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: tm }}>Date</label>
              <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={e => setDate(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ background: inpFieldBg, border: `1px solid ${inpFieldBdr}`, color: tp }} />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: tm }}>Heure</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ background: inpFieldBg, border: `1px solid ${inpFieldBdr}`, color: tp }} />
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer" style={{ border: `1px solid ${menuBdr}`, color: tp }}>Annuler</button>
            <button onClick={() => onConfirm(new Date(`${date}T${time}`).toISOString())} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer" style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>Confirmer</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col md:flex-row" style={{ background: chatBg }}>

      {/* ═══ ZONE CHAT ═══ */}
      <div className="flex-1 flex flex-col min-w-0 h-full">

        {/* Header */}
        <div className="flex-shrink-0 safe-top px-4 pt-3 pb-3"
          style={{ background: hdrBg, backdropFilter: 'blur(48px) saturate(200%)', WebkitBackdropFilter: 'blur(48px) saturate(200%)', borderBottom: `1px solid ${hdrBdr}` }}>
          <div className="flex items-center gap-2.5">
            <button onClick={onBack} className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer transition-opacity hover:opacity-70"
              style={{ background: iconBtn, color: tp }}>
              <BackIcon />
            </button>

            {/* Avatar cliquable → ouvre profil */}
            <button onClick={() => setShowProfile(p => !p)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer group">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                style={{ background: avatarGrad(other?.id ?? 0) }}>
                <span className="text-white font-bold text-sm">{initial(otherName)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold truncate leading-tight" style={{ color: tp }}>{otherName}</p>
                {role && <p className="text-[11px] font-semibold" style={{ color: '#4B6BFF' }}>{role}</p>}
              </div>
            </button>

            {/* Bien lié — compact */}
            {bienTypeLabel && conv?.bien && (
              <button onClick={() => navigate(`/biens/${conv.bien.id}`)}
                className="hidden sm:flex flex-col text-left px-2.5 py-1.5 rounded-xl flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'}`, maxWidth: 110 }}>
                <p className="text-[11px] font-bold truncate" style={{ color: tp }}>{bienTypeLabel}</p>
                {bienLoc && <p className="text-[10px] truncate" style={{ color: tm }}>{bienLoc}</p>}
              </button>
            )}

            {/* Menu 3 points */}
            <div className="relative flex-shrink-0" ref={headerMenuRef}>
              <button onClick={() => setShowHeaderMenu(v => !v)}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer transition-all"
                style={{ background: showHeaderMenu ? 'rgba(75,107,255,0.14)' : iconBtn, color: showHeaderMenu ? '#4B6BFF' : ts }}
                aria-label="Options">
                <DotsV />
              </button>
              {showHeaderMenu && (
                <div className="absolute right-0 top-full mt-2 z-[120] rounded-2xl py-1.5 min-w-[200px] anim-fade-down"
                  style={{ background: isDark ? '#161622' : '#FFFFFF', border: `1px solid ${menuBdr}`, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.55)' : '0 16px 48px rgba(0,0,0,0.20)' }}>
                  <MI label="Infos du contact" onClick={() => { setShowProfile(true); setShowHeaderMenu(false) }} />
                  {conv?.bien?.id && <MI label="Voir le bien" onClick={() => { navigate(`/biens/${conv.bien.id}`); setShowHeaderMenu(false) }} />}
                  <div className="h-px my-1" style={{ background: divider }} />
                  <MI label="Mode silencieux" onClick={() => setShowHeaderMenu(false)} />
                  <MI label="Bloquer" onClick={() => setShowHeaderMenu(false)} danger />
                  <MI label="Signaler" onClick={() => setShowHeaderMenu(false)} danger />
                </div>
              )}
            </div>
          </div>

          {/* Code visite */}
          {conv?.code_visite && (
            <button onClick={copyCode} className="mt-2.5 flex items-center gap-2 px-3 py-1.5 rounded-xl w-full cursor-pointer hover:opacity-80 transition-opacity"
              style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)'}` }}>
              <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#4B6BFF' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/>
              </svg>
              <span className="text-[12px] font-bold tracking-wider flex-1" style={{ color: tp }}>Code visite : {conv.code_visite}</span>
              <span className="text-[11px] font-bold flex-shrink-0" style={{ color: '#4B6BFF' }}>{codeCopied ? 'Copié !' : 'Copier'}</span>
            </button>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div className="mx-4 mt-2 flex-shrink-0 text-white text-xs rounded-xl px-4 py-2.5 flex items-center gap-2 anim-fade-down" style={{ background: '#EF4444' }}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {error}
          </div>
        )}

        {/* ── Messages ── */}
        <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 scrollbar-auto relative"
          onClick={() => { setMenuId(null); setMenuPos(null); setShowHeaderMenu(false) }}>

          {/* Message épinglé */}
          {pinnedMsg && (
            <div className="flex items-center gap-2 rounded-2xl px-3 py-2 mb-3 border-l-4 anim-fade-in"
              style={{ background: pinBg, backdropFilter: 'blur(20px)', borderLeftColor: '#4B6BFF', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <span style={{ color: '#4B6BFF' }}><PinFill /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#4B6BFF' }}>Épinglé</p>
                <p className="text-[12px] truncate" style={{ color: tp }}>{pinnedMsg.contenu}</p>
              </div>
            </div>
          )}

          {/* Dernier créneau — bandeau */}
          {lastSlot && (() => {
            const status = lastSlot.metadata?.status || 'pending'
            const dt = lastSlot.metadata?.proposed_at ? new Date(lastSlot.metadata.proposed_at) : null
            const cfg: Record<string, { accent: string; label: string }> = {
              accepted: { accent: '#22C55E', label: 'Créneau confirmé' },
              declined: { accent: '#EF4444', label: 'Créneau refusé' },
              countered: { accent: '#FB923C', label: 'Contre-proposition' },
              pending: { accent: '#4B6BFF', label: 'Créneau en discussion' },
            }
            const c = cfg[status] || cfg.pending
            return (
              <button onClick={() => document.getElementById(`msg-${lastSlot.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className="w-full flex items-center gap-2.5 rounded-2xl px-3 py-2.5 mb-3 border-l-4 text-left cursor-pointer anim-fade-in"
                style={{ background: pinBg, backdropFilter: 'blur(20px)', borderLeftColor: c.accent, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.accent }}>{c.label}</p>
                  <p className="text-[12px] font-semibold truncate" style={{ color: tp }}>{dt ? fmtSlot(dt) : '—'}</p>
                </div>
                <ChevDown />
              </button>
            )
          })()}

          {/* Liste messages */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="w-7 h-7 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: '#4B6BFF', borderTopColor: 'transparent' }} />
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(75,107,255,0.10)' }}>
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#4B6BFF" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <p className="text-[13px] font-semibold" style={{ color: tm }}>Démarrez la conversation</p>
            </div>
          ) : visible.map((msg, i) => {
            const isMe = msg.sender_id === user?.id
            const sep = i === 0 || !sameDay(visible[i - 1].created_at, msg.created_at)
            const prevIsMe = i > 0 && visible[i - 1].sender_id === user?.id && visible[i - 1].type !== 'slot_proposal'
            const grouped = !sep && isMe === prevIsMe

            if (msg.type === 'slot_proposal') {
              return (
                <div key={msg.id} id={`msg-${msg.id}`}>
                  {sep && <div className="flex items-center gap-3 my-3"><div className="flex-1 h-px" style={{ background: sepBg }} /><span className="text-[11px] px-2 font-medium" style={{ color: tm }}>{dateSep(msg.created_at)}</span><div className="flex-1 h-px" style={{ background: sepBg }} /></div>}
                  <SlotBubble m={msg} />
                </div>
              )
            }

            const isSupprime = msg.supprime_pour_tous
            return (
              <div key={msg.id} id={`msg-${msg.id}`}>
                {sep && <div className="flex items-center gap-3 my-3"><div className="flex-1 h-px" style={{ background: sepBg }} /><span className="text-[11px] px-2 font-medium" style={{ color: tm }}>{dateSep(msg.created_at)}</span><div className="flex-1 h-px" style={{ background: sepBg }} /></div>}

                <div className={`flex group items-end gap-1 ${isMe ? 'justify-end' : 'justify-start'} ${grouped ? 'mb-0.5' : 'mb-1.5'}`}>
                  <div className="relative max-w-[55%] sm:max-w-[50%]">

                    {isSupprime ? (
                      <div className="px-3 py-2 rounded-2xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px dashed ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}` }}>
                        <p className="text-[13px] italic" style={{ color: tm }}>Message supprimé</p>
                        <button onClick={e => { e.stopPropagation(); setComplainMsg(msg); setComplainText(''); setComplainSent(false) }}
                          className="text-[11px] underline mt-0.5 cursor-pointer" style={{ color: '#4B6BFF' }}>En savoir plus</button>
                        <p className="text-[10px] mt-1" style={{ color: tm }}>{timeLabel(msg.created_at)}</p>
                      </div>
                    ) : (
                      <div className={`${isMe ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'} ${grouped && isMe ? 'rounded-tr-md' : ''} ${grouped && !isMe ? 'rounded-tl-md' : ''}`}
                        style={isMe
                          ? { background: bubbleMeBg, padding: '7px 11px' }
                          : { background: bubbleOtherBg, border: `1px solid ${bubbleOtherBdr}`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '7px 11px', color: tp }
                        }>
                        {/* Citation */}
                        {msg.reply_to_contenu && (
                          <div className="text-[12px] px-2 py-1 rounded-lg mb-1.5 border-l-2 line-clamp-2"
                            style={isMe
                              ? { borderLeftColor: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }
                              : { borderLeftColor: '#4B6BFF', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(75,107,255,0.06)', color: ts }
                            }>
                            {msg.reply_to_contenu}
                          </div>
                        )}
                        {/* Texte */}
                        <p className="text-[13.5px] leading-[1.45] break-words" style={{ color: isMe ? '#fff' : tp }}>{msg.contenu}</p>
                        {/* Footer */}
                        <div className="flex items-center gap-1 mt-0.5 justify-end">
                          {msg.modifie && <span className="text-[10px] italic" style={{ color: isMe ? 'rgba(255,255,255,0.50)' : tm }}>modifié ·</span>}
                          <span className="text-[10px]" style={{ color: isMe ? 'rgba(255,255,255,0.50)' : tm }}>{timeLabel(msg.created_at)}</span>
                          <MsgStatus status={msg.status} isMe={isMe} />
                        </div>
                      </div>
                    )}

                    {/* Bouton ⋯ visible au hover */}
                    {!isSupprime && (
                      <button onClick={e => {
                          e.stopPropagation()
                          const rect = e.currentTarget.getBoundingClientRect()
                          if (menuId === msg.id) { setMenuId(null); setMenuPos(null) }
                          else { setMenuId(msg.id); setMenuPos({ top: rect.top, right: window.innerWidth - rect.right }) }
                        }}
                        className="absolute top-0 -right-8 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
                        style={{ background: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.09)', color: ts }}
                        aria-label="Options">
                        ···
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} className="h-1" />
        </div>

        {/* Bouton scroll bas */}
        {!atBottom && (
          <button onClick={() => { scrollBot(); setAtBottom(true) }}
            className="absolute bottom-24 right-5 z-20 w-9 h-9 rounded-full flex items-center justify-center shadow-lg cursor-pointer anim-scale-in"
            style={{ background: isDark ? 'rgba(28,28,44,0.95)' : 'rgba(255,255,255,0.95)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'}`, backdropFilter: 'blur(20px)', color: tp }}>
            <ChevDown />
          </button>
        )}

        {/* Zone saisie */}
        <div className="flex-shrink-0" style={{ background: inpBg, backdropFilter: 'blur(48px) saturate(200%)', WebkitBackdropFilter: 'blur(48px) saturate(200%)', borderTop: `1px solid ${hdrBdr}` }}>
          {/* Contexte réponse / modification */}
          {(replyingTo || editingMsg) && (
            <div className="px-4 pt-2.5 pb-1 flex items-center gap-2.5">
              <div className="w-[3px] h-9 rounded-full flex-shrink-0" style={{ background: '#4B6BFF' }} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold" style={{ color: '#4B6BFF' }}>{editingMsg ? 'Modifier' : `Répondre à ${otherName.split(' ')[0]}`}</p>
                <p className="text-[12px] truncate" style={{ color: tm }}>{editingMsg?.contenu ?? replyingTo?.contenu}</p>
              </div>
              <button onClick={cancelCtx} className="w-7 h-7 flex items-center justify-center flex-shrink-0 cursor-pointer" style={{ color: tm }}><XIcon /></button>
            </div>
          )}
          <div className="px-3 py-2.5 flex items-end gap-2 safe-bottom">
            {/* Calendrier */}
            <button onClick={() => setShowSlot(true)} disabled={proposing}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-50 cursor-pointer transition-opacity hover:opacity-80"
              style={{ background: 'rgba(75,107,255,0.12)', color: '#4B6BFF' }}>
              {proposing ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4B6BFF', borderTopColor: 'transparent' }} /> : <CalIcon />}
            </button>
            {/* Textarea */}
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Écrire un message…" rows={1}
              className="flex-1 min-w-0 rounded-2xl px-4 py-2 text-[14px] outline-none resize-none max-h-28 leading-relaxed"
              style={{ background: inpFieldBg, border: `1px solid ${inpFieldBdr}`, color: tp, minHeight: '40px' }} />
            {/* Envoyer */}
            <button onClick={send} disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 cursor-pointer transition-transform hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)', boxShadow: input.trim() ? '0 4px 16px rgba(75,107,255,0.40)' : 'none' }}>
              {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <SendIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ PANNEAU PROFIL — desktop côté droit ═══ */}
      {showProfile && (
        <div className="hidden md:block w-[280px] xl:w-[300px] flex-shrink-0 h-full anim-slide-left">
          <ProfilePanel onClose={() => setShowProfile(false)} />
        </div>
      )}

      {/* ═══ PANNEAU PROFIL — mobile drawer ═══ */}
      {showProfile && (
        <div className="md:hidden fixed inset-0 z-50 flex" onClick={() => setShowProfile(false)}>
          <div className="flex-1 bg-black/40" />
          <div className="w-[85%] max-w-sm h-full anim-slide-left" onClick={e => e.stopPropagation()}>
            <ProfilePanel onClose={() => setShowProfile(false)} />
          </div>
        </div>
      )}

      {/* Menu contextuel message — fixed pour éviter le clip du scroll container */}
      {menuId !== null && menuPos && (() => {
        const m = visible.find(x => x.id === menuId)
        if (!m) return null
        return (
          <div className="fixed z-[120] rounded-2xl py-1.5 min-w-[190px] anim-fade-down"
            style={{ top: menuPos.top, right: menuPos.right, background: isDark ? '#161622' : '#FFFFFF', border: `1px solid ${menuBdr}`, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.55)' : '0 12px 40px rgba(0,0,0,0.24)' }}
            onClick={e => e.stopPropagation()}>
            <MI label="Répondre" onClick={() => startReply(m)} />
            {canEdit(m) && <MI label="Modifier" onClick={() => startEdit(m)} />}
            <MI label={m.epingle ? 'Désépingler' : 'Épingler'} onClick={() => togglePin(m)} />
            <div className="h-px my-1" style={{ background: divider }} />
            {!m.supprime_pour_tous && <MI label="Supprimer pour moi" onClick={() => deleteForMe(m)} danger />}
            {m.sender_id === user?.id && !m.supprime_pour_tous && <MI label="Supprimer pour tous" onClick={() => deleteForAll(m)} danger />}
          </div>
        )
      })()}

      {/* Modals */}
      {showSlot && <SlotModal onConfirm={proposerSlot} onCancel={() => setShowSlot(false)} />}
      {counterFor && <SlotModal onConfirm={confirmCounter} onCancel={() => setCounterFor(null)} />}

      {/* Modal plainte */}
      {complainMsg && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={e => { if (e.target === e.currentTarget) setComplainMsg(null) }}>
          <div className="rounded-3xl p-5 w-full max-w-sm anim-scale-in" onClick={e => e.stopPropagation()}
            style={{ background: menuBg, border: `1px solid ${menuBdr}`, boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div><p className="font-bold text-[15px]" style={{ color: tp }}>Message supprimé</p>
                <p className="text-[12px] mt-0.5" style={{ color: tm }}>Supprimé par un administrateur.</p></div>
              <button onClick={() => setComplainMsg(null)} className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0" style={{ color: tm, background: iconBtn }}><XIcon /></button>
            </div>
            {complainSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(34,197,94,0.12)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="font-bold text-[14px] mb-1" style={{ color: tp }}>Plainte envoyée</p>
                <p className="text-[12px]" style={{ color: tm }}>Notre équipe examinera votre signalement.</p>
                <button onClick={() => setComplainMsg(null)} className="mt-4 w-full py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer" style={{ background: '#4B6BFF' }}>Fermer</button>
              </div>
            ) : (
              <>
                <textarea value={complainText} onChange={e => setComplainText(e.target.value)}
                  placeholder="Expliquez pourquoi cette suppression est injustifiée…" rows={4}
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none resize-none mb-3"
                  style={{ background: inpFieldBg, border: `1px solid ${inpFieldBdr}`, color: tp }} />
                <div className="flex gap-2">
                  <button onClick={() => setComplainMsg(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer" style={{ border: `1px solid ${menuBdr}`, color: tp }}>Annuler</button>
                  <button disabled={!complainText.trim() || complainSending} onClick={async () => {
                    if (!complainText.trim()) return; setComplainSending(true)
                    try { await chatApi.creerPlainte({ message_id: complainMsg.id, conversation_id: convId, contenu: complainText.trim() }); setComplainSent(true) }
                    catch { setError("Impossible d'envoyer."); setTimeout(() => setError(''), 5000) }
                    setComplainSending(false)
                  }} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center cursor-pointer" style={{ background: '#4B6BFF' }}>
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
