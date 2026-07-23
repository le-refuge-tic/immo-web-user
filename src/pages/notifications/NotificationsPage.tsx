import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { notificationsApi } from '../../api/notificationsApi'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  return `Il y a ${Math.floor(h / 24)}j`
}

const VisiteIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const AnnulationIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const ConfirmationIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)
const LoyerIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const MessageIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)
const SystemeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

type TypeCfg = { icon: React.ReactNode; color: string; bg: string }
const TYPE_CONFIG: Record<string, TypeCfg> = {
  visite:       { icon: <VisiteIcon />,       color: '#4B6BFF', bg: 'rgba(75,107,255,0.08)' },
  annulation:   { icon: <AnnulationIcon />,   color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
  confirmation: { icon: <ConfirmationIcon />, color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
  loyer:        { icon: <LoyerIcon />,        color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  message:      { icon: <MessageIcon />,      color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
  systeme:      { icon: <SystemeIcon />,      color: '#6B7280', bg: 'rgba(107,114,128,0.08)' },
}

function getTypeConfig(type?: string): TypeCfg {
  return TYPE_CONFIG[type ?? ''] || TYPE_CONFIG['systeme']
}

export default function NotificationsPage() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'toutes'|'non_lues'>('toutes')

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return }
    notificationsApi.list()
      .then(d => setNotifs(Array.isArray(d) ? d : d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isLoggedIn])

  const markRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id)
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
    } catch (_) {}
  }

  const markAll = async () => {
    try {
      await notificationsApi.markAllRead()
      setNotifs(prev => prev.map(n => ({ ...n, lu: true })))
    } catch (_) {}
  }

  const unread = notifs.filter(n => !n.lu).length
  const displayed = filter === 'non_lues' ? notifs.filter(n => !n.lu) : notifs

  if (!isLoggedIn) return (
    <div className="min-h-full flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(75,107,255,0.10)' }}>
        <svg className="w-12 h-12 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-text-dark mb-2">Restez informé</h2>
      <p className="text-text-grey text-sm mb-8 max-w-xs">Connectez-vous pour recevoir vos alertes visites, confirmations et messages</p>
      <button onClick={() => navigate('/login')} className="px-8 py-3.5 rounded-xl font-bold text-white shadow-btn hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
        Se connecter
      </button>
    </div>
  )

  return (
    <div className="min-h-full">
      <div className="w-full px-4 md:px-16">

        {/* Header */}
        <div className="pt-12 md:pt-10 pb-4">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-text-dark">Notifications</h1>
              {unread > 0 && (
                <p className="text-sm text-text-grey mt-1">
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full mr-1.5">{unread > 9 ? '9+' : unread}</span>
                  non lue{unread > 1 ? 's' : ''}
                </p>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAll} className="text-sm text-primary font-semibold hover:underline">
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2">
            {[['toutes', 'Toutes'], ['non_lues', `Non lues${unread > 0 ? ` (${unread})` : ''}`]] .map(([k, l]) => (
              <button
                key={k}
                onClick={() => setFilter(k as any)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === k ? 'bg-primary text-white' : 'glass-btn text-text-grey'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="skeleton rounded-2xl h-20" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(75,107,255,0.10)' }}>
              <svg className="w-10 h-10 text-text-grey/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="font-bold text-text-dark mb-1">
              {filter === 'non_lues' ? 'Tout est lu !' : 'Aucune notification'}
            </h3>
            <p className="text-text-grey text-sm">
              {filter === 'non_lues' ? 'Vous êtes à jour.' : 'Les alertes de visite et messages apparaîtront ici.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 pb-28 md:pb-8">
            {displayed.map(n => {
              const cfg = getTypeConfig(n.type)
              return (
                <div
                  key={n.id}
                  onClick={() => !n.lu && markRead(n.id)}
                  className={`glass-card rounded-2xl p-4 flex items-start gap-4 transition-all cursor-pointer ${n.lu ? '' : 'ring-1 ring-primary/20'}`}
                >
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${n.lu ? 'text-text-grey' : 'text-text-dark font-semibold'}`}>
                      {n.titre || n.message}
                    </p>
                    {n.corps && n.titre && (
                      <p className="text-xs text-text-grey mt-1 line-clamp-2">{n.corps}</p>
                    )}
                    <p className="text-xs text-text-grey mt-1.5">{timeAgo(n.created_at)}</p>
                  </div>

                  {/* Unread dot */}
                  {!n.lu && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-1" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
