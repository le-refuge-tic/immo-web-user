import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}` } })

export type MethodePaiement = 'momo' | 'flooz' | 'celtiis' | 'fedapay'

export const paiementApi = {
  // Paiement visite (frais)
  initierVisite: (body: { visite_id: number; phone: string; methode_paiement?: MethodePaiement }) =>
    axios.post(`${BASE}/paiements/visite`, body, auth()).then(r => r.data),

  statutVisite: (refId: string) =>
    axios.get(`${BASE}/paiements/visite/${refId}/statut`, auth()).then(r => r.data),

  recuVisite: (refId: string) =>
    axios.get(`${BASE}/paiements/visite/${refId}/recu`, auth()).then(r => r.data),

  // Paiement intégration (avance + caution)
  initierIntegration: (body: { visite_id: number; phone: string }) =>
    axios.post(`${BASE}/paiements/integration`, body, auth()).then(r => r.data),

  statutIntegration: (refId: string) =>
    axios.get(`${BASE}/paiements/integration/${refId}/statut`, auth()).then(r => r.data),

  recuIntegration: (refId: string) =>
    axios.get(`${BASE}/paiements/integration/${refId}/recu`, auth()).then(r => r.data),

  // Paiement loyer
  initierLoyer: (body: { loyer_id: number; methode_paiement: MethodePaiement; telephone_paiement: string }) =>
    axios.post(`${BASE}/paiements/loyer`, body, auth()).then(r => r.data),

  statutLoyer: (refId: string) =>
    axios.get(`${BASE}/paiements/loyer/${refId}/statut`, auth()).then(r => r.data),

  recuLoyer: (refId: string) =>
    axios.get(`${BASE}/paiements/loyer/${refId}/recu`, auth()).then(r => r.data),

  /** Réconcilie un loyer resté "en attente" alors que la transaction a été confirmée côté serveur. */
  repairerLoyer: (loyerId: number) =>
    axios.post(`${BASE}/paiements/loyer/${loyerId}/repair`, {}, auth()).then(r => r.data),

  /** Paie un ou plusieurs loyers directement depuis le solde du wallet cotisation. */
  payerLoyersAvecCotisation: (loyerIds: number[]) =>
    axios.post(`${BASE}/paiements/loyer/cotisation`, { loyer_ids: loyerIds }, auth()).then(r => r.data),

  /** Recharge un wallet (cotisation/épargne) via Mobile Money ou FedaPay. */
  initierRechargementWallet: (body: { wallet_type: 'cotisation' | 'epargne'; montant: number; methode_paiement: MethodePaiement; telephone?: string }) =>
    axios.post(`${BASE}/paiements/depot`, body, auth()).then(r => r.data),

  statutRechargement: (refId: string) =>
    axios.get(`${BASE}/paiements/depot/${refId}/statut`, auth()).then(r => r.data),
}
