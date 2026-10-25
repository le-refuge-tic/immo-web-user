import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

/** Laisse aux pages le temps de poser leur titre (usePageTitle) avant de le lire. */
const TITLE_SETTLE_MS = 150

/**
 * Annonce le changement de page aux lecteurs d'écran (FE-C-007) : une
 * navigation côté client ne recharge rien, donc rien n'est annoncé de
 * lui-même. Le titre de la nouvelle page est lu dans une région `aria-live`
 * et le focus revient sur le contenu principal.
 */
export default function RouteAnnouncer() {
  const { pathname } = useLocation()
  const [message, setMessage] = useState('')
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const timer = setTimeout(() => {
      setMessage(document.title.split(' | ')[0] || 'Nouvelle page')
      document.getElementById('main-content')?.focus({ preventScroll: true })
    }, TITLE_SETTLE_MS)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  )
}
