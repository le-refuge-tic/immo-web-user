/**
 * FE-B-012 — Frais de visite affichés : même règle que le backend
 * (immo-backend/src/visites/frais-visite.util.ts), à garder alignée.
 *
 * - « Visite gratuite » est un choix explicite du bien (`amenites.visite_gratuite`) ;
 * - un montant à 0 signifie « non renseigné » et reçoit le barème :
 *   5 000 FCFA pour un terrain, 500 FCFA sinon.
 */
const FRAIS_DEFAUT_TERRAIN = 5000
const FRAIS_DEFAUT_AUTRE = 500

interface BienFrais {
  type?: string
  frais_visite?: number | string | null
  amenites?: Record<string, unknown> | null
}

export function estVisiteGratuite(bien: Pick<BienFrais, 'amenites'> | null | undefined): boolean {
  return bien?.amenites?.visite_gratuite === true
}

/** Frais de base d'une visite de ce bien, avant pénalité éventuelle du client. */
export function fraisVisiteBien(bien: BienFrais): number {
  if (estVisiteGratuite(bien)) return 0
  const frais = Number(bien.frais_visite)
  if (frais > 0) return frais
  return bien.type === 'terrain' ? FRAIS_DEFAUT_TERRAIN : FRAIS_DEFAUT_AUTRE
}

/** Montant réellement demandé au paiement d'une visite (figé à sa création). */
export function fraisVisiteAPayer(visite: { frais_visite?: number | string | null; bien?: BienFrais | null }): number {
  const frais = Number(visite.frais_visite)
  if (frais > 0) return frais
  return visite.bien ? fraisVisiteBien(visite.bien) : FRAIS_DEFAUT_AUTRE
}

export function libelleFraisVisite(montant: number): string {
  return montant > 0 ? `${montant.toLocaleString('fr-FR')} FCFA` : 'Gratuite'
}
