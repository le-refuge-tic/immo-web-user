/**
 * Libellé du type de logement.
 *
 * Le vrai type précis d'un bien est son *sous-type* (Villa, Chambre-Salon,
 * Studio…), pas son `type` back-end grossier (`appart_vide`, `appart_meuble`…).
 * Afficher `type` seul faisait remonter "Appartement vide" partout au lieu du
 * type réel. Ce helper priorise donc le sous-type et ne retombe sur le type
 * que si aucun sous-type n'est connu.
 */

const TYPE_LABELS: Record<string, string> = {
  maison: 'Maison',
  appart_vide: 'Appartement',
  appart_meuble: 'Appartement meublé',
  guesthouse: 'Guesthouse',
  terrain: 'Terrain',
}

const SOUS_TYPE_LABELS: Record<string, string> = {
  villa: 'Villa',
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
function extractSousType(bien: any): string | undefined {
  return bien?.sousType ?? bien?.sous_type ?? bien?.amenites?.sous_type
}

/**
 * Libellé du type précis d'un bien.
 * @example bienTypeLabel({ type: 'appart_vide', amenites: { sous_type: 'villa' } }) -> 'Villa'
 */
export function bienTypeLabel(bien: any): string {
  if (!bien) return 'Bien'
  const sous = extractSousType(bien)
  if (sous && SOUS_TYPE_LABELS[sous]) return SOUS_TYPE_LABELS[sous]
  if (bien.type && TYPE_LABELS[bien.type]) return TYPE_LABELS[bien.type]
  return sous || bien.type || 'Bien'
}
