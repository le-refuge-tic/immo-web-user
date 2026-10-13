import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FocusEventHandler, MouseEventHandler } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/** Préférence système « réduire les animations », suivie en direct. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(REDUCED_MOTION_QUERY).matches)
  useEffect(() => {
    const query = window.matchMedia?.(REDUCED_MOTION_QUERY)
    if (!query) return
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}

interface CarouselContainerProps {
  onMouseEnter: MouseEventHandler
  onMouseLeave: MouseEventHandler
  onFocus: FocusEventHandler
  onBlur: FocusEventHandler
}

export interface CarouselAutoplay<T extends HTMLElement> {
  ref: React.RefObject<T | null>
  index: number
  setIndex: (index: number) => void
  /** Pause demandée par l'utilisateur (bouton). */
  paused: boolean
  togglePause: () => void
  /** `false` quand l'appareil demande moins d'animation : le défilement automatique est alors désactivé. */
  autoplayAvailable: boolean
  /** À étaler sur le conteneur défilant : survol et focus clavier suspendent le défilement. */
  containerProps: CarouselContainerProps
}

/**
 * Défilement automatique d'un carrousel de cartes (FE-C-008, WCAG 2.2.2) :
 * il s'arrête si l'appareil demande moins d'animation, si l'onglet est masqué,
 * pendant le survol ou le focus clavier, et sur demande via `togglePause`.
 *
 * @param itemCount nombre de cartes réparties sur la largeur défilante
 */
export function useCarouselAutoplay<T extends HTMLElement = HTMLDivElement>(itemCount: number, intervalMs = 3500): CarouselAutoplay<T> {
  const ref = useRef<T>(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [interacting, setInteracting] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  const running = !paused && !interacting && !reducedMotion && itemCount > 1

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const el = ref.current
      if (!el || document.hidden) return
      const cardWidth = el.scrollWidth / itemCount
      const maxScroll = el.scrollWidth - el.clientWidth
      const atEnd = el.scrollLeft + cardWidth >= maxScroll - 1
      const next = atEnd ? 0 : el.scrollLeft + cardWidth
      el.scrollTo({ left: next, behavior: 'smooth' })
      setIndex(atEnd ? 0 : Math.round(next / cardWidth))
    }, intervalMs)
    return () => clearInterval(id)
  }, [running, itemCount, intervalMs])

  const togglePause = useCallback(() => setPaused(value => !value), [])

  const containerProps = useMemo<CarouselContainerProps>(() => ({
    onMouseEnter: () => setInteracting(true),
    onMouseLeave: () => setInteracting(false),
    onFocus: () => setInteracting(true),
    onBlur: () => setInteracting(false),
  }), [])

  return { ref, index, setIndex, paused, togglePause, autoplayAvailable: !reducedMotion, containerProps }
}
