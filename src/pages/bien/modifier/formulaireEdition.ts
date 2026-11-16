import type { Bien } from '../../../types/api'

/** Lot 5 — guesthouse et salle de fêtes se modifient avec le formulaire de création (page dédiée). */
export const aFormulaireDedie = (bien: Pick<Bien, 'type'>): boolean =>
  bien.type === 'guesthouse' || bien.type === 'salle_fete'
