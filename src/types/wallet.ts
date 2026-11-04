/**
 * Types du domaine wallet (FE-A-003) : soldes, transactions de wallet et
 * réponse d'une recharge. Dérivés des champs réellement lus par les écrans ;
 * les colonnes numériques peuvent arriver en chaîne (Postgres), d'où
 * `number | string`.
 */
import type { IsoDate } from './api'

/** Type de wallet : cotisation/épargne (client), revenus_locatifs (commissions). */
export type TypeWallet = 'cotisation' | 'epargne' | 'revenus_locatifs'

/** Wallet renvoyé par `GET /wallets/me/solde`. */
export interface Wallet {
  id?: number
  type?: TypeWallet
  balance?: number | string
  updated_at?: IsoDate
}

/** Transaction de wallet (`GET /wallets/me/transactions`), champs lus tolérants aux deux nomenclatures. */
export interface WalletTransaction {
  id?: number
  wallet_id?: number
  /** depot, retrait, paiement_loyer, transfert_interne, ou libellé métier. */
  type?: string
  libelle?: string
  description?: string
  montant?: number | string
  amount?: number | string
  balance_after?: number | string
  statut?: string
  status?: string
  created_at: IsoDate
  date?: IsoDate
  /** Libellé du bien (texte) ou objet, selon la route : toujours affiché via `String()`. */
  bien?: unknown
  reference?: string
}

/** Réponse de `POST /paiements/depot` (recharge d'un wallet). */
export interface RechargementWalletResponse {
  statut?: string
  reference?: string
  referenceId?: string
  reference_id?: string
  url_paiement?: string
}

/** Opérateur Mobile Money du numéro de retrait. */
export type OperateurRetrait = 'mtn' | 'moov'

/** Réponse de `GET /wallets/me/numero-retrait`. */
export interface NumeroRetraitInfo {
  numero_retrait: string | null
  masque: string | null
  source: string
  /** Absent tant que la personne n'a pas choisi MTN ou Moov : aucun retrait possible. */
  operateur_retrait?: OperateurRetrait | null
  /** Retraits suspendus 48 h après un changement de numéro ou d'opérateur (date ISO), sinon null. */
  retraits_suspendus_jusqu_a?: string | null
}

/** Réponse de `GET /retraits/limites` (XOF, variables d'environnement du serveur). */
export interface LimitesRetrait {
  min: number
  max: number
}

/** Réponse de `POST /wallets/me/numero-retrait/initier`. */
export interface InitierChangementNumeroResponse {
  session_token: string
  expires_in: number
  nouveau_numero: string
  operateur?: OperateurRetrait
}

/** Réponse de `POST /wallets/me/numero-retrait/confirmer`. */
export interface ConfirmerChangementNumeroResponse {
  message?: string
  numero_retrait?: string
  operateur_retrait?: OperateurRetrait
  retraits_suspendus?: boolean
}
