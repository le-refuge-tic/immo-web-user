import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { chatApi } from '../../api/chatApi'

function timeAgo(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "maintenant"
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}j`
}

function initials(name: string) {
  return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function ConversationsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [convs, setConvs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chatApi.conversations()
      .then(d => setConvs(Array.isArray(d) ? d : d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getOther = (conv: any) => {
    if (!user) return null
    if (conv.prospect?.id !== user.id) return conv.prospect
    return conv.proprietaire || conv.demarcheur
  }

  return (
    <div className="min-h-full bg-app-bg">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-text-dark">Messages</h1>
      </div>

      {loading ? (
        <div className="px-4 space-y-3">
          {[1,2,3].map(n => <div key={n} className="bg-white rounded-2xl h-20 animate-pulse" />)}
        </div>
      ) : convs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="text-5xl mb-4">💬</div>
          <p className="text-text-dark font-semibold mb-1">Aucune conversation</p>
          <p className="text-text-grey text-sm">Les messages liés à vos visites apparaîtront ici</p>
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {convs.map(conv => {
            const other = getOther(conv)
            const name = other ? `${other.prenom || ''} ${other.nom || ''}`.trim() : 'Inconnu'
            const lastMsg = conv.last_message
            const unread = conv.unread_count || 0

            return (
              <div
                key={conv.id}
                onClick={() => navigate(`/conversations/${conv.id}`)}
                className="bg-white rounded-2xl p-4 flex items-center gap-3 cursor-pointer active:bg-surface-g"
              >
                {other?.photo_profil ? (
                  <img src={other.photo_profil} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-l flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">{initials(name)}</span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-text-dark text-sm">{name}</p>
                    <p className="text-xs text-text-grey">{timeAgo(lastMsg?.created_at || conv.created_at)}</p>
                  </div>
                  {conv.visite && (
                    <p className="text-xs text-primary font-medium">
                      📅 Visite – {conv.visite.bien?.localisation?.ville || 'Bien'}
                    </p>
                  )}
                  <p className={`text-xs mt-0.5 truncate ${unread > 0 ? 'text-text-dark font-semibold' : 'text-text-grey'}`}>
                    {lastMsg?.contenu || 'Démarrez la conversation'}
                  </p>
                </div>

                {unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{unread}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
