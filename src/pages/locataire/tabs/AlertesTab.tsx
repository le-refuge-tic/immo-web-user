import { useState, useEffect } from 'react'
import { notificationsApi } from '../../../api/notificationsApi'
import { GREEN } from '../shared'
import { IcBell } from '../icons'
import { unwrapList } from '../../../utils/unwrapList'
import type { Notification } from '../../../types/api'

// L'écran lit `lue` (et non `lu` comme le type de l'API) : lecture conservée telle quelle.
type AlerteAffichee = Notification & { lue?: boolean }

export default function AlertesTab() {
  const [notifs, setNotifs] = useState<AlerteAffichee[]>([])
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
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: GREEN + '20' }}>
            <IcBell />
          </div>
          <p className="font-bold text-text-dark mb-1">Aucune alerte</p>
          <p className="text-text-grey text-sm">Vos notifications apparaîtront ici.</p>
        </div>
      ) : notifs.map(n => (
        <div key={n.id} className="flex items-start gap-3 p-4 rounded-2xl mb-2" style={{ background: n.lue ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.9)', border: n.lue ? '1px solid rgba(0,0,0,0.05)' : `1px solid ${GREEN}30` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: GREEN + '15' }}>
            {!n.lue && <div className="w-2 h-2 rounded-full absolute -top-0.5 -right-0.5" style={{ background: GREEN }} />}
            <IcBell />
          </div>
          <div className="flex-1">
            <p className={`text-sm ${n.lue ? 'text-text-grey' : 'font-semibold text-text-dark'}`}>{n.titre || n.message}</p>
            <p className="text-xs text-text-grey mt-0.5">{new Date(n.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
          {!n.lue && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: GREEN }} />}
        </div>
      ))}
    </div>
  )
}
