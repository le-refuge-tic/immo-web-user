import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { notificationsApi } from '../../api/notificationsApi'

function timeAgo(dateStr: string) {
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  const day = Math.floor(h / 24)
  return `Il y a ${day}j`
}

export default function NotificationsPage() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, lue: true } : n))
    } catch (_) {}
  }

  const markAll = async () => {
    try {
      await notificationsApi.markAllRead()
      setNotifs(prev => prev.map(n => ({ ...n, lue: true })))
    } catch (_) {}
  }

  const unread = notifs.filter(n => !n.lue).length

  return (
    <div className="min-h-full bg-app-bg">
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-dark">Notifications</h1>
          {unread > 0 && <p className="text-xs text-text-grey mt-0.5">{unread} non lue{unread > 1 ? 's' : ''}</p>}
        </div>
        {unread > 0 && (
          <button onClick={markAll} className="text-primary text-xs font-semibold">
            Tout marquer lu
          </button>
        )}
      </div>

      {!isLoggedIn ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="text-5xl mb-4">🔔</div>
          <p className="text-text-grey text-sm mb-5">Connectez-vous pour voir vos notifications</p>
          <button onClick={() => navigate('/login')} className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-btn">
            Se connecter
          </button>
        </div>
      ) : loading ? (
        <div className="px-4 space-y-3">
          {[1,2,3].map(n => <div key={n} className="bg-white rounded-2xl h-20 animate-pulse" />)}
        </div>
      ) : notifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">🔕</div>
          <p className="text-text-dark font-semibold mb-1">Aucune notification</p>
          <p className="text-text-grey text-sm">Vous êtes à jour !</p>
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {notifs.map(n => (
            <div
              key={n.id}
              onClick={() => !n.lue && markRead(n.id)}
              className={`bg-white rounded-2xl p-4 flex gap-3 cursor-pointer transition-opacity ${
                n.lue ? 'opacity-60' : ''
              }`}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.lue ? 'bg-divider' : 'bg-primary'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.lue ? 'text-text-grey' : 'text-text-dark font-semibold'}`}>
                  {n.titre || n.message}
                </p>
                {n.contenu && n.titre && (
                  <p className="text-xs text-text-grey mt-0.5 line-clamp-2">{n.contenu}</p>
                )}
                <p className="text-xs text-text-grey mt-1">{timeAgo(n.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
