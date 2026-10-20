/**
 * Types des reçus de paiement (FE-A-003) : réponses de
 * `GET /paiements/{visite,integration,loyer,depot}/:ref/recu`, déduites des
 * champs lus par `RecuPage`. Tous les champs propres à un type de reçu sont
 * optionnels.
 */
import type { Bien, IsoDate } from './api'

/** Partie au paiement (client, locataire ou gestionnaire). */
export interface PartieRecu {
  prenom?: string
  nom?: string
  role?: string
}

export interface DetailsIntegrationRecu {
  avance: number
  prepaye: number
  caution_eau: number
  caution_elec: number
}

export interface Recu {
  reference?: string
  montant: number
  date_paiement?: IsoDate
  methode_paiement?: string
  telephone_paiement?: string | null
  /** Reçus d'intégration et de loyer : le bien est à la racine. */
  bien?: Bien | null
  /** Reçu de visite : le bien est sous la visite. */
  visite?: { bien?: Bien | null; date_confirmee?: IsoDate | null; date_souhaitee?: IsoDate | null } | null
  locataire?: PartieRecu | null
  client?: PartieRecu | null
  gestionnaire?: PartieRecu | null
  loyer?: { mois?: string; date_echeance?: IsoDate } | null
  depot?: { wallet_label?: string } | null
  details?: DetailsIntegrationRecu | null
}
