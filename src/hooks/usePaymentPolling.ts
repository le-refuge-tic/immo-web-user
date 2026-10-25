import { useCallback, useEffect, useMemo, useRef } from 'react'

export type PollOutcome = 'success' | 'failed' | 'waiting'

export interface PollOptions {
  intervalMs: number
  maxAttempts: number
  /** Interroge l'opérateur ; une erreur réseau compte comme « toujours en attente ». */
  check: () => Promise<PollOutcome>
  onSuccess: () => void
  onFailed: () => void
  onTimeout: () => void
}

export interface PaymentPolling {
  start: (options: PollOptions) => void
  stop: () => void
}

/**
 * Suivi d'une transaction chez l'opérateur (FE-B-006) : un seul suivi actif à la
 * fois, arrêté au démontage, et une issue terminale (succès, refus, délai) n'est
 * jamais écrasée par un tick tardif d'un suivi précédent.
 */
export function usePaymentPolling(): PaymentPolling {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  useEffect(() => stop, [stop])

  const start = useCallback((options: PollOptions) => {
    stop()
    let attempts = 0
    const id = setInterval(async () => {
      attempts++
      let outcome: PollOutcome = 'waiting'
      try { outcome = await options.check() } catch { /* réseau : on retentera au prochain tick */ }
      // Arrêté ou remplacé pendant l'attente de la réponse : ce tick est périmé.
      if (timerRef.current !== id) return
      if (outcome === 'success') { stop(); options.onSuccess(); return }
      if (outcome === 'failed') { stop(); options.onFailed(); return }
      if (attempts >= options.maxAttempts) { stop(); options.onTimeout() }
    }, options.intervalMs)
    timerRef.current = id
  }, [stop])

  return useMemo(() => ({ start, stop }), [start, stop])
}
