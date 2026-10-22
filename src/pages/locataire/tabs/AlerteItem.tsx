import type { KeyboardEvent } from 'react'
import { GREEN } from '../shared'
import { IcBell } from '../icons'
import type { Notification } from '../../../types/api'
import { withAlpha } from '../../../utils/color'

type AlerteItemProps = {
  n: Pick<Notification, 'lu' | 'titre' | 'message' | 'created_at'>
  /** Ouverture de l'alerte (marquage « lu ») ; sans lui, ou une fois lue, l'alerte reste passive. */
  onOpen?: () => void
}

/** Une alerte du locataire. L'état lu/non lu vient du champ `lu` de l'API (entité Alerte du backend). */
export default function AlerteItem({ n, onOpen }: AlerteItemProps) {
  const title = n.titre || n.message
  const contenu = (
    <>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: withAlpha(GREEN, '15') }}>
        {!n.lu && <div className="w-2 h-2 rounded-full absolute -top-0.5 -right-0.5" style={{ background: GREEN }} />}
        <IcBell />
      </div>
      <div className="flex-1">
        <p className={`text-sm ${n.lu ? 'text-text-grey' : 'font-semibold text-text-dark'}`}>{title}</p>
        <p className="text-xs text-text-grey mt-0.5">{new Date(n.created_at).toLocaleDateString('fr-FR')}</p>
      </div>
      {!n.lu && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: GREEN }} />}
    </>
  )
  const style = { background: n.lu ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.9)', border: n.lu ? '1px solid rgba(0,0,0,0.05)' : `1px solid ${withAlpha(GREEN, '30')}` }
  const base = 'flex items-start gap-3 p-4 rounded-2xl mb-2'

  if (!onOpen || n.lu) {
    return <div data-testid="alerte" data-lu={n.lu ? 'true' : 'false'} className={base} style={style}>{contenu}</div>
  }
  const surClavier = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() }
  }
  return (
    <div
      data-testid="alerte"
      data-lu="false"
      role="button"
      tabIndex={0}
      aria-label={`Non lue : ${title}`}
      onClick={onOpen}
      onKeyDown={surClavier}
      className={`${base} cursor-pointer focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2`}
      style={style}
    >
      {contenu}
    </div>
  )
}
