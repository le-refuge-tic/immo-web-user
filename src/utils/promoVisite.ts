/**
 * Lot 10 — frais de visite présentés comme une promotion : le prix normal barré à côté du prix
 * payé, avec la date de fin de l'offre quand elle existe (GET /configuration/frais-visite).
 */

export interface TarifFraisVisite {
  montant: number
  montant_normal: number
  montant_promo: number
  promo_active: boolean
  /** Dernier jour de l'offre (AAAA-MM-JJ, heure du Bénin) ; `null` = sans date de fin. */
  promo_fin_le: string | null
}

export interface PresentationFrais {
  montant: number
  /** Prix normal à barrer, ou `null` quand le montant n'est pas le tarif promotionnel. */
  barre: number | null
  /** « Offre de lancement jusqu'au 31/12 » ou « Tarif promotionnel ». */
  offre: string | null
}

const jourMois = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

/**
 * Seul le tarif par défaut est une promotion : un bien dont l'administrateur a fixé un autre
 * montant, ou une visite gratuite, s'affiche tel quel.
 */
export function presenterFraisVisite(montant: number, tarif: TarifFraisVisite | null | undefined): PresentationFrais {
  if (!tarif || !tarif.promo_active || montant !== tarif.montant_promo || tarif.montant_normal <= montant) {
    return { montant, barre: null, offre: null }
  }
  return {
    montant,
    barre: tarif.montant_normal,
    offre: tarif.promo_fin_le ? `Offre de lancement jusqu’au ${jourMois(tarif.promo_fin_le)}` : 'Tarif promotionnel',
  }
}
