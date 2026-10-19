import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useNotifications } from '../../../context/NotificationsContext'
import { visitesApi } from '../../../api/visitesApi'
import { chatApi } from '../../../api/chatApi'
import { notificationsApi } from '../../../api/notificationsApi'
import { IcMessage } from './icons'
import { IcHome, IcCal, IcBell, BLUE, formatConvTime } from './shared'
import type { Tab } from './shared'
import type { Notification } from '../../../types/api'

/* ── Onglet Notifications — propre à l'espace propriétaire ─────────────────
 * Affiche uniquement les alertes concernant le rôle propriétaire (target_role
 * = 'proprietaire', ou null pour les alertes créées avant l'ajout du champ).
 * Le clic reste dans le contexte proprio : ouverture de la conversation liée
 * pour les visites, sinon bascule vers l'onglet interne pertinent — pas de
 * sortie vers le tableau de bord d'un autre rôle. */
const NOTIF_VISITE_TYPES = new Set([
  'visite_demande', 'visite_confirmee', 'visite_contre_proposee',
  'visite_client_recontrepropose', 'visite_proposition_envoyee',
  'visite_effectuee', 'visite_echouee', 'visite_annulee',
  'rappel_visite', 'paiement_visite',
])
const NOTIF_BIEN_TYPES = new Set(['bien_approuve', 'bien_rejete', 'bien_occupe', 'bien_disponible'])

function notifIcon(type: string): { node: React.ReactNode; color: string } {
  if (NOTIF_BIEN_TYPES.has(type)) return { node: <IcHome />, color: '#15803D' }
  if (type === 'nouveau_message') return { node: <IcMessage />, color: '#8B5CF6' }
  if (type === 'visite_annulee' || type === 'visite_echouee') return { node: <IcBell />, color: '#DC2626' }
  if (type === 'visite_confirmee') return { node: <IcBell />, color: '#15803D' }
  if (NOTIF_VISITE_TYPES.has(type)) return { node: <IcCal />, color: BLUE }
  return { node: <IcBell />, color: 'var(--p-muted)' as string }
}

export function NotificationsTab({ onOpenTab }: { onOpenTab: (t: Tab, convId?: number, draftMessage?: string) => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { refresh: refreshCounts, markAlertesRead } = useNotifications()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'toutes' | 'non_lues'>('toutes')

  useEffect(() => {
    setLoading(true)
    notificationsApi.list()
      .then(d => setNotifs(Array.isArray(d) ? d : d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Notifications de l'espace propriétaire : rôle cible explicite = proprietaire,
  // ou sans rôle (alertes antérieures au champ target_role).
  const mine = notifs.filter(n => !n.target_role || n.target_role === 'proprietaire')
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
    try { await notificationsApi.markAllRead('proprietaire') } catch { refreshCounts() }
  }

  // Retrouve la conversation liée à une visite pour l'ouvrir en un clic.
  const ouvrirConversationPourVisite = async (visiteId: number): Promise<boolean> => {
    if (!user) return false
    try {
      const [vd, cd] = await Promise.all([visitesApi.mesVisites(), chatApi.conversations()])
      const visites = Array.isArray(vd) ? vd : vd.data || []
      const visite = visites.find((v: any) => v.id === visiteId)
      const bienId = visite?.bien?.id
      const otherId = visite?.client?.id === user.id ? visite?.gestionnaire?.id : visite?.client?.id
      if (!bienId || !otherId) return false
      const convs = Array.isArray(cd) ? cd : cd.data || []
      const match = convs.find((c: any) => c.bien?.id === bienId && c.participants?.some((p: any) => p.id === otherId))
      if (!match) return false
      onOpenTab('messages', match.id)
      return true
    } catch { return false }
  }

  const openNotif = async (n: any) => {
    if (!n.lu) markRead(n.id)
    const meta = n.meta || {}
    if (n.type === 'nouveau_message' && meta.conversation_id) {
      onOpenTab('messages', Number(meta.conversation_id))
      return
    }
    if (NOTIF_VISITE_TYPES.has(n.type) && meta.visite_id) {
      const opened = await ouvrirConversationPourVisite(meta.visite_id)
      if (opened) return
    }
    // Reste dans l'espace propriétaire : bascule vers l'onglet interne pertinent.
    if (NOTIF_VISITE_TYPES.has(n.type)) onOpenTab('reservations')
    else if (NOTIF_BIEN_TYPES.has(n.type) && meta.bien_id) navigate(`/biens/${meta.bien_id}`)
    else if (NOTIF_BIEN_TYPES.has(n.type)) onOpenTab('biens')
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: 'var(--p-deep)' }}>
      <div className="flex-shrink-0 px-5 md:px-8 xl:px-10 pt-4 pb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-1" style={{ color: 'var(--p-muted)' }}>Espace propriétaire</p>
          <h2 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--p-text)' }}>
            Notifications
            {unread > 0 && <span className="ml-2 text-[15px] font-bold" style={{ color: BLUE }}>{unread}</span>}
          </h2>
        </div>
        {unread > 0 && (
          <button onClick={markAll} className="text-xs font-bold" style={{ color: BLUE }}>Tout marquer lu</button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex-shrink-0 px-5 md:px-8 xl:px-10 pb-3 flex gap-2">
        {([['toutes', 'Toutes'], ['non_lues', `Non lues${unread > 0 ? ` (${unread})` : ''}`]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={filter === k
              ? { background: BLUE, color: '#fff' }
              : { background: 'var(--p-card)', color: 'var(--p-muted)', border: '1px solid var(--p-border)' }}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 md:px-8 xl:px-10 pb-24">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton rounded-2xl h-20" />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--p-card)', color: 'var(--p-muted)' }}>
              <IcBell />
            </div>
            <p className="font-bold" style={{ color: 'var(--p-text)' }}>
              {filter === 'non_lues' ? 'Tout est lu !' : 'Aucune notification'}
            </p>
            <p className="text-sm" style={{ color: 'var(--p-muted)' }}>
              {filter === 'non_lues' ? 'Vous êtes à jour.' : 'Les alertes de vos biens et visites apparaîtront ici.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map(n => {
              const ic = notifIcon(n.type)
              return (
                <button key={n.id} onClick={() => openNotif(n)}
                  className="w-full text-left rounded-2xl p-4 flex items-start gap-4 transition-colors"
                  style={{ background: 'var(--p-card)', border: `1px solid ${n.lu ? 'var(--p-border)' : BLUE}` }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--p-deep)', color: ic.color }}>
                    {ic.node}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug" style={{ color: 'var(--p-text)', fontWeight: n.lu ? 500 : 700 }}>
                      {n.titre || n.corps}
                    </p>
                    {n.corps && n.titre && (
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--p-muted)' }}>{n.corps}</p>
                    )}
                    <p className="text-xs mt-1.5" style={{ color: 'var(--p-muted)' }}>{formatConvTime(n.created_at)}</p>
                  </div>
                  {!n.lu && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: BLUE }} />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

