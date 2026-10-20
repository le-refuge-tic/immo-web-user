/**
 * Types de l'historique consolidé des paiements (FE-A-003),
 * `GET /paiements/historique`.
 */
import type { Paiement } from './api'

/** Localisation résumée du bien concerné par un paiement. */
export interface BienPaiementResume {
  quartier?: string
  ville?: string
}

/** Ligne de l'historique : un `Paiement` enrichi par le serveur. */
export interface HistoriquePaiement extends Paiement {
  /** `recu` si l'utilisateur est bénéficiaire, `paye` s'il est payeur (FE-B-007). */
  sens?: 'recu' | 'paye'
  /** Libellé du wallet rechargé (type `depot_wallet`). */
  wallet_label?: string
  bien?: BienPaiementResume | null
  date_visite?: string
}
