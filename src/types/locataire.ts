/**
 * Types de l'espace locataire (FE-A-003) : réponse de `GET /loyers/mon-logement`,
 * initiation de paiement de loyer et alertes. Déduits des champs réellement lus
 * par les écrans et de `immo-backend/src/loyers`.
 */
import type { Bien, IsoDate, User } from './api'

/** Mode de paiement proposé pour un loyer (cotisation = solde du wallet). */
export type ModePaiementLoyer = 'momo' | 'flooz' | 'celtiis' | 'fedapay' | 'cotisation'

export interface Loyer {
  id: number
  mois?: IsoDate
  date_echeance: IsoDate
  /** Colonne numérique : parfois renvoyée en chaîne. */
  montant: number | string
  statut?: string
}

/** Ligne de l'historique des paiements de loyer. */
export interface LoyerHistorique {
  mois?: IsoDate
  /** Date du paiement : l'API renseigne `created_at` ou `date_paiement`. */
  created_at: IsoDate
  date_paiement: IsoDate
  montant: number | string
  transaction_id?: number | string | null
}

export interface ContratLocataire {
  loyer_mensuel?: number | string
  loyer_prepaye_mois?: number | string
  prochain_paiement?: IsoDate | null
}

/** Réponse de `GET /loyers/mon-logement` (`null` sans contrat actif). */
export interface MonLogement {
  contrat?: ContratLocataire | null
  bien?: Bien | null
  gestionnaire?: User | null
  loyers_en_attente?: Loyer[]
  prochain_loyer?: Loyer | null
  historique_loyers?: LoyerHistorique[]
  mois_payes?: number
  mois_dus?: number
}

/** Réponse de `POST /paiements/loyer`. */
export interface InitiationLoyerReponse {
  /** L'API renvoie l'une ou l'autre graphie (lues avec `referenceId || reference_id`). */
  referenceId: string
  reference_id: string
  /** Présent pour les paiements redirigés (FedaPay). */
  url_paiement?: string
}
