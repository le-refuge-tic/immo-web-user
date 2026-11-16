/**
 * Lot 8 — types d'alerte liés à une annonce : un seul endroit pour les écrans d'alertes
 * (« Voir le bien ») et pour le toast affiché quand une décision arrive en direct.
 */

/** Décisions sur une annonce, annoncées aussi par un toast si la personne est connectée. */
const DECISIONS: Record<string, 'success' | 'error' | 'info'> = {
  bien_approuve: 'success',
  modification_approuvee: 'success',
  bien_rejete: 'error',
  bien_revoque: 'error',
  modification_rejetee: 'error',
  bien_conditionnel: 'info',
  type_bien_change: 'info',
}

/** Alertes qui portent sur un bien : elles proposent d'ouvrir sa fiche. */
export const TYPES_ALERTE_BIEN: ReadonlySet<string> = new Set([
  ...Object.keys(DECISIONS),
  'bien_occupe',
  'bien_disponible',
])

/** Événement socket `alertes:maj` (raison `nouvelle` : titre et texte joints par l'API). */
export interface EvenementAlerte {
  raison?: string
  type?: string
  titre?: string
  corps?: string
  bien_id?: number | null
}

export function toastPourAlerte(e: EvenementAlerte | null | undefined): { message: string; ton: 'success' | 'error' | 'info' } | null {
  if (e?.raison !== 'nouvelle' || !e.type || !e.titre) return null
  const ton = DECISIONS[e.type]
  if (!ton) return null
  const corps = e.corps?.trim()
  return { message: corps ? `${e.titre} — ${corps}` : e.titre, ton }
}

/** Émis sur `window` par le contexte des notifications ; affiché par SocleApp (fournisseur des toasts). */
export const EVENEMENT_ALERTE_DIRECTE = 'alerte:directe'
