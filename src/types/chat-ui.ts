/**
 * Types de la messagerie côté interface (FE-A-003).
 *
 * Les routes de chat renvoient des messages au format « Flutter » (`sender_id`,
 * `status`) et des conversations enrichies (`isOnline`, `sousType` du bien...) :
 * ces champs ne figurent pas encore dans `Message` / `Conversation` de api.ts,
 * on les ajoute ici par intersection.
 */
import type { Bien, Conversation, Message, User } from './api'

/** Métadonnées d'un message `slot_proposal` (créneau de visite proposé). */
export interface CreneauMetadata {
  /** `pending` | `accepted` | `declined` | `countered` (absent = en attente). */
  status?: string
  /** Date ISO du créneau proposé. */
  proposed_at?: string
  [cle: string]: unknown
}

/** Participant d'une conversation : drapeaux de vérification et de présence optionnels. */
export type ChatUser = User & {
  verifie?: boolean
  is_verified?: boolean
  identite_verifiee?: boolean
  isOnline?: boolean
}

export type ChatMessage = Omit<Message, 'metadata' | 'created_at'> & {
  created_at: string
  /** Identifiant de l'expéditeur (`null` pour un message système). */
  sender_id?: number | null
  /** État d'envoi affiché sur la bulle (`sent`, `read`...). */
  status?: string
  metadata?: CreneauMetadata | null
}

export type ChatBien = Bien & { sousType?: string; titre?: string }

export type ChatConversation = Omit<Conversation, 'bien' | 'participants' | 'dernierMessage'> & {
  bien?: ChatBien | null
  participants?: ChatUser[]
  dernierMessage?: ChatMessage | null
  isOnline?: boolean
}

/*
 * Frontière non typable : les types de api.ts ne décrivent pas les champs
 * propres au chat. Ces conversions ne modifient pas les données.
 */
export const asChatMessage = (m: Message): ChatMessage => m as ChatMessage
export const asChatMessages = (ms: Message[]): ChatMessage[] => ms as ChatMessage[]
export const asChatConversations = (cs: Conversation[]): ChatConversation[] => cs as ChatConversation[]
