import type { KeyboardEvent } from 'react'

/**
 * Gestionnaire `onKeyDown` pour un élément non natif qui joue le rôle d'un
 * bouton : Entrée et Espace l'activent comme un clic (WCAG 2.1.1).
 */
export function onActivateKey<T extends HTMLElement>(action: () => void) {
  return (event: KeyboardEvent<T>) => {
    // Ne pas détourner la touche quand elle vise un contrôle imbriqué (bouton, lien, champ).
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action()
    }
  }
}
