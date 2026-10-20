import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react'
import { API_ORIGIN } from '../../api/apiBase'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePageTitle } from '../../utils/usePageTitle'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { chatApi } from '../../api/chatApi'
import { visitesApi } from '../../api/visitesApi'
import { io, Socket } from 'socket.io-client'
import { apiMessage } from '../../utils/apiMessage'
import { suggestPush } from '../../lib/push'
import { ModalSheet } from '../../components/ui/ModalSheet'
import { MenuPopover, MenuItem } from '../../components/ui/MenuPopover'
import { useMediaQuery } from '../../hooks/useMediaQuery'

import { SlotModal, type SlotColors } from './chat/SlotModal'
import { ProfilePanel } from './chat/ProfilePanel'
import { ComplaintModal } from './chat/ComplaintModal'
import { MessageList } from './chat/MessageList'
import { BackIcon, DotsV, SendIcon, CalIcon, XIcon, PinFill, ChevDown } from './chat/icons'
import { BIEN_TYPE_LABELS, SOUS_TYPE_LABELS, avatarGrad, initial, fmtSlot, displayName, roleLabel, getChatColors } from './chat/helpers'
const WS_URL = API_ORIGIN

export default function ChatThread({ convId, onBack, initialDraft }: { convId: number; onBack: () => void; initialDraft?: string }) {
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
  const [confirmDeleteForAllId, setConfirmDeleteForAllId] = useState<number | null>(null)
  const [complainMsg, setComplainMsg] = useState<any>(null)
  const [showHeaderMenu, setShowHeaderMenu] = useState(false)
  const [headerMenuPos, setHeaderMenuPos] = useState<{ top: number; right: number } | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [atBottom, setAtBottom] = useState(true)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const [hoveredSettingsIdx, setHoveredSettingsIdx] = useState<number | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const headerMenuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  /* ── Design tokens (light par défaut, dark optionnel) ── */
  const colors = getChatColors(isDark)
  const { tp, ts, tm, chatBg, hdrBg, hdrBdr, inpBg, inpFieldBg, inpFieldBdr, menuBg, menuBdr, menuHov, divider, pinBg, iconBtn } = colors
  const slotColors: SlotColors = { menuBg, menuBdr, tp, tm, inpFieldBg, inpFieldBdr }
  const isMobileViewport = useMediaQuery('(max-width: 767px)')

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
      } catch {}
      setLoading(false)
    }
    setConv(null); setMessages([]); setShowProfile(false)
    load(); setHidden(new Set()); setReplyingTo(null); setEditingMsg(null)
  }, [convId])

  useEffect(() => {
    const draft = (location.state as any)?.draftMessage || initialDraft
    if (draft) {
      setInput(draft)
      if ((location.state as any)?.draftMessage) navigate(location.pathname, { replace: true, state: {} })
    }
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- navigate et le chemin courant ne servent qu'à effacer l'état de navigation une fois le brouillon consommé
  }, [location.state, initialDraft])

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
    const fn = (e: MouseEvent) => {
      const t = e.target as Node
      if (headerMenuRef.current?.contains(t)) return
      if ((t as HTMLElement).closest?.('[data-headermenu]')) return
      setShowHeaderMenu(false); setHeaderMenuPos(null)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [showHeaderMenu])

  const other = conv?.participants?.find((p: any) => p.id !== user?.id) || conv?.participants?.[0] || null
  const otherName = displayName(other)
  usePageTitle(otherName !== 'Contact' ? `Conversation – ${otherName}` : 'Conversation')
  const role = roleLabel(other)
  const isClientRole = other?.role === 'demarcheur' || other?.role === 'proprietaire'
  const bienTypeLabel = conv?.bien ? (conv.bien.sousType ? SOUS_TYPE_LABELS[conv.bien.sousType] : BIEN_TYPE_LABELS[conv.bien.type]) || conv.bien.type : null
  const bienLoc = conv?.bien?.localisation ? (conv.bien.localisation.quartier || conv.bien.localisation.ville) : null
  const isVerified = !!(other?.verifie ?? other?.is_verified ?? other?.identite_verifiee)
  const isOnline = !!(other?.isOnline ?? conv?.isOnline)

  const showError = (e: any) => { setError(apiMessage(e) || "Erreur d'envoi."); setTimeout(() => setError(''), 5000) }
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
      suggestPush()
    } catch (e) { showError(e) }
    setSending(false)
  }

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }
  const startReply = (m: any) => { if (m.type === 'slot_proposal') return; setReplyingTo(m); setEditingMsg(null); setMenuId(null); inputRef.current?.focus() }
  const startEdit  = (m: any) => { setEditingMsg(m); setReplyingTo(null); setInput(m.contenu); setMenuId(null); inputRef.current?.focus() }
  const cancelCtx  = () => { const wasEdit = !!editingMsg; setReplyingTo(null); setEditingMsg(null); if (wasEdit) setInput('') }
  const deleteForMe = (m: any) => { setHidden(p => new Set(p).add(m.id)); setMenuId(null) }

  const deleteForAll = async (m: any) => {
    setConfirmDeleteForAllId(null)
    setMenuId(null)
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
      if (!v) { showError({ response: { data: { message: 'Aucune visite trouvée.' } } }); setPaying(false); return }
      if (v.paiement_effectue) { showError({ response: { data: { message: 'Cette visite a déjà été payée.' } } }); setPaying(false); return }
      if (!(Number(v.frais_visite) > 0)) { showError({ response: { data: { message: 'Cette visite est gratuite.' } } }); setPaying(false); return }
      navigate('/mes-visites', { state: { openPayForVisiteId: v.id } })
    } catch { showError({ response: { data: { message: 'Une erreur est survenue.' } } }) }
    setPaying(false)
  }

  const canEdit = (m: any) => m.sender_id === user?.id && !m.supprime_pour_tous && Date.now() - new Date(m.created_at).getTime() <= 15 * 60_000
  const visible = messages.filter(m => !hidden.has(m.id))


  /* ── Panneau profil (desktop droit / mobile drawer) ── */
  // Fonction de rendu (et non composant) : le panneau n'est pas remonté à chaque message reçu
  const renderProfilePanel = ({ onClose }: { onClose: () => void }) => (
    <ProfilePanel onClose={onClose} colors={colors} other={other} otherName={otherName} role={role} isVerified={isVerified}
      isOnline={isOnline} conv={conv} bienTypeLabel={bienTypeLabel} bienLoc={bienLoc}
      hoveredSettingsIdx={hoveredSettingsIdx} onHoverSettings={setHoveredSettingsIdx} onOpenBien={id => navigate(`/biens/${id}`)} />
  )

  return (
    <div className="flex flex-col md:flex-row fixed inset-0 z-40 md:static md:z-auto md:h-full" style={{ background: chatBg, minHeight: 0 }}>

      {/* ═══ ZONE CHAT ═══ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 safe-top px-4 pt-3 pb-3"
          style={{ background: hdrBg, borderBottom: `1px solid ${hdrBdr}` }}>
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors hover:opacity-75"
              style={{ background: iconBtn, color: tp }}>
              <BackIcon />
            </button>

            {/* Avatar cliquable → ouvre profil */}
            <button onClick={() => setShowProfile(p => !p)} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer group">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-105"
                  style={{ background: avatarGrad(other?.id ?? 0) }}>
                  <span className="text-white font-bold text-sm">{initial(otherName)}</span>
                </div>
                {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 bg-green-400" style={{ borderColor: hdrBg }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-[14.5px] font-bold truncate leading-tight" style={{ color: tp }}>{otherName}</p>
                  {isVerified && (
                    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="#4160F2" aria-label="Vérifié">
                      <path d="M12 2l2.2 1.6 2.7-.3 1 2.5 2.3 1.4-.6 2.7 1.4 2.3-1.9 2 .1 2.7-2.6.8-1.4 2.3-2.6-.7L12 22l-2-1.4-2.6.7-1.4-2.3-2.6-.8.1-2.7-1.9-2 1.4-2.3-.6-2.7 2.3-1.4 1-2.5 2.7.3z"/>
                      <path d="M10.6 14.6l-2.2-2.2 1.1-1.1 1.1 1.1 3.3-3.3 1.1 1.1z" fill="#fff"/>
                    </svg>
                  )}
                </div>
                {role ? <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--tx-blue)' }}>{role}</p>
                  : isOnline ? <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--tx-green)' }}>En ligne</p> : null}
              </div>
            </button>

            {/* Bien lié — compact */}
            {bienTypeLabel && conv?.bien && (
              <button onClick={() => navigate(`/biens/${conv.bien.id}`)}
                className="hidden sm:flex flex-col text-left px-3 py-2 rounded-xl flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: inpFieldBg, border: `1px solid ${inpFieldBdr}`, maxWidth: 120 }}>
                <p className="text-[11.5px] font-semibold truncate" style={{ color: tp }}>{bienTypeLabel}</p>
                {bienLoc && <p className="text-micro truncate mt-0.5" style={{ color: ts }}>{bienLoc}</p>}
              </button>
            )}

            {/* Menu 3 points */}
            <div className="flex-shrink-0" ref={headerMenuRef}>
              <button onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  if (showHeaderMenu) { setShowHeaderMenu(false); setHeaderMenuPos(null) }
                  else { setShowHeaderMenu(true); setHeaderMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right }) }
                }}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors"
                style={{ background: showHeaderMenu ? 'rgba(75,107,255,0.12)' : iconBtn, color: showHeaderMenu ? '#4160F2' : ts }}
                aria-label="Options" aria-haspopup="menu" aria-expanded={showHeaderMenu}>
                <DotsV />
              </button>
            </div>
          </div>

          {/* Code visite */}
          {conv?.code_visite && (
            <button onClick={copyCode} className="mt-3 flex items-center gap-2 px-3.5 py-2 rounded-xl w-full cursor-pointer hover:opacity-80 transition-opacity"
              style={{ background: inpFieldBg, border: `1px solid ${inpFieldBdr}` }}>
              <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--tx-blue)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/>
              </svg>
              <span className="text-[12px] font-semibold flex-1" style={{ color: tp }}>Code visite : {conv.code_visite}</span>
              <span className="text-caption font-bold flex-shrink-0" style={{ color: 'var(--tx-blue)' }}>{codeCopied ? 'Copié !' : 'Copier'}</span>
            </button>
          )}
        </div>

        {/* Erreur */}
        <div role="alert" aria-live="assertive" aria-atomic="true">
          {error && (
            <div className="mx-4 mt-2 flex-shrink-0 text-white text-xs rounded-xl px-4 py-2.5 flex items-center gap-2 anim-fade-down" style={{ background: '#DC2626' }}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {error}
            </div>
          )}
        </div>

        {/* ── Bandeaux fixes (épinglé + créneau) ── */}
        {(pinnedMsg || lastSlot) && (
          <div className="flex-shrink-0 px-3 sm:px-4 pt-3 space-y-2">
            {/* Message épinglé */}
            {pinnedMsg && (
              <button onClick={() => document.getElementById(`msg-${pinnedMsg.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className="flex items-center gap-2 w-full rounded-xl px-3 py-2 border-l-4 text-left cursor-pointer anim-fade-in"
                style={{ background: pinBg, borderLeftColor: '#4160F2', border: `1px solid ${divider}`, borderLeft: '4px solid #4160F2' }}>
                <span style={{ color: 'var(--tx-blue)' }}><PinFill /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-micro font-bold uppercase tracking-wider" style={{ color: 'var(--tx-blue)' }}>Épinglé</p>
                  <p className="text-[12px] truncate" style={{ color: tp }}>{pinnedMsg.contenu}</p>
                </div>
              </button>
            )}

            {/* Dernier créneau — bandeau */}
            {lastSlot && (() => {
              const status = lastSlot.metadata?.status || 'pending'
              const dt = lastSlot.metadata?.proposed_at ? new Date(lastSlot.metadata.proposed_at) : null
              const cfg: Record<string, { accent: string; label: string }> = {
                accepted: { accent: '#15803D', label: 'Créneau confirmé' },
                declined: { accent: '#DC2626', label: 'Créneau refusé' },
                countered: { accent: '#FB923C', label: 'Contre-proposition' },
                pending: { accent: '#4160F2', label: 'Créneau en discussion' },
              }
              const c = cfg[status] || cfg.pending
              return (
                <button onClick={() => document.getElementById(`msg-${lastSlot.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left cursor-pointer anim-fade-in"
                  style={{ background: pinBg, border: `1px solid ${divider}`, borderLeft: `4px solid ${c.accent}` }}>
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="text-micro font-bold uppercase tracking-wider" style={{ color: c.accent }}>{c.label}</p>
                    <p className="text-[12px] font-semibold truncate" style={{ color: tp }}>{dt ? fmtSlot(dt) : '—'}</p>
                  </div>
                  <ChevDown />
                </button>
              )
            })()}
          </div>
        )}

        <MessageList scrollRef={scrollRef} bottomRef={bottomRef} onScroll={onScroll}
          onBackgroundClick={() => { setMenuId(null); setMenuPos(null); setShowHeaderMenu(false) }}
          loading={loading} visible={visible} userId={user?.id} isDark={isDark} colors={colors}
          menuId={menuId} onToggleMenu={(id, pos) => { setMenuId(id); setMenuPos(pos) }}
          onComplain={setComplainMsg}
          slot={{ bienId: conv?.bien?.id, isClientRole, paying, onRepondre: repondre, onPayer: payer }} />

        {/* Bouton scroll bas */}
        {!atBottom && (
          <button onClick={() => { scrollBot(); setAtBottom(true) }}
            className="absolute bottom-24 right-5 z-20 w-10 h-10 rounded-full flex items-center justify-center shadow-md cursor-pointer anim-scale-in transition-transform hover:scale-105"
            style={{ background: hdrBg, border: `1px solid ${hdrBdr}`, color: tp }}>
            <ChevDown />
          </button>
        )}

        {/* Zone saisie */}
        <div className="flex-shrink-0" style={{ background: inpBg, borderTop: `1px solid ${hdrBdr}` }}>
          {/* Contexte réponse / modification */}
          {(replyingTo || editingMsg) && (
            <div className="px-4 pt-3 pb-1 flex items-center gap-2.5">
              <div className="w-[3px] h-9 rounded-full flex-shrink-0" style={{ background: '#4160F2' }} />
              <div className="flex-1 min-w-0">
                <p className="text-[11.5px] font-semibold" style={{ color: 'var(--tx-blue)' }}>{editingMsg ? 'Modifier' : `Répondre à ${otherName.split(' ')[0]}`}</p>
                <p className="text-[12px] truncate mt-0.5" style={{ color: ts }}>{editingMsg?.contenu ?? replyingTo?.contenu}</p>
              </div>
              <button onClick={cancelCtx} className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors hover:opacity-75" style={{ color: tm, background: iconBtn }}><XIcon /></button>
            </div>
          )}
          <div className="px-3 py-3 flex items-end gap-2 safe-bottom">
            {/* Calendrier */}
            <button onClick={() => setShowSlot(true)} disabled={proposing}
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-50 cursor-pointer transition-opacity hover:opacity-80"
              style={{ background: 'rgba(75,107,255,0.10)', color: 'var(--tx-blue)', border: '1px solid rgba(75,107,255,0.18)' }}>
              {proposing ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4160F2', borderTopColor: 'transparent' }} /> : <CalIcon />}
            </button>
            {/* Textarea */}
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Écrire un message…" rows={1}
              className="flex-1 min-w-0 rounded-2xl px-4 py-2.5 text-[14px] outline-none resize-none max-h-28 leading-relaxed"
              style={{ background: inpFieldBg, border: `1px solid ${inpFieldBdr}`, color: tp, minHeight: '44px' }} />
            {/* Envoyer */}
            <button onClick={send} disabled={!input.trim() || sending}
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 cursor-pointer transition-transform hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#4160F2,#7B4BFF)', boxShadow: input.trim() ? '0 4px 16px rgba(75,107,255,0.35)' : 'none' }}>
              {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <SendIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ PANNEAU PROFIL — desktop côté droit ═══ */}
      {showProfile && (
        <div className="hidden md:block w-[280px] xl:w-[300px] flex-shrink-0 h-full anim-slide-left">
          {renderProfilePanel({ onClose: () => setShowProfile(false) })}
        </div>
      )}

      {/* ═══ PANNEAU PROFIL — mobile drawer (modale : focus piégé, Échap) ═══ */}
      {isMobileViewport && (
        <ModalSheet open={showProfile} onClose={() => setShowProfile(false)} label="Profil" placement="right" panelClassName="w-[85%] max-w-sm h-full anim-slide-left" backdropOpacity={0.4}>
          {renderProfilePanel({ onClose: () => setShowProfile(false) })}
        </ModalSheet>
      )}

      {/* Menu header (3 points) — fixed au-dessus de tout */}
      {showHeaderMenu && headerMenuPos && (
        <MenuPopover label="Options de la conversation" onClose={() => { setShowHeaderMenu(false); setHeaderMenuPos(null) }}
          className="fixed z-[130] rounded-2xl overflow-hidden py-1 min-w-[200px] anim-fade-down"
          style={{ top: headerMenuPos.top, right: headerMenuPos.right, background: menuBg, border: `1px solid ${menuBdr}`, boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.50)' : '0 8px 32px rgba(0,0,0,0.12)', '--menu-hover': menuHov } as CSSProperties}
          data-headermenu>
          <MenuItem color={tp} label="Infos du contact" onClick={() => { setShowProfile(true); setShowHeaderMenu(false) }} />
          {conv?.bien?.id && <MenuItem color={tp} label="Voir le bien" onClick={() => { navigate(`/biens/${conv.bien.id}`); setShowHeaderMenu(false) }} />}
          <div className="h-px mx-2 my-1" style={{ background: divider }} />
          <MenuItem color={tp} label="Mode silencieux" onClick={() => setShowHeaderMenu(false)} />
          <MenuItem color={tp} label="Bloquer" onClick={() => setShowHeaderMenu(false)} danger />
          <MenuItem color={tp} label="Signaler" onClick={() => setShowHeaderMenu(false)} danger />
        </MenuPopover>
      )}

      {/* Menu contextuel message — fixed pour éviter le clip du scroll container */}
      {menuId !== null && menuPos && (() => {
        const m = visible.find(x => x.id === menuId)
        if (!m) return null
        return (
          <MenuPopover key={menuId} label="Actions sur le message" onClose={() => { setMenuId(null); setMenuPos(null); setConfirmDeleteForAllId(null) }}
            className="fixed z-[120] rounded-2xl overflow-hidden py-1 min-w-[190px] anim-fade-down"
            style={{ top: menuPos.top, right: menuPos.right, background: menuBg, border: `1px solid ${menuBdr}`, boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.50)' : '0 8px 32px rgba(0,0,0,0.12)', '--menu-hover': menuHov } as CSSProperties}>
            <MenuItem color={tp} label="Répondre" onClick={() => startReply(m)} />
            {canEdit(m) && <MenuItem color={tp} label="Modifier" onClick={() => startEdit(m)} />}
            <MenuItem color={tp} label={m.epingle ? 'Désépingler' : 'Épingler'} onClick={() => togglePin(m)} />
            <div className="h-px mx-2 my-1" style={{ background: divider }} />
            {!m.supprime_pour_tous && <MenuItem color={tp} label="Supprimer pour moi" onClick={() => deleteForMe(m)} danger />}
            {m.sender_id === user?.id && !m.supprime_pour_tous && (
              confirmDeleteForAllId === m.id ? (
                <div style={{ display: 'flex', gap: 4, padding: '6px 8px' }}>
                  {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- confirmation de suppression : le focus reprend sur le bouton qui remplace l'entrée du menu */}
                  <button type="button" role="menuitem" autoFocus onClick={() => deleteForAll(m)} style={{ flex: 1, padding: '5px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#DC2626', color: '#fff', fontSize: 12, fontWeight: 700 }}>Confirmer</button>
                  <button type="button" role="menuitem" onClick={() => setConfirmDeleteForAllId(null)} style={{ flex: 1, padding: '5px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6', color: isDark ? '#D1D5DB' : '#6B7280', fontSize: 12 }}>Annuler</button>
                </div>
              ) : (
                // oxlint-disable-next-line jsx-a11y/no-autofocus -- annulation de la confirmation : le focus revient sur l'entrée du menu
                <MenuItem color={tp} autoFocus label="Supprimer pour tous" onClick={() => setConfirmDeleteForAllId(m.id)} danger />
              )
            )}
          </MenuPopover>
        )
      })()}

      {/* Modals */}
      {showSlot && <SlotModal c={slotColors} onConfirm={proposerSlot} onCancel={() => setShowSlot(false)} />}
      {counterFor && <SlotModal c={slotColors} onConfirm={confirmCounter} onCancel={() => setCounterFor(null)} />}

      {/* Modal plainte */}
      {complainMsg && <ComplaintModal msg={complainMsg} convId={convId} colors={colors} onClose={() => setComplainMsg(null)} onError={showError} />}
    </div>
  )
}
