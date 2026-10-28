import axios from 'axios'
import { BASE, auth } from './apiBase'
import type { ListResponse } from '../types/api'
import type { RetraitProprio } from '../types/proprietaire'
import type {
  ConfirmerChangementNumeroResponse, InitierChangementNumeroResponse, NumeroRetraitInfo, Wallet, WalletTransaction,
} from '../types/wallet'
import { idempotencyHeader } from '../utils/paymentAttempt'

/** Type de wallet par défaut : c'est le seul réellement crédité par les paiements (loyers, frais de visite). */
const TYPE_DEFAUT = 'revenus_locatifs'

export const walletApi = {
  /** Le wallet d'un type précis (par défaut : revenus_locatifs). Renvoie { balance, updated_at, ... }. */
  me: (type: string = TYPE_DEFAUT) =>
    axios.get<Wallet>(`${BASE}/wallets/me/solde`, { ...auth(), params: { type } }).then(r => r.data),

  /** Tous les wallets de l'utilisateur (array), tous types confondus. */
  mesWallets: () =>
    axios.get<Wallet[]>(`${BASE}/wallets/me`, auth()).then(r => r.data),

  transactions: (type: string = TYPE_DEFAUT) =>
    axios.get<ListResponse<WalletTransaction>>(`${BASE}/wallets/me/transactions`, { ...auth(), params: { type } }).then(r => r.data),

  /**
   * Débite le wallet et crée une demande de retrait (payout FedaPay après validation admin).
   * La clé d'idempotence évite un double débit si la demande est renvoyée (FE-B-006).
   */
  demandeRetrait: (montant: number, walletType: string, idempotencyKey: string) =>
    axios.post<RetraitProprio>(`${BASE}/retraits/me`, { montant, wallet_type: walletType },
      { ...auth(), headers: { ...auth().headers, ...idempotencyHeader(idempotencyKey) } }).then(r => r.data),

  mesRetraits: () =>
    axios.get<ListResponse<RetraitProprio>>(`${BASE}/retraits/me`, auth()).then(r => r.data),

  /** Numéro Mobile Money utilisé pour les payouts de retrait (masqué). */
  numeroRetrait: () =>
    axios.get<NumeroRetraitInfo>(`${BASE}/wallets/me/numero-retrait`, auth()).then(r => r.data),

  /** Étape 1 : envoie un OTP sur le numéro principal du compte pour confirmer le changement. */
  initierChangementNumeroRetrait: (nouveauNumero: string, motDePasse: string) =>
    axios.post<InitierChangementNumeroResponse>(`${BASE}/wallets/me/numero-retrait/initier`, { nouveau_numero: nouveauNumero, mot_de_passe: motDePasse }, auth())
      .then(r => r.data),

  /** Étape 2 : confirme l'OTP et enregistre le nouveau numéro de retrait. */
  confirmerChangementNumeroRetrait: (sessionToken: string, codeOtp: string, nouveauNumero: string) =>
    axios.post<ConfirmerChangementNumeroResponse>(`${BASE}/wallets/me/numero-retrait/confirmer`, { session_token: sessionToken, code_otp: codeOtp, nouveau_numero: nouveauNumero }, auth()).then(r => r.data),
}
