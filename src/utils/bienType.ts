import type { Amenites } from '../types/amenites'

/**
 * Libellé du type de logement.
 *
 * Le vrai type précis d'un bien est son *sous-type* (Villa, Chambre-Salon,
 * Studio…), pas son `type` back-end grossier (`appart_vide`, `appart_meuble`…).
 * Afficher `type` seul faisait remonter "Appartement vide" partout au lieu du
 * type réel. Ce helper priorise donc le sous-type et ne retombe sur le type
 * que si aucun sous-type n'est connu.
 */

/** Forme minimale lue : un bien complet ou un objet partiel (sous-type à plat). */
export type BienTypable = {
  type?: string
  sousType?: string
  sous_type?: string
  amenites?: Record<string, unknown> | null
}

const TYPE_LABELS: Record<string, string> = {
  maison: 'Maison',
  appart_vide: 'Appartement',
  appart_meuble: 'Appartement meublé',
  guesthouse: 'Guesthouse',
  salle_fete: 'Salle de fêtes',
  terrain: 'Terrain',
}

const SOUS_TYPE_LABELS: Record<string, string> = {
  villa: 'Villa',
  duplex: 'Duplex / Grande propriété',
  maison_individuelle: 'Maison individuelle',
  maison: 'Maison',
  appartement: 'Appartement',
  appart_meuble: 'Appartement meublé',
  chambre_salon: 'Chambre-Salon',
  entree_coucher: 'Entrée-Coucher',
  studio: 'Studio',
  boutique: 'Boutique',
  terrain: 'Terrain',
  f2: 'F2', f3: 'F3', f4: 'F4', f5: 'F5',
}

/** Récupère le sous-type quel que soit l'emplacement du champ selon l'endpoint. */
function extractSousType(bien: BienTypable): string | undefined {
  return bien?.sousType ?? bien?.sous_type ?? (bien?.amenites as Amenites | null | undefined)?.sous_type
}

/**
 * Libellé du type précis d'un bien.
 * @example bienTypeLabel({ type: 'appart_vide', amenites: { sous_type: 'villa' } }) -> 'Villa'
 */
export function bienTypeLabel(bien: BienTypable | null | undefined): string {
  if (!bien) return 'Bien'
  // Guesthouse et salle de fêtes : types à part entière, jamais affichés sous un sous-type d'appartement
  if (bien.type === 'guesthouse') return TYPE_LABELS.guesthouse
  if (bien.type === 'salle_fete') return TYPE_LABELS.salle_fete
  const sous = extractSousType(bien)
  if (sous && SOUS_TYPE_LABELS[sous]) return SOUS_TYPE_LABELS[sous]
  if (bien.type && TYPE_LABELS[bien.type]) return TYPE_LABELS[bien.type]
  return sous || bien.type || 'Bien'
}
