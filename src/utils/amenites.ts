// Labels lisibles pour les aménités d'un bien, miroir de la logique mobile
// (immo_confort/lib/models/bien.dart → classe Amenites).

export function electriciteLabel(a: any): string | null {
  switch (a.electricite ?? a.compteur_elec) {
    case 'sbee':
    case 'personnel':
      return 'SBEE'
    case 'decompteur':
    case 'decompte':
      return a.prix_kwh != null ? `Décompteur — ${Number(a.prix_kwh).toFixed(0)} FCFA/kWh` : 'Décompteur'
    case 'non':
      return 'Pas de courant'
    default:
      return null
  }
}

export function eauLabel(a: any): string | null {
  switch (a.eau ?? a.compteur_eau) {
    case 'soneb':
      if (a.soneb_gestion === 'prix_m3' && a.prix_m3 != null) {
        return `SONEB — ${Number(a.prix_m3).toFixed(0)} FCFA/m³`
      }
      if (a.soneb_gestion === 'voisins') return 'SONEB (partagée avec voisins)'
      return 'SONEB'
    case 'forage':
      if (a.forage_payant === true && a.prix_forage != null) {
        return `Forage payant — ${Number(a.prix_forage).toFixed(0)} FCFA`
      }
      return a.forage_payant === true ? 'Forage payant' : 'Forage gratuit'
    case 'non':
      return a.puits === true ? 'Puits disponible' : "Pas d'eau"
    default:
      return null
  }
}

export function cuisineLabel(a: any): string | null {
  switch (a.type_cuisine) {
    case 'americaine': return 'Cuisine ouverte (américaine)'
    case 'couloir_balcon': return 'Cuisine couloir / balcon'
    case 'fermee': return 'Cuisine fermée'
    case 'separee_douche': return 'Cuisine séparée de la douche'
    case 'autre': return a.cuisine_autre_detail || 'Autre cuisine'
    default: return null
  }
}

export function courLabel(a: any): string | null {
  switch (a.type_cour) {
    case 'unique_entree': return 'Cour privée'
    case 'entree_personnelle': return 'Entrée personnelle'
    case 'commune':
    case 'cour_commune':
      return a.nb_voisins != null
        ? `Cour commune — ${a.nb_voisins} voisin${a.nb_voisins > 1 ? 's' : ''}`
        : 'Cour commune'
    default: return null
  }
}

export function finitionLabel(a: any): string | null {
  switch (a.finition) {
    case 'ordinaire': return 'Finition ordinaire'
    case 'semi_staffe': return 'Semi-staffé'
    case 'staffe_carele': return 'Staffé / Carrelé'
    case 'standard': return 'Finition standard'
    case 'moderne': return 'Finition moderne'
    case 'haut_standing': return 'Haut standing'
    case 'vip': return 'VIP / Luxe'
    default: return null
  }
}

export function disponibiliteLabel(a: any): string | null {
  switch (a.disponibilite) {
    case 'immediate': return 'Disponible immédiatement'
    case 'en_finition': return 'En finition / Bientôt disponible'
    default: return null
  }
}

const DOCUMENT_TERRAIN_LABELS: Record<string, string> = {
  titre_foncier: 'Titre foncier',
  lettre_attribution: "Lettre d'attribution",
  plan: 'Plan cadastral',
  autre: 'Autre document',
}

const POSITION_TERRAIN_LABELS: Record<string, string> = {
  bordure_route: 'Bordure de route',
  quartier: 'Dans le quartier',
  retrait: 'En retrait',
}

export type InfoRow = { label: string; value: string }

/** Section "Informations logement" */
export function infosLogementRows(a: any): InfoRow[] {
  const rows: InfoRow[] = []

  const elec = electriciteLabel(a)
  if (elec) rows.push({ label: 'Électricité', value: elec })

  const eau = eauLabel(a)
  if (eau) rows.push({ label: 'Eau', value: eau })

  const cuisine = cuisineLabel(a)
  if (cuisine) rows.push({ label: 'Cuisine', value: cuisine })

  const cour = courLabel(a)
  if (cour) rows.push({ label: 'Cour / Accès', value: cour })

  if (a.acces_vehicule != null) {
    const val = a.acces_vehicule
      ? (a.nb_vehicules != null ? `Oui — ${a.nb_vehicules} véhicule${a.nb_vehicules > 1 ? 's' : ''}` : 'Oui')
      : 'Non'
    rows.push({ label: 'Accès véhicule', value: val })
  }

  if (a.chambre_couloir != null) {
    rows.push({ label: 'Maison à couloir', value: a.chambre_couloir ? 'Oui' : 'Non' })
  }

  if (a.sanitaire != null) {
    const interne = a.sanitaire === true || a.sanitaire === 'interieur'
    rows.push({ label: 'Sanitaires', value: interne ? 'Intérieur (dans la chambre / maison)' : 'Extérieur (dans la cour)' })
  }

  const finition = finitionLabel(a)
  if (finition) rows.push({ label: 'Finition', value: finition })

  const dispo = disponibiliteLabel(a)
  if (dispo) rows.push({ label: 'Disponibilité', value: dispo })

  if (a.echeance_mois != null && a.echeance_mois > 1) {
    rows.push({ label: 'Loyer payable tous les', value: `${a.echeance_mois} mois` })
  }

  return rows
}

/** Section "Informations terrain" */
export function infosTerrainRows(a: any): InfoRow[] {
  const rows: InfoRow[] = []

  if (a.document != null) {
    rows.push({ label: 'Document disponible', value: DOCUMENT_TERRAIN_LABELS[a.document] ?? a.document })
  }
  if (a.loti != null) {
    rows.push({ label: 'Terrain loti', value: a.loti ? 'Oui' : 'Non' })
  }
  if (a.titre_foncier != null) {
    rows.push({ label: 'Titre foncier', value: a.titre_foncier ? 'Oui' : 'Non' })
  }
  if (a.permission_construire != null) {
    rows.push({ label: 'Permission de construire', value: a.permission_construire ? 'Obtenue' : 'Non obtenue' })
  }
  if (a.angle_rue != null) {
    rows.push({ label: 'Angle de rue', value: a.angle_rue ? 'Oui' : 'Non' })
  }
  if (a.position != null) {
    rows.push({ label: 'Position', value: POSITION_TERRAIN_LABELS[a.position] ?? a.position })
  }
  if (a.description_construction) {
    rows.push({ label: 'Construction existante', value: a.description_construction })
  }

  return rows
}

/** Puces "Équipements & atouts" (espaces + équipements + boutique) */
export function actifLabels(a: any): string[] {
  const result: string[] = []
  if (a.cour) result.push('Cour')
  if (a.arriere_cour) result.push('Arrière-cour')
  if (a.parking) result.push(a.parking_capacite != null ? `Parking (${a.parking_capacite} véh.)` : 'Parking')
  if (a.boyerie) result.push(a.boyerie_type ? `Boyerie (${a.boyerie_type})` : 'Boyerie')
  if (a.boutique) result.push(a.boutique_position ? `Boutique (${a.boutique_position})` : 'Boutique')
  if (a.armoires_chambre) result.push('Armoires chambre')
  if (a.sanitaire === true) result.push('Sanitaire intérieur')
  if (Array.isArray(a.equipements)) result.push(...a.equipements)
  return result
}
