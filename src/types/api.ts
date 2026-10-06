/**
 * Types des réponses de l'API REST (FE-A-003).
 *
 * Dérivés des entités du backend (immo-backend/src/**\/entities) et de l'usage
 * réel côté front. Les champs sérialisés de façon variable (relations
 * chargées ou non, colonnes numériques renvoyées en chaîne par Postgres) sont
 * optionnels ou typés `number | string`. À resserrer au fil de la
 * génération des types depuis l'OpenAPI du backend.
 */

/** Date ISO 8601 renvoyée par l'API. */
export type IsoDate = string

/** Enveloppe paginée renvoyée par `GET /biens`. */
export interface Paginated<T> {
  data: T[]
  total?: number
  page?: number
  limit?: number
}

/**
 * Plusieurs routes renvoient soit un tableau brut, soit `{ data: [...] }` :
 * les écrans doivent normaliser avec `unwrapList`.
 */
export type ListResponse<T> = T[] | Paginated<T>

export type RoleUtilisateur =
  | 'prospect' | 'locataire' | 'demarcheur' | 'proprietaire'
  | 'detenteur' | 'commercial' | 'admin' | 'super_admin'

export interface User {
  id: number
  role_principal?: RoleUtilisateur
  roles_actifs?: RoleUtilisateur[]
  /** Rôle exposé dans les participants d'une conversation. */
  role?: RoleUtilisateur
  civilite?: string
  nom?: string
  prenom?: string
  pseudonyme?: string
  telephone?: string
  numero_whatsapp?: string
  numero_retrait?: string | null
  email?: string
  profil_complet?: boolean
  actif?: boolean
  photo_profil?: string | null
  cip_url?: string | null
  ifu_url?: string | null
  score_credibilite?: number
  nb_etoiles?: number
  penalite_pourcentage?: number
}

// ─── Biens ────────────────────────────────────────────────────────────────

export type TypeBien = 'maison' | 'appart_vide' | 'appart_meuble' | 'guesthouse' | 'terrain'
export type TypeTransactionBien = 'vente' | 'location'
export type StatutBien = 'actif' | 'occupe' | 'vendu' | 'loue' | 'archive'
export type StatutModeration = 'en_attente' | 'approuve' | 'rejete' | 'conditionnel'

export interface Localisation {
  id?: number
  adresse?: string
  ville?: string
  quartier?: string
  latitude?: number | null
  longitude?: number | null
}

export interface Photo {
  id: number
  bien_id?: number
  piece_id?: number | null
  url: string
  is_cover?: boolean
}

export interface Piece {
  id: number
  bien_id?: number
  nom: string
  surface?: number | null
  longueur?: number | string | null
  largeur?: number | string | null
  photos?: Photo[]
}

export interface Bien {
  id: number
  user_id?: number | null
  user?: User
  localisation_id?: number
  localisation?: Localisation
  type: TypeBien
  transaction: TypeTransactionBien
  /** Colonne numérique : parfois renvoyée en chaîne. */
  prix: number | string
  prix_promo?: number | string | null
  frais_visite?: number | string
  description?: string
  statut: StatutBien
  statut_moderation?: StatutModeration
  motif_refus?: string | null
  conditions_speciales?: string | null
  score_qualite?: number
  nb_consultations?: number
  amenites?: Record<string, unknown> | null
  en_gestion?: boolean
  disponible_a?: IsoDate | null
  code_invitation?: string | null
  created_at?: IsoDate
  updated_at?: IsoDate
  details_maison?: { superficie?: number; cloture?: boolean } | null
  details_appart?: { entree_personnelle?: boolean } | null
  details_terrain?: { superficie?: number; cloture?: boolean } | null
  pieces?: Piece[]
  photos?: Photo[]
  /** Statut du favori pour l'utilisateur courant, quand l'API le renseigne. */
  isFavori?: boolean
}

/** `GET /biens/:id`, création, mise à jour : le bien, parfois enveloppé dans `data` ou `bien`. */
export type BienResponse = Bien & { data?: Bien; bien?: Bien }

export interface FavoriToggleResponse { isFavori: boolean }

// ─── Visites ──────────────────────────────────────────────────────────────

