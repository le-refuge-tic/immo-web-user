import axios from 'axios'
import { BASE, auth } from './apiBase'
import { idempotencyHeader } from '../utils/paymentAttempt'
import type { ListResponse } from '../types/api'
import type { RechargementWalletResponse } from '../types/wallet'
import type {
  HistoriquePaiement, InitierPaiementResponse, PayerCotisationResponse, RepairLoyerResponse,
  StatutPaiementIntegration, StatutPaiementLoyer, StatutPaiementVisite, StatutRechargement,
} from '../types/paiement'
import type { InitiationLoyerReponse } from '../types/locataire'
import type { Recu } from '../types/recu'

/** En-têtes d'une initiation de paiement : jeton + clé d'idempotence (FE-B-006). */
const authIdempotent = (idempotencyKey: string) => {
  const base = auth()
  return { ...base, headers: { ...base.headers, ...idempotencyHeader(idempotencyKey) } }
}

export type MethodePaiement = 'momo' | 'flooz' | 'celtiis' | 'fedapay'

export const paiementApi = {
  // Paiement visite (frais)
  initierVisite: (body: { visite_id: number; phone: string; methode_paiement?: MethodePaiement }, idempotencyKey: string) =>
    axios.post<InitierPaiementResponse>(`${BASE}/paiements/visite`, body, authIdempotent(idempotencyKey)).then(r => r.data),

  statutVisite: (refId: string) =>
    axios.get<StatutPaiementVisite>(`${BASE}/paiements/visite/${refId}/statut`, auth()).then(r => r.data),

  recuVisite: (refId: string) =>
    axios.get<Recu>(`${BASE}/paiements/visite/${refId}/recu`, auth()).then(r => r.data),

  // Paiement intégration (avance + caution)
  initierIntegration: (body: { visite_id: number; phone: string; methode_paiement?: MethodePaiement }, idempotencyKey: string) =>
    axios.post<InitierPaiementResponse>(`${BASE}/paiements/integration`, body, authIdempotent(idempotencyKey)).then(r => r.data),

  statutIntegration: (refId: string) =>
    axios.get<StatutPaiementIntegration>(`${BASE}/paiements/integration/${refId}/statut`, auth()).then(r => r.data),

  recuIntegration: (refId: string) =>
    axios.get<Recu>(`${BASE}/paiements/integration/${refId}/recu`, auth()).then(r => r.data),

  // Paiement loyer
  /** Rejouer la même clé renvoie la transaction existante avec son URL de paiement (FE-B-006). */
  initierLoyer: (body: { loyer_id: number; methode_paiement: MethodePaiement; telephone_paiement: string }, idempotencyKey: string) =>
    axios.post<InitiationLoyerReponse>(`${BASE}/paiements/loyer`, body, authIdempotent(idempotencyKey)).then(r => r.data),

  statutLoyer: (refId: string) =>
    axios.get<StatutPaiementLoyer>(`${BASE}/paiements/loyer/${refId}/statut`, auth()).then(r => r.data),

  recuLoyer: (refId: string) =>
    axios.get<Recu>(`${BASE}/paiements/loyer/${refId}/recu`, auth()).then(r => r.data),

  /** Réconcilie un loyer resté "en attente" alors que la transaction a été confirmée côté serveur. */
  repairerLoyer: (loyerId: number) =>
    axios.post<RepairLoyerResponse>(`${BASE}/paiements/loyer/${loyerId}/repair`, {}, auth()).then(r => r.data),

  /** Paie un ou plusieurs loyers directement depuis le solde du wallet cotisation. */
  payerLoyersAvecCotisation: (loyerIds: number[]) =>
    axios.post<PayerCotisationResponse>(`${BASE}/paiements/loyer/cotisation`, { loyer_ids: loyerIds }, auth()).then(r => r.data),

  /** Recharge un wallet (cotisation/épargne) via Mobile Money ou FedaPay. */
  initierRechargementWallet: (body: { wallet_type: 'cotisation' | 'epargne'; montant: number; methode_paiement: MethodePaiement; telephone?: string }, idempotencyKey: string) =>
    axios.post<RechargementWalletResponse>(`${BASE}/paiements/depot`, body, authIdempotent(idempotencyKey)).then(r => r.data),

  statutRechargement: (refId: string) =>
    axios.get<StatutRechargement>(`${BASE}/paiements/depot/${refId}/statut`, auth()).then(r => r.data),

  recuDepot: (refId: string) =>
    axios.get<Recu>(`${BASE}/paiements/depot/${refId}/recu`, auth()).then(r => r.data),

  /** Historique consolidé de toutes mes transactions (visites, loyers, intégration, virements). */
  historique: () =>
    axios.get<ListResponse<HistoriquePaiement>>(`${BASE}/paiements/historique`, auth()).then(r => r.data),
}
