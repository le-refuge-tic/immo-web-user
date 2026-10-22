import { useState, useEffect } from 'react'
import { notificationsApi } from '../../../api/notificationsApi'
import { GREEN } from '../shared'
import { IcBell } from '../icons'
import AlerteItem from './AlerteItem'
import { unwrapList } from '../../../utils/unwrapList'
import type { Notification } from '../../../types/api'
import { withAlpha } from '../../../utils/color'

export default function AlertesTab() {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    notificationsApi.list()
      .then(d => setNotifs(unwrapList(d)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])
  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GREEN, borderTopColor: 'transparent' }} /></div>
  return (
    <div className="flex-1 overflow-y-auto pb-6 px-4 pt-4 md:px-8 md:pt-8 md:max-w-3xl md:mx-auto md:w-full">
      {notifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: withAlpha(GREEN, '20') }}>
            <IcBell />
          </div>
          <p className="font-bold text-text-dark mb-1">Aucune alerte</p>
          <p className="text-text-grey text-sm">Vos notifications apparaîtront ici.</p>
        </div>
      ) : notifs.map(n => <AlerteItem key={n.id} n={n} />)}
    </div>
  )
}