export type StatutVisite =
  | 'en_attente' | 'contre_proposee' | 'confirmee' | 'effectuee' | 'annulee' | 'echouee'

export interface Creneau {
  id: number
  bien_id?: number
  user_id?: number
  bien?: Bien
  date_debut: IsoDate
  date_fin: IsoDate
  est_disponible?: boolean
  created_at?: IsoDate
}

export interface AnnulationVisite {
  id: number
  visite_id?: number
  annule_par_id?: number
  cote_annulateur?: string
  est_tardive?: boolean
  motif?: string
  penalite_appliquee?: string
  created_at?: IsoDate
}

export interface Visite {
  id: number
  bien_id?: number
  bien?: Bien
  client_id?: number
  client?: User
  gestionnaire_id?: number
  gestionnaire?: User
  creneau_id?: number | null
  creneau?: Creneau | null
  date_souhaitee?: IsoDate | null
  date_contre_proposee?: IsoDate | null
  statut: StatutVisite
  frais_visite?: number | string
  paiement_effectue?: boolean
  client_decision_integration?: boolean | null
  paiement_integration_effectue?: boolean
  numeros_partages?: boolean
  note_client?: number | null
  feedback_tags?: string[] | null
  feedback_libre?: string | null
  feedback_donne?: boolean
  annulation?: AnnulationVisite | null
  created_at?: IsoDate
  updated_at?: IsoDate
}

export interface FeedbackVisiteBody { note: number; tags?: string[]; texte?: string }

// ─── Messagerie ───────────────────────────────────────────────────────────

export type TypeMessage = 'texte' | 'systeme' | 'slot_proposal'

export interface Message {
  id: number
  conversation_id?: number
  expediteur_id?: number | null
  expediteur?: User | null
  type?: TypeMessage
  contenu: string
  lu?: boolean
  lu_at?: IsoDate | null
  epingle?: boolean
  modifie?: boolean
  reply_to_id?: number | null
  reply_to_contenu?: string | null
  metadata?: Record<string, unknown> | null
  supprime_pour_tous?: boolean
  created_at?: IsoDate
}

export interface Conversation {
  id: number
  bien_id?: number | null
  bien?: Bien | null
  visite_id?: number | null
  client_id?: number
  gestionnaire_id?: number
  code_visite?: string | null
  numeros_partages?: boolean
  participants?: User[]
  dernierMessage?: Message | null
  /** Nombre de messages non lus pour l'utilisateur courant. */
  nonLus?: number
  created_at?: IsoDate
  updated_at?: IsoDate
}

export interface ChatSearchHit {
  conversationId: number
  conversation?: Conversation
  message?: Message
  [key: string]: unknown
}

/** `POST /chat/conversations` : la conversation, ou son identifiant seul. */
export type ConversationResponse = Conversation & { conversationId?: number; data?: Conversation }

/** `GET /chat/search` : conversations et messages correspondants. */
export interface ChatSearchResponse {
  conversations?: Conversation[]
  messages?: ChatSearchHit[]
}

export interface PlainteBody { message_id?: number; conversation_id?: number; contenu: string }

// ─── Notifications (alertes) ──────────────────────────────────────────────

export interface Notification {
  id: number
  user_id?: number
  type: string
  titre: string
  /** Ancien nom du libellé, encore lu par les écrans en repli de `titre`. */
  message?: string
  corps?: string
  target_role?: string | null
  lu: boolean
  meta?: Record<string, any> | null
  created_at: IsoDate
}

export interface NotificationsCount { count: number }

// ─── Paiements ────────────────────────────────────────────────────────────

export type MethodePaiement = 'momo' | 'flooz' | 'celtiis' | 'fedapay'

export interface Paiement {
  id: number
  reference?: string
  type?: string
  statut?: string
  methode_paiement?: MethodePaiement
  montant: number | string
  payeur_id?: number
  beneficiaire_id?: number | null
  telephone_paiement?: string | null
  reference_externe?: string | null
  visite_id?: number | null
  loyer_id?: number | null
  contrat_id?: number | null
  description?: string
  erreur?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: IsoDate
  updated_at?: IsoDate
}
