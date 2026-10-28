import { useCallback, useRef, useState } from 'react'
import { creerTentative, type Tentative } from '../utils/paymentAttempt'

export type PaymentAttempt = Tentative

/**
 * Une clé `Idempotency-Key` par tentative d'opération d'argent (FE-B-006) : rejouer la
 * même demande après une coupure retrouve la transaction déjà créée au lieu d'en
 * ouvrir une seconde. Logique dans `creerTentative` (utils/paymentAttempt).
 */
export function usePaymentAttempt(): PaymentAttempt {
  const [tentative] = useState(() => creerTentative())
  return tentative
}

/** Une tentative par objet payé (par exemple par loyer, quand plusieurs loyers sont payés à la suite). */
export function useTentativesParCle(): (cle: string | number) => PaymentAttempt {
  const tentatives = useRef(new Map<string | number, PaymentAttempt>())
  return useCallback((cle: string | number) => {
    let t = tentatives.current.get(cle)
    if (!t) { t = creerTentative(); tentatives.current.set(cle, t) }
    return t
  }, [])
}
