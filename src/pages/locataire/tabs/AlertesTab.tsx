import { useState, useEffect, useCallback } from 'react'
import { notificationsApi } from '../../../api/notificationsApi'
import { useNotifications } from '../../../context/NotificationsContext'
import { GREEN, GREEN_TX } from '../shared'
import { IcBell } from '../icons'
import AlerteItem from './AlerteItem'
import { compterNonLues, estAlerteLocataire, marquerLue, marquerToutesLues, ROLE_ESPACE_LOCATAIRE } from './alertesLocataire'
import { unwrapList } from '../../../utils/unwrapList'
import type { Notification } from '../../../types/api'
import { withAlpha } from '../../../utils/color'
import ErrorState from '../../../components/ErrorState'
import RefreshFailedNotice from '../../../components/RefreshFailedNotice'

export default function AlertesTab() {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [refreshError, setRefreshError] = useState(false)
  const { markAlertesRead, refresh: refreshCounts } = useNotifications()

  // `silencieux` : resynchronisation de fond, la liste déjà affichée reste à l'écran.
  const charger = useCallback(async (silencieux = false) => {
    if (!silencieux) { setLoading(true); setLoadError(false) }
    try {
      setNotifs(unwrapList(await notificationsApi.list()))
      setRefreshError(false)
    } catch {
      if (silencieux) setRefreshError(true)
      else setLoadError(true)
    }
    if (!silencieux) setLoading(false)
  }, [])
  useEffect(() => { charger() }, [charger])

  // La liste est mise à jour tout de suite ; le badge, lui, n'est recompté qu'une fois le serveur à jour
  // (sinon le comptage pourrait revenir avec l'ancienne valeur). En cas d'échec, on resynchronise.
  const resynchroniser = () => { refreshCounts(); charger(true) }
  const marquerLueAlerte = async (id: number) => {
    setNotifs(prev => marquerLue(prev, id))
    try {
      await notificationsApi.markRead(id)
      markAlertesRead(1)
    } catch { resynchroniser() }
  }
  const toutMarquerLu = async () => {
    const nb = compterNonLues(notifs)
    setNotifs(prev => marquerToutesLues(prev))
    try {
      await notificationsApi.markAllRead(ROLE_ESPACE_LOCATAIRE)
      markAlertesRead(nb)
    } catch { resynchroniser() }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GREEN, borderTopColor: 'transparent' }} /></div>
  if (loadError && notifs.length === 0) return (
    <div className="flex-1 flex items-center justify-center">
      <ErrorState title="Impossible de charger vos alertes" onRetry={() => charger()} />
    </div>
  )
  // Seules les alertes de l'espace locataire sont affichées, comme les autres espaces : le badge et
  // « Tout marquer comme lu » portent sur la même liste.
  const alertes = notifs.filter(estAlerteLocataire)
  const nonLues = compterNonLues(notifs)
  return (
    <div className="flex-1 overflow-y-auto pb-6 px-4 pt-4 md:px-8 md:pt-8 md:max-w-3xl md:mx-auto md:w-full">
      {refreshError && <RefreshFailedNotice onRetry={() => charger(true)} />}
      {nonLues > 0 && (
        <div className="flex justify-end mb-2">
          <button onClick={toutMarquerLu} className="text-xs font-bold" style={{ color: GREEN_TX }}>Tout marquer comme lu</button>
        </div>
      )}
      {alertes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: withAlpha(GREEN, '20') }}>
            <IcBell />
          </div>
          <p className="font-bold text-text-dark mb-1">Aucune alerte</p>
          <p className="text-text-grey text-sm">Vos notifications apparaîtront ici.</p>
        </div>
      ) : alertes.map(n => <AlerteItem key={n.id} n={n} onOpen={() => marquerLueAlerte(n.id)} />)}
    </div>
  )
}
