import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}` } })

/** Type de wallet par défaut : c'est le seul réellement crédité par les paiements (loyers, frais de visite). */
const TYPE_DEFAUT = 'revenus_locatifs'

export const walletApi = {
  /** Le wallet d'un type précis (par défaut : revenus_locatifs). Renvoie { balance, updated_at, ... }. */
  me: (type: string = TYPE_DEFAUT) =>
    axios.get(`${BASE}/wallets/me/solde`, { ...auth(), params: { type } }).then(r => r.data),

  /** Tous les wallets de l'utilisateur (array), tous types confondus. */
  mesWallets: () =>
    axios.get(`${BASE}/wallets/me`, auth()).then(r => r.data),

  transactions: (type: string = TYPE_DEFAUT) =>
    axios.get(`${BASE}/wallets/me/transactions`, { ...auth(), params: { type } }).then(r => r.data),

  /** Débite le wallet et crée une demande de retrait (payout FedaPay après validation admin). */
  demandeRetrait: (montant: number, walletType: string = TYPE_DEFAUT) =>
    axios.post(`${BASE}/retraits/me`, { montant, wallet_type: walletType }, auth()).then(r => r.data),

  mesRetraits: () =>
    axios.get(`${BASE}/retraits/me`, auth()).then(r => r.data),

  /** Numéro Mobile Money utilisé pour les payouts de retrait (masqué). */
  numeroRetrait: () =>
    axios.get(`${BASE}/wallets/me/numero-retrait`, auth()).then(r => r.data as { numero_retrait: string | null; masque: string | null; source: string }),

  /** Étape 1 : envoie un OTP sur le numéro principal du compte pour confirmer le changement. */
  initierChangementNumeroRetrait: (nouveauNumero: string, motDePasse: string) =>
    axios.post(`${BASE}/wallets/me/numero-retrait/initier`, { nouveau_numero: nouveauNumero, mot_de_passe: motDePasse }, auth())
      .then(r => r.data as { session_token: string; expires_in: number; nouveau_numero: string }),

  /** Étape 2 : confirme l'OTP et enregistre le nouveau numéro de retrait. */
  confirmerChangementNumeroRetrait: (sessionToken: string, codeOtp: string, nouveauNumero: string) =>
    axios.post(`${BASE}/wallets/me/numero-retrait/confirmer`, { session_token: sessionToken, code_otp: codeOtp, nouveau_numero: nouveauNumero }, auth()).then(r => r.data),
}
