import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const SAVE_DELAY_MS = 150
const SCROLL_CONTAINER_ID = 'main-content'

const storageKey = (url: string) => `rg_scroll:${url}`

function readSaved(url: string): number {
  try {
    return Number(sessionStorage.getItem(storageKey(url))) || 0
  } catch {
    return 0
  }
}

function save(url: string, top: number): void {
  try {
    sessionStorage.setItem(storageKey(url), String(Math.round(top)))
  } catch { /* stockage indisponible : on perd seulement la restauration */ }
}

/**
 * Retour au même endroit de la liste (FE-B-009) : la position de défilement est
 * mémorisée par URL, et rétablie seulement quand on revient en arrière (Retour,
 * Précédent) une fois les résultats affichés — jamais à une navigation neuve.
 *
 * @param ready `true` quand le contenu est assez haut pour qu'on puisse y défiler
 */
export function useScrollRestoration(ready: boolean): void {
  const { pathname, search } = useLocation()
  // Type de navigation à l'ARRIVÉE sur l'écran : la page réécrit ensuite son URL (REPLACE),
  // ce qui ne doit pas faire oublier qu'on y est revenu par Retour.
  const arrivalType = useRef(useNavigationType())
  const url = pathname + search

  useEffect(() => {
    const container = document.getElementById(SCROLL_CONTAINER_ID)
    if (!container) return
    let timer: ReturnType<typeof setTimeout> | null = null
    const onScroll = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => save(url, container.scrollTop), SAVE_DELAY_MS)
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (timer) clearTimeout(timer)
      save(url, container.scrollTop)
      container.removeEventListener('scroll', onScroll)
    }
  }, [url])

  useEffect(() => {
    if (!ready || arrivalType.current !== 'POP') return
    const top = readSaved(url)
    if (top > 0) document.getElementById(SCROLL_CONTAINER_ID)?.scrollTo({ top })
    // Une seule restauration par affichage : les rechargements suivants (filtres) ne rescrollent pas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])
}
