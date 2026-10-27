/**
 * Types de l'espace propriétaire (FE-A-003) : contrats et loyers, biens en
 * gestion, délégations, portefeuille. Déduits des champs réellement lus par
 * src/pages/proprietaire/** et des entités du backend (loyers, delegation,
 * wallets). Les colonnes décimales / bigint peuvent arriver en chaîne
 * (Postgres), d'où `number | string`.
 */
import type { Bien, ChatSearchHit, IsoDate, MethodePaiement, User, Visite } from './api'

// ─── Profil ───────────────────────────────────────────────────────────────

/**
 * Profil affiché dans le tableau de bord : soit `GET /users/me`, soit
 * l'utilisateur du contexte d'authentification (champs nullables).
 */
export interface ProprioProfil {
  /** Vérification des pièces d'identité (CIP/IFU) par l'équipe REFUGE. */
  statut_verification_documents?: import('../utils/verificationDocuments').StatutVerificationDocuments | null
  motif_rejet_documents?: string | null
  id?: number
  nom?: string | null
  prenom?: string | null
  email?: string | null
  telephone?: string | null
  photo_profil?: string | null
  cip_url?: string | null
  ifu_url?: string | null
  score_credibilite?: number
  nb_etoiles?: number
  created_at?: IsoDate
}

// ─── Biens en gestion ─────────────────────────────────────────────────────

/** Bien en gestion : bien classique + locataire lié s'il y en a un. */
export type BienGestion = Bien & { locataire?: User | null }

// ─── Contrats et loyers ───────────────────────────────────────────────────

export type StatutLoyerApi = 'en_attente' | 'en_retard' | 'paye' | 'impaye'
export type StatutContratApi = 'actif' | 'resilie' | 'expire'

export interface Loyer {
  id: number
  contrat_id?: number
  /** Premier jour du mois concerné. */
  mois?: IsoDate
  date_echeance?: IsoDate
  montant: number | string
  statut: StatutLoyerApi
  date_paiement?: IsoDate | null
  transaction_id?: string | null
  /** 0 si payé à temps (colonne non nulle côté backend). */
  jours_retard: number
  escalade_admin?: boolean
}

export interface Contrat {
  id: number
  bien_id?: number
  bien?: Bien
  locataire_id?: number
  locataire?: User
  gestionnaire_id?: number
  date_debut?: IsoDate
  date_fin?: IsoDate | null
  loyer_mensuel: number | string
  jour_echeance?: number
  /** Mois de loyer offerts à l'intégration (0 par défaut côté backend). */
  loyer_prepaye_mois: number
  gestion_via_app?: boolean
  statut: StatutContratApi
  notes?: string | null
  loyers?: Loyer[]
}

/** Contrat enrichi côté écran (loyers triés, prochain dû, compteurs). */
export interface ContratResume extends Contrat {
  loyersTries: Loyer[]
  prochain: Loyer | null
  payesCount: number
  totalCount: number
  enProblemeCount: number
}

export interface LoyersStats {
  total_contrats: number
  contrats_actifs: number
  contrats_resilies: number
  loyers_en_attente: number
  loyers_en_retard: number
  loyers_payes_mois: number
  revenus_mois: number
  revenus_total: number
}

/** `GET /loyers/dashboard`. */
export interface LoyersDashboard {
  stats?: Partial<LoyersStats>
  contrats?: Contrat[]
}

// ─── Réservations ─────────────────────────────────────────────────────────

/** Visite reçue par le propriétaire (même forme que l'entité Visite du backend). */
export type VisiteReservation = Visite

// ─── Messagerie ───────────────────────────────────────────────────────────

/** Résultat de `GET /chat/search` côté messages : un message avec sa conversation. */
export type MessageHit = ChatSearchHit & {
  id: number
  contenu?: string
  created_at?: IsoDate
}

// ─── Délégations ──────────────────────────────────────────────────────────

export type StatutDelegationApi = 'en_attente' | 'active' | 'revoquee' | 'expiree' | 'refusee'

/** Délégation émise par le propriétaire (`GET /delegations/emises`). */
export interface DelegationEmise {
  id: number
  proprietaire_id?: number
  demarcheur_id?: number
  demarcheur?: User
  /** `null` = délégation portant sur tous les biens. */
  bien_id?: number | null
  bien?: Bien | null
  statut: StatutDelegationApi
  date_debut?: IsoDate | null
  date_fin?: IsoDate | null
  permissions?: string[] | null
  taux_commission_demarcheur?: number | string
  motif?: string | null
}

// ─── Portefeuille ─────────────────────────────────────────────────────────

/** Wallet renvoyé par `GET /wallets/me/solde`. */
export interface WalletProprio {
  balance?: number | string
  updated_at?: IsoDate
}

/**
 * Mouvement de wallet enrichi par le backend avec le paiement lié
 * (statut, référence, moyen de paiement, objet concerné).
 */
export interface MouvementWallet {
  id?: number
  /** `retrait` pour un débit, autre valeur pour un crédit. */
  type?: string
  amount?: number | string
  montant?: number | string
  description?: string | null
  created_at: IsoDate
  statut?: string | null
  reference?: string | null
  methode_paiement?: MethodePaiement
  telephone_paiement?: string | null
  visite_id?: number | null
  loyer_id?: number | null
  contrat_id?: number | null
}

/** Demande de retrait (`GET /retraits/me`). */
export interface RetraitProprio {
  id: number
  montant: number | string
  statut: string
  created_at: IsoDate
}
