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

// ─── Réponses des routes de paiement (FE-A-003), dérivées de paiements.service.ts ──

/** Statut d'un paiement tel que renvoyé par le polling (les écrans acceptent plusieurs graphies). */
export type StatutPaiementPolling = string

/** Réponse de `POST /paiements/visite` et `/paiements/integration`. */
export interface InitierPaiementResponse {
  referenceId: string
  montant?: number
  statut?: string
  /** Présent pour les paiements redirigés (FedaPay). */
  url_paiement?: string
}

/** Réponse de `GET /paiements/visite/:ref/statut`. */
export interface StatutPaiementVisite {
  statut: StatutPaiementPolling
  montant?: number
  phone?: string | null
}

/** Réponse de `GET /paiements/integration/:ref/statut`. */
export interface StatutPaiementIntegration {
  statut: StatutPaiementPolling
  contrat_id?: number | null
}

/** Réponse de `GET /paiements/loyer/:ref/statut`. */
export interface StatutPaiementLoyer { statut: 'en_attente' | 'reussi' | 'echoue' }

/** Réponse de `GET /paiements/depot/:ref/statut`. */
export interface StatutRechargement {
  statut: StatutPaiementPolling
  montant?: number
  wallet_type?: string
}

/**
 * Réponse de `POST /paiements/loyer/:id/repair` (`repairerLoyer` du backend) :
 * `repare` vaut true seulement quand une transaction confirmée a été rejouée.
 */
export interface RepairLoyerResponse {
  repare: boolean
  /** `reussi`, `deja_paye` ou `aucune_transaction_confirmee`. */
  statut: string
}

/** Réponse de `POST /paiements/loyer/cotisation`. */
export interface PayerCotisationResponse { ok: boolean; loyers_payes: number[] }
