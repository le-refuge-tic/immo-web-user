import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { visitesApi } from '../../../api/visitesApi'
import { chatApi } from '../../../api/chatApi'
import { notificationsApi } from '../../../api/notificationsApi'
import { useNotifications } from '../../../context/NotificationsContext'
import { PURPLE, type Tab, PURPLE_TX } from '../shared'
import { IcHome, IcCal, IcBell, IcChat } from '../icons'
import { unwrapList } from '../../../utils/unwrapList'
import type { Notification } from '../../../types/api'
import ErrorState from '../../../components/ErrorState'

/* Onglet notifications propre à l'espace démarcheur : n'affiche que les alertes
 * concernant ce rôle (target_role = 'demarcheur'/'commercial', ou null pour les
 * alertes antérieures au champ). Le clic reste dans le contexte démarcheur. */
const NOTIF_VISITE_TYPES = new Set([
  'visite_demande', 'visite_confirmee', 'visite_contre_proposee',
  'visite_client_recontrepropose', 'visite_proposition_envoyee',
  'visite_effectuee', 'visite_echouee', 'visite_annulee',
  'rappel_visite', 'paiement_visite',
])
const NOTIF_BIEN_TYPES = new Set(['bien_approuve', 'bien_rejete', 'bien_occupe', 'bien_disponible'])
const DEMARCHEUR_ROLES = new Set(['demarcheur', 'commercial'])

function notifTimeAgo(iso?: string): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function notifIconD(type: string): { node: React.ReactNode; color: string } {
  if (NOTIF_BIEN_TYPES.has(type)) return { node: <IcHome />, color: 'var(--tx-green)' }
  if (type === 'nouveau_message') return { node: <IcChat />, color: 'var(--c-violet-soft)' }
  if (type === 'visite_annulee' || type === 'visite_echouee') return { node: <IcBell />, color: 'var(--tx-red)' }
  if (type === 'visite_confirmee') return { node: <IcBell />, color: 'var(--tx-green)' }
  if (NOTIF_VISITE_TYPES.has(type)) return { node: <IcCal />, color: PURPLE_TX }
  return { node: <IcBell />, color: 'var(--c-grey)' }
}

