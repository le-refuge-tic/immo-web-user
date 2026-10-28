import axios from 'axios'
import type {
  ChatSearchResponse, Conversation, ConversationResponse, ListResponse, Message, MessageSupprimeResponse,
  PlainteBody, PlainteResponse, SuccesResponse,
} from '../types/api'
import type { ChatMessage } from '../types/chat-ui'
import { BASE, auth } from './apiBase'

export interface MessagesParams { limit?: number; before?: number | string; [cle: string]: string | number | undefined }

export const chatApi = {
  conversations: () =>
    axios.get<ListResponse<Conversation>>(`${BASE}/chat/conversations`, auth()).then(r => r.data),

  creerConversation: (bienId: number) =>
    axios.post<ConversationResponse>(`${BASE}/chat/conversations`, { bienId }, auth()).then(r => r.data),

  search: (q: string) =>
    axios.get<ChatSearchResponse>(`${BASE}/chat/search`, { ...auth(), params: { q } }).then(r => r.data),

  messages: (convId: number, params?: MessagesParams) =>
    axios.get<ListResponse<Message>>(`${BASE}/chat/conversations/${convId}/messages`, { ...auth(), params }).then(r => r.data),

  envoyer: (convId: number, contenu: string, replyToId?: number, replyToContenu?: string) =>
    axios.post<Message>(`${BASE}/chat/conversations/${convId}/messages`,
      { contenu, reply_to_id: replyToId, reply_to_contenu: replyToContenu }, auth()).then(r => r.data),

  marquerLus: (convId: number) =>
    axios.post<SuccesResponse>(`${BASE}/chat/conversations/${convId}/lus`, {}, auth()).then(r => r.data),

  togglePin: (convId: number, msgId: number | null) =>
    axios.post<SuccesResponse>(`${BASE}/chat/conversations/${convId}/pin`, { msgId }, auth()).then(r => r.data),

  modifierMessage: (msgId: number, contenu: string) =>
    axios.patch<Message>(`${BASE}/chat/messages/${msgId}`, { contenu }, auth()).then(r => r.data),

  supprimerMessage: (msgId: number) =>
    axios.delete<MessageSupprimeResponse>(`${BASE}/chat/messages/${msgId}`, auth()).then(r => r.data),

  proposerCreneau: (convId: number, proposedAt: string) =>
    axios.post<ChatMessage>(`${BASE}/chat/conversations/${convId}/slot`, { proposed_at: proposedAt }, auth()).then(r => r.data),

  repondreProposition: (messageId: number, response: 'accepted' | 'declined' | 'countered', proposedAt?: string) =>
    axios.patch<ChatMessage>(`${BASE}/chat/slots/${messageId}`, { response, proposed_at: proposedAt }, auth()).then(r => r.data),

  creerPlainte: (body: PlainteBody) =>
    axios.post<PlainteResponse>(`${BASE}/users/me/plainte`, body, auth()).then(r => r.data),
}
