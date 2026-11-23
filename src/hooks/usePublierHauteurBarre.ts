import { useLayoutEffect, type RefObject } from 'react'
import { VARIABLE_HAUTEUR } from '../utils/barreNavigation'

/**
 * Lot 9 / lot 14 : hauteur réelle d'une barre fixe du bas (zone sûre comprise) publiée dans
 * --bottom-nav-h, lue par le contenu, les barres collantes, les toasts et l'indicateur d'envoi.
 * 0 quand la barre est absente, masquée (`display: none`) ou démontée.
 */
export function usePublierHauteurBarre(ref: RefObject<HTMLElement | null>, visible = true) {
  useLayoutEffect(() => {
    const racine = document.documentElement
    const el = ref.current
    if (!visible || !el) { racine.style.setProperty(VARIABLE_HAUTEUR, '0px'); return }
    const publier = () => racine.style.setProperty(VARIABLE_HAUTEUR, `${Math.ceil(el.getBoundingClientRect().height)}px`)
    publier()
    const obs = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(publier) : null
    obs?.observe(el)
    window.addEventListener('resize', publier)
    return () => {
      obs?.disconnect()
      window.removeEventListener('resize', publier)
      racine.style.setProperty(VARIABLE_HAUTEUR, '0px')
    }
  }, [ref, visible])
}
