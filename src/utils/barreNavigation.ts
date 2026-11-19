/**
 * Lot 9 — barre de navigation du bas (téléphone) : quand la masquer. Logique pure, testée.
 */

/** Formulaires de publication et d'édition plein écran : ils ont leur propre barre d'actions. */
const PLEIN_ECRAN = [/^\/nouveau-bien(\/|$)/, /^\/proprietaire\/biens\/\d+\/modifier\/?$/]

export const masquerBarreNavigation = (chemin: string): boolean => PLEIN_ECRAN.some(r => r.test(chemin))

/**
 * Fil de discussion ouvert (/conversations/12) : sur téléphone, la barre fixe recouvrait la zone de
 * saisie (impossible d'écrire). Seule la barre du bas est masquée : la barre du haut (ordinateur) reste.
 */
export const masquerBarreBasse = (chemin: string): boolean =>
  masquerBarreNavigation(chemin) || /^\/conversations\/[^/]+\/?$/.test(chemin)

/** Réduction de la zone visible au-delà de laquelle on considère le clavier ouvert. */
const SEUIL_CLAVIER = 0.25

/** Clavier virtuel ouvert : un champ a le focus et la zone visible a fondu (pas seulement la barre d'adresse). */
export function clavierOuvert({ hauteurVisible, hauteurFenetre, saisieActive }: {
  hauteurVisible: number
  hauteurFenetre: number
  saisieActive: boolean
}): boolean {
  return saisieActive && hauteurFenetre > 0 && hauteurVisible < hauteurFenetre * (1 - SEUIL_CLAVIER)
}

/** Variable CSS lue par le contenu, les barres collantes, les toasts et les modales. */
export const VARIABLE_HAUTEUR = '--bottom-nav-h'
