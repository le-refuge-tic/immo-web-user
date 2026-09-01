import { useState, useEffect, useMemo } from 'react'
import { Outlet, useNavigate, useMatch } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { chatApi } from '../../api/chatApi'

const AVATAR_PALETTE = [
  'linear-gradient(135deg,#4B6BFF,#7B4BFF)',
  'linear-gradient(135deg,#FF6B35,#FF3B7A)',
  'linear-gradient(135deg,#00C6A2,#0099CC)',
  'linear-gradient(135deg,#F7B731,#F55252)',
  'linear-gradient(135deg,#A855F7,#6366F1)',
  'linear-gradient(135deg,#10B981,#3B82F6)',
]
function avatarGrad(id: number) { return AVATAR_PALETTE[Math.abs(id || 0) % AVATAR_PALETTE.length] }
function displayName(o: any) { return o?.prenom || o?.pseudonyme || o?.nom || 'Contact' }
function initiale(o: any) { return (displayName(o)[0] || '?').toUpperCase() }
function roleLabel(o: any) {
  if (o?.role === 'demarcheur') return 'Agent immobilier'
  if (o?.role === 'proprietaire') return 'Propriétaire'
  if (o?.role === 'locataire') return 'Locataire'
  return null
}
function fmtTime(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso), diff = Date.now() - d.getTime()
  if (diff < 86_400_000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 604_800_000) return d.toLocaleDateString('fr-FR', { weekday: 'short' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function ConversationsPage() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const match = useMatch('/conversations/:id')
  const activeId = match?.params?.id ? Number(match.params.id) : null

  const [convs, setConvs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true); setError('')
    chatApi.conversations()
      .then(d => setConvs(Array.isArray(d) ? d : d.data || []))
      .catch(e => setError(e?.message || 'Erreur'))
      .finally(() => setLoading(false))
  }, [])

  const getOther = (c: any) => {
    if (!user || !Array.isArray(c.participants)) return null
    return c.participants.find((p: any) => p.id !== user.id) || c.participants[0] || null
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return convs
    return convs.filter(c => {
      const o = getOther(c)
      return `${o?.prenom || ''} ${o?.nom || ''} ${o?.pseudonyme || ''}`.toLowerCase().includes(q)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convs, search, user])

  /* ── Design tokens ── */
  // Backgrounds
  const bgPage     = isDark ? '#0F1117' : '#F3F4F8'
  const bgSidebar  = isDark ? '#161820' : '#FFFFFF'
  const bgChatArea = isDark ? '#0F1117' : '#EEF0F7'
  // Text
  const textPrimary   = isDark ? '#E8E9F0' : '#111827'
  const textSecondary = isDark ? 'rgba(232,233,240,0.60)' : '#6B7280'
  const textMuted     = isDark ? 'rgba(232,233,240,0.38)' : '#9CA3AF'
  // Borders & dividers
  const border    = isDark ? 'rgba(255,255,255,0.07)' : '#E5E7EB'
  const divider   = isDark ? 'rgba(255,255,255,0.05)' : '#F0F1F4'
  // Interactive
  const activeBg  = isDark ? 'rgba(75,107,255,0.14)' : 'rgba(75,107,255,0.08)'
  const hoverBg   = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)'
  // Search field
  const searchBg  = isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F8'
  const searchBdr = isDark ? 'rgba(255,255,255,0.09)' : '#E5E7EB'
  // Empty state
  const emptyIconBg = isDark ? 'rgba(75,107,255,0.12)' : 'rgba(75,107,255,0.08)'

  /* ── Liste conversations ── */
  const renderConvList = () => {
    if (loading) return (
      <div className="p-4 space-y-2">
        {[1,2,3,4,5].map(n => (
          <div key={n} className="flex items-center gap-3 px-2 py-2.5">
            <div className="skeleton w-12 h-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-28 rounded-full" />
              <div className="skeleton h-2.5 w-44 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    )
    if (error) return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
        <p className="text-sm font-semibold" style={{ color: textPrimary }}>{error}</p>
        <button onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
          Réessayer
        </button>
      </div>
    )
    if (filtered.length === 0) return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: emptyIconBg }}>
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#4B6BFF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm font-semibold" style={{ color: textPrimary }}>
          {search ? 'Aucun résultat' : 'Aucune conversation'}
        </p>
        <p className="text-xs" style={{ color: textMuted }}>
          {search ? `Rien pour « ${search} »` : 'Vos échanges apparaîtront ici.'}
        </p>
      </div>
    )

    return (
      <div className="py-1">
        {filtered.map((conv) => {
          const other  = getOther(conv)
          const name   = displayName(other)
          const role   = roleLabel(other)
          const last   = conv.dernierMessage
          const preview = last?.contenu === '__supprime__' ? 'Message supprimé' : (last?.contenu || 'Nouvelle conversation')
          const unread = conv.nonLus || 0
          const time   = fmtTime(last?.created_at)
          const active = conv.id === activeId

          return (
            <button key={conv.id}
              onClick={() => navigate(`/conversations/${conv.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 cursor-pointer relative"
              style={{
                background: active ? activeBg : 'transparent',
                borderLeft: `3px solid ${active ? '#4B6BFF' : 'transparent'}`,
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = hoverBg }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>

              {/* Avatar + présence */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: avatarGrad(other?.id ?? conv.id) }}>
                  <span className="text-white font-bold text-[15px]">{initiale(other)}</span>
                </div>
                {conv.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 bg-green-400"
                    style={{ borderColor: active ? (isDark ? '#1A2030' : '#EBF0FF') : (isDark ? bgSidebar : '#fff') }} />
                )}
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <p className="text-[13.5px] truncate" style={{ color: textPrimary, fontWeight: unread ? 700 : 600 }}>
                    {name}
                  </p>
                  <span className="text-[11px] flex-shrink-0 tabular-nums" style={{ color: unread ? '#4B6BFF' : textMuted }}>
                    {time}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12.5px] truncate flex-1" style={{
                    color: unread ? textSecondary : textMuted,
                    fontWeight: unread ? 500 : 400,
                    fontStyle: last?.contenu === '__supprime__' ? 'italic' : 'normal',
                  }}>
                    {preview}
                  </p>
                  {unread > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                      style={{ background: '#4B6BFF' }}>
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
                {role && (
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                    background: isDark ? 'rgba(75,107,255,0.15)' : 'rgba(75,107,255,0.08)',
                    color: '#4B6BFF',
                  }}>
                    {role}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  /* ── Sidebar panel ── */
  const renderSidePanel = () => (
    <div className="flex flex-col h-full" style={{ background: bgSidebar, borderRight: `1px solid ${border}` }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: `1px solid ${divider}` }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-extrabold tracking-tight" style={{ color: textPrimary }}>Messages</h2>
          {!loading && convs.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
              {convs.length}
            </span>
          )}
        </div>
        {/* Barre de recherche */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all"
          style={{ background: searchBg, border: `1px solid ${searchBdr}` }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: textMuted, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-[13px]"
            style={{ color: textPrimary }} />
          {search && (
            <button onClick={() => setSearch('')} className="cursor-pointer" style={{ color: textMuted }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-auto">{renderConvList()}</div>
    </div>
  )

  return (
    <div className="min-h-full" style={{ background: bgPage }}>

      {/* ── MOBILE : liste seule ou fil actif ── */}
      <div className="md:hidden">
        {activeId === null ? (
          <div style={{ background: bgSidebar, minHeight: '100dvh' }}>
            {/* Header mobile */}
            <div className="safe-top px-5 pt-5 pb-3 flex items-center justify-between sticky top-0 z-10"
              style={{ background: bgSidebar, borderBottom: `1px solid ${divider}` }}>
              <h1 className="text-[20px] font-extrabold tracking-tight" style={{ color: textPrimary }}>Messages</h1>
              {!loading && convs.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
                  {convs.length}
                </span>
              )}
            </div>
            {/* Recherche mobile */}
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${divider}` }}>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
                style={{ background: searchBg, border: `1px solid ${searchBdr}` }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: textMuted, flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher une conversation…"
                  className="flex-1 bg-transparent outline-none text-[13px]"
                  style={{ color: textPrimary }} />
                {search && (
                  <button onClick={() => setSearch('')} className="cursor-pointer" style={{ color: textMuted }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {renderConvList()}
          </div>
        ) : <Outlet />}
      </div>

      {/* ── DESKTOP : sidebar + zone chat ── */}
      <div className="hidden md:flex" style={{ height: 'calc(100dvh - 72px)' }}>
        <div className="w-[300px] lg:w-[320px] xl:w-[340px] flex-shrink-0">{renderSidePanel()}</div>
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: bgChatArea }}>
          {activeId !== null ? <Outlet /> : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-5">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: emptyIconBg }}>
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="#4B6BFF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <p className="text-[16px] font-bold mb-1.5" style={{ color: textPrimary }}>Sélectionnez une conversation</p>
                <p className="text-[13px] max-w-[220px] mx-auto leading-relaxed" style={{ color: textSecondary }}>
                  Choisissez un contact à gauche pour afficher les messages.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
