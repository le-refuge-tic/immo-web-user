/**
 * Forme du JSON libre `amenites` d'un bien (FE-A-003).
 *
 * Déduite des champs réellement lus par src/utils/amenites.ts et par le
 * formulaire de publication. Rien n'est garanti côté API : tout est optionnel,
 * et plusieurs champs existent sous deux noms (ancien et nouveau).
 */
/** Ligne de frais libre ajoutée par le propriétaire. */
export interface AutreFrais {
  label?: string
  montant?: number | string
}

export interface Amenites {
  sous_type?: string
  // Logement
  electricite?: string
  compteur_elec?: string
  /** Colonne numérique : parfois renvoyée en chaîne. */
  prix_kwh?: number | string | null
  eau?: string
  compteur_eau?: string
  soneb_gestion?: string
  prix_m3?: number | string | null
  forage_payant?: boolean
  prix_forage?: number | string | null
  puits?: boolean
  type_cuisine?: string
  cuisine_autre_detail?: string
  type_cour?: string
  nb_voisins?: number | null
  acces_vehicule?: boolean | null
  nb_vehicules?: number | null
  chambre_couloir?: boolean | null
  sanitaire?: boolean | string | null
  finition?: string
  standing?: string
  standing_autre?: string
  echeance_mois?: number | null
  parking?: boolean
  voisinage?: string[]
  parking_capacite?: number | string
  cour?: boolean
  boyerie?: boolean
  // Frais d'intégration (location)
  avance_mois?: number | null
  loyer_prepaye_mois?: number | null
  caution_eau?: number | string | null
  caution_elec?: number | string | null
  commission_agence?: number | string | null
  autres_frais?: AutreFrais[]
  // Terrain
  document?: string | null
  documents?: string[] | null
  document_autre_detail?: string | null
  loti?: boolean | string | null
  titre_foncier?: boolean | null
  permission_construire?: boolean | null
  angle_rue?: boolean | null
  position?: string | null
  description_construction?: string
}
