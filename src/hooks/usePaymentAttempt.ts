import { useMemo, useRef } from 'react'
import { keepIdempotencyKey, newIdempotencyKey } from '../utils/paymentAttempt'

export interface PaymentAttempt {
  /** Clé d'idempotence de la tentative en cours (créée au premier appel). */
  key: () => string
  /** Tentative terminée (confirmée, refusée ou abandonnée) : la prochaine aura une nouvelle clé. */
  reset: () => void
  /** À appeler quand l'initiation échoue : garde la clé seulement si le serveur a pu traiter la demande. */
  fail: (err: unknown) => void
}

/**
 * Une clé `Idempotency-Key` par tentative de paiement (FE-B-006) : rejouer la
 * même demande après une coupure retrouve la transaction déjà créée au lieu
 * d'en ouvrir une seconde.
 */
export function usePaymentAttempt(): PaymentAttempt {
  const keyRef = useRef<string | null>(null)
  return useMemo<PaymentAttempt>(() => ({
    key: () => {
      if (!keyRef.current) keyRef.current = newIdempotencyKey()
      return keyRef.current
    },
    reset: () => { keyRef.current = null },
    fail: err => { if (!keepIdempotencyKey(err)) keyRef.current = null },
  }), [])
}
