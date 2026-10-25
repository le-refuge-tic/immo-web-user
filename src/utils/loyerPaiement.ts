import type { PollOutcome } from '../hooks/usePaymentPolling'
import type { InitiationLoyerReponse } from '../types/locataire'
import type { RepairLoyerResponse, StatutPaiementLoyer } from '../types/paiement'

/**
 * Référence de la transaction renvoyée par `POST /paiements/loyer`
 * (champ `reference`, voir `initierPaiementLoyer` du backend). `null` si absente :
 * le suivi ne doit alors jamais partir (`/paiements/loyer/undefined/statut`).
 */
export function referenceLoyer(res: Partial<Pick<InitiationLoyerReponse, 'reference'>> | null | undefined): string | null {
  const ref = res?.reference
  return typeof ref === 'string' && ref.trim() !== '' ? ref : null
}

/** Statut de `GET /paiements/loyer/:ref/statut` traduit pour le suivi (usePaymentPolling). */
export function issueStatutLoyer(statut: StatutPaiementLoyer['statut'] | undefined): PollOutcome {
  if (statut === 'reussi') return 'success'
  if (statut === 'echoue') return 'failed'
  return 'waiting'
}

/** Vrai quand la réparation a réellement rejoué un paiement confirmé (champ `repare` du backend). */
export function loyerRepare(res: Partial<RepairLoyerResponse> | null | undefined): boolean {
  return res?.repare === true
}
