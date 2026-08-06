import { useState, useEffect, useMemo } from 'react'
import { Outlet, useNavigate, useMatch } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { chatApi } from '../../api/chatApi'

// Palette de couleurs d'avatars par hash d'id (façon immo-web-admin) — juste
// de quoi distinguer visuellement les contacts, sans lien avec l'identité REFUGE.
const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', '#16A34A', '#0891B2']
function avatarColor(id: number): string {
  return AVATAR_COLORS[Math.abs(id || 0) % AVATAR_COLORS.length]
}

function getInitiales(other: any): string {
  const a = (other?.nom?.[0] || '').toUpperCase()
  const b = (other?.prenom?.[0] || '').toUpperCase()
  return (a + b) || '?'
}

function formatConvTime(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 86_400_000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 604_800_000) return d.toLocaleDateString('fr-FR', { weekday: 'short' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

export default function ConversationsPage() {
  const { user } = useAuth()
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
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-divider flex-shrink-0 text-text-grey">
      <SearchIcon />
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher une conversation…"
        className="flex-1 min-w-0 border-none outline-none bg-transparent text-[13px] text-text-dark placeholder:text-[#94A3B8]"
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
        <p className="text-[15px] font-bold text-text-dark mb-2">Impossible de charger</p>
        <p className="text-xs text-text-grey mb-4">{error}</p>
        <button onClick={() => window.location.reload()}
          className="text-white px-6 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#4B6BFF' }}>
          Réessayer
        </button>
      </div>
    )

    if (list.length === 0) return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mb-3" style={{ background: 'rgba(75,107,255,0.08)' }}>
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#4B6BFF" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm font-bold text-text-dark mb-1">{search ? 'Aucun résultat' : 'Aucune conversation'}</p>
        <p className="text-xs text-text-grey">{search ? `Rien ne correspond à « ${search} ».` : 'Vos échanges apparaîtront ici.'}</p>
      </div>
    )

    return (
      <div>
        {list.map((conv, idx) => {
          const other = getOther(conv)
          const name = other?.prenom ? `${other.prenom} ${other?.nom || ''}`.trim() : (other?.pseudonyme || 'Contact')
          const lastMsg = conv.dernierMessage
          const lastContenu = lastMsg?.contenu || (conv.bien ? "À propos d'un bien" : 'Nouvelle conversation')
          const unread = conv.nonLus || 0
          const hasUnread = unread > 0
          const timeStr = formatConvTime(lastMsg?.created_at)
          const isActive = conv.id === activeId

          return (
            <div key={conv.id}>
              <button
                onClick={() => navigate(`/conversations/${conv.id}`)}
                className="w-full flex items-center gap-2.5 px-4 py-3 transition-colors text-left"
                style={{
                  background: isActive ? 'rgba(75,107,255,0.08)' : 'transparent',
                  borderLeft: isActive ? '3px solid #4B6BFF' : '3px solid transparent',
                }}
              >
                <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: avatarColor(other?.id ?? conv.id) }}>
                  <span className="text-white font-bold text-xs">{getInitiales(other)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={`text-[13px] truncate ${hasUnread ? 'font-bold text-text-dark' : 'font-semibold text-text-dark'}`}>{name}</p>
                    {timeStr && <p className="text-[11px] text-text-grey flex-shrink-0">{timeStr}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-xs truncate flex-1 ${hasUnread ? 'text-text-dark font-medium' : 'text-text-grey'}`}>
                      {lastContenu}
                    </p>
                    {hasUnread && (
                      <div className="min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#4B6BFF' }}>
                        <span className="text-white text-[10px] font-bold">{unread}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
              {idx < list.length - 1 && <div className="h-px bg-divider ml-[62px]" />}
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
            <div className="px-4 pt-12 pb-3 bg-white border-b border-divider flex items-center justify-between flex-shrink-0">
              <h1 className="text-lg font-bold text-text-dark">Messages</h1>
              {!loading && convs.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white" style={{ background: '#4B6BFF' }}>
                  {convs.length}
                </span>
              )}
            </div>
            <SearchRow />
            <ConvList list={filteredConvs} />
          </div>
        ) : (
          <Outlet />
        )}
      </div>

      {/* ── DESKTOP : deux panneaux, façon immo-web-admin ── */}
      <div className="hidden md:flex" style={{ height: 'calc(100vh - 64px)' }}>

        {/* Panneau gauche — liste */}
        <div className="w-72 lg:w-80 flex-shrink-0 flex flex-col bg-white border-r border-divider">
          <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-shrink-0 border-b border-divider">
            <h2 className="text-[15px] font-extrabold text-text-dark">Messages</h2>
            {!loading && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white" style={{ background: '#4B6BFF' }}>
                {convs.length}
              </span>
            )}
          </div>
          <SearchRow />
          <div className="flex-1 overflow-y-auto">
            <ConvList list={filteredConvs} />
          </div>
        </div>

        {/* Panneau droit — chat actif ou état vide (plat, sans dégradé) */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#F8FAFC' }}>
          {activeId !== null ? (
            <Outlet />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="text-5xl mb-3" style={{ opacity: 0.25 }}>💬</div>
              <p className="text-[15px] font-bold text-text-dark mb-1.5">Sélectionnez une conversation</p>
              <p className="text-text-grey text-[13px] max-w-xs">
                Choisissez un contact dans la liste pour afficher les messages.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