export default function NotificationsTab({ onOpenTab }: { onOpenTab: (t: Tab) => void }) {
  const { user, activeRole } = useAuth()
  const navigate = useNavigate()
  const { refresh: refreshCounts, markAlertesRead } = useNotifications()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [filter, setFilter] = useState<'toutes' | 'non_lues'>('toutes')

  const charger = () => {
    setLoading(true)
    setLoadError(false)
    notificationsApi.list()
      .then(d => setNotifs(unwrapList(d)))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }
  useEffect(() => { charger() }, [])

  const mine = notifs.filter(n => !n.target_role || DEMARCHEUR_ROLES.has(n.target_role))
  const unread = mine.filter(n => !n.lu).length
  const displayed = filter === 'non_lues' ? mine.filter(n => !n.lu) : mine

  // Optimiste : liste et badges changent tout de suite, resynchronisés en cas d'échec.
  const markRead = async (id: number) => {
    setNotifs(p => p.map(n => n.id === id ? { ...n, lu: true } : n))
    markAlertesRead(1)
    try { await notificationsApi.markRead(id) } catch { refreshCounts() }
  }
  // « Tout lire » ne concerne que les alertes de cet espace.
  const markAll = async () => {
    const ids = new Set(mine.filter(n => !n.lu).map(n => n.id))
    setNotifs(p => p.map(n => ids.has(n.id) ? { ...n, lu: true } : n))
    markAlertesRead(ids.size)
    try { await notificationsApi.markAllRead(activeRole || 'demarcheur') } catch { refreshCounts() }
  }

  const ouvrirConversationPourVisite = async (visiteId: number): Promise<boolean> => {
    if (!user) return false
    try {
      const [vd, cd] = await Promise.all([visitesApi.mesVisites(), chatApi.conversations()])
      const visites = unwrapList(vd)
      const visite = visites.find(v => v.id === visiteId)
      const bienId = visite?.bien?.id
      const otherId = visite?.client?.id === user.id ? visite?.gestionnaire?.id : visite?.client?.id
      if (!bienId || !otherId) return false
      const convs = unwrapList(cd)
      const match = convs.find(c => c.bien?.id === bienId && c.participants?.some(p => p.id === otherId))
      if (!match) return false
      navigate(`/conversations/${match.id}`)
      return true
    } catch { return false }
  }

  const openNotif = async (n: Notification) => {
    if (!n.lu) markRead(n.id)
    const meta = n.meta || {}
    if (n.type === 'nouveau_message' && meta.conversation_id) {
      navigate(`/conversations/${meta.conversation_id}`); return
    }
    if (NOTIF_VISITE_TYPES.has(n.type) && meta.visite_id) {
      const opened = await ouvrirConversationPourVisite(meta.visite_id)
      if (opened) return
    }
    // Reste dans l'espace démarcheur : bascule vers l'onglet interne pertinent.
    if (NOTIF_VISITE_TYPES.has(n.type)) onOpenTab('reservations')
    else if (NOTIF_BIEN_TYPES.has(n.type) && meta.bien_id) navigate(`/biens/${meta.bien_id}`)
    else if (NOTIF_BIEN_TYPES.has(n.type)) onOpenTab('biens')
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="bg-white px-4 md:px-5 py-3 border-b border-divider flex items-center justify-between flex-shrink-0">
        <p className="font-bold text-text-dark">
          Notifications
          {unread > 0 && <span className="ml-2 text-sm font-bold" style={{ color: PURPLE_TX }}>{unread}</span>}
        </p>
        {unread > 0 && <button onClick={markAll} className="text-xs font-bold" style={{ color: PURPLE_TX }}>Tout marquer lu</button>}
      </div>

      <div className="bg-white px-4 md:px-5 py-2.5 border-b border-divider flex gap-2 flex-shrink-0">
        {([['toutes', 'Toutes'], ['non_lues', `Non lues${unread > 0 ? ` (${unread})` : ''}`]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className="px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            style={filter === k ? { background: PURPLE, color: 'rgb(255,255,255)' } : { background: 'var(--surface-g, #F4F6FA)', color: 'var(--tx-muted)' }}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-5 py-4 pb-24 space-y-2">
        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="skeleton rounded-2xl h-20" />)
        ) : loadError && notifs.length === 0 ? (
          <ErrorState title="Impossible de charger vos notifications" onRetry={charger} />
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-surface-g text-text-grey"><IcBell /></div>
            <p className="font-bold text-text-dark">{filter === 'non_lues' ? 'Tout est lu !' : 'Aucune notification'}</p>
            <p className="text-sm text-text-grey">{filter === 'non_lues' ? 'Vous êtes à jour.' : 'Les alertes de vos biens et visites apparaîtront ici.'}</p>
          </div>
        ) : (
          displayed.map(n => {
            const ic = notifIconD(n.type)
            return (
              <button key={n.id} onClick={() => openNotif(n)}
                className="w-full text-left bg-white rounded-2xl p-4 flex items-start gap-4 transition-colors border"
                style={{ borderColor: n.lu ? 'var(--divider, var(--c-line))' : PURPLE }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-surface-g" style={{ color: ic.color }}>
                  {ic.node}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug text-text-dark" style={{ fontWeight: n.lu ? 500 : 700 }}>{n.titre || n.corps}</p>
                  {n.corps && n.titre && <p className="text-xs text-text-grey mt-1 line-clamp-2">{n.corps}</p>}
                  <p className="text-xs text-text-grey mt-1.5">{notifTimeAgo(n.created_at)}</p>
                </div>
                {!n.lu && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: PURPLE }} />}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
