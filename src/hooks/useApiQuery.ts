import { useCallback, useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import axios from 'axios'

export interface UseApiQueryOptions {
  /** `false` : aucune requête n'est émise (ex. utilisateur non connecté). Défaut : `true`. */
  enabled?: boolean
}

export interface UseApiQueryResult<T> {
  /** Dernière réponse valide ; conservée si un rechargement échoue. */
  data: T | undefined
  /** Mise à jour locale (optimiste) de `data`, sans requête. */
  setData: Dispatch<SetStateAction<T | undefined>>
  /** `true` pendant le chargement initial et pendant chaque `refetch`. */
  loading: boolean
  /** Erreur de la dernière requête (`null` si elle a réussi). */
  error: unknown
  /** Relance la requête : annule la précédente encore en vol. */
  refetch: () => void
}

/**
 * Charge une ressource avec annulation et ordre garanti (FE-A-004).
 *
 * - le `fetcher` reçoit un `AbortSignal` à transmettre à axios ;
 * - tout nouveau chargement (changement de `deps` ou `refetch`) annule le
 *   précédent, et la réponse d'une requête périmée est ignorée : l'écran ne
 *   peut donc jamais afficher un résultat plus ancien que la dernière demande ;
 * - le démontage annule la requête en cours (plus de `setState` après démontage) ;
 * - `loading` / `error` / `refetch` couvrent les états d'écran usuels.
 *
 * @param fetcher appel d'API ; lu à chaque (re)chargement, il n'a pas besoin d'être mémoïsé
 * @param deps    valeurs qui, en changeant, déclenchent un rechargement
 */
export function useApiQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
  { enabled = true }: UseApiQueryOptions = {},
): UseApiQueryResult<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<unknown>(null)

  const fetcherRef = useRef(fetcher)
  const controllerRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => { fetcherRef.current = fetcher })

  const run = useCallback(() => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    const requestId = ++requestIdRef.current
    const isCurrent = () => requestId === requestIdRef.current

    setLoading(true)
    setError(null)
    fetcherRef.current(controller.signal)
      .then(result => {
        if (!isCurrent()) return
        setData(result)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!isCurrent() || axios.isCancel(err)) return
        setError(err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!enabled) {
      requestIdRef.current++
      setLoading(false)
      return
    }
    run()
    return () => {
      requestIdRef.current++
      controllerRef.current?.abort()
    }
    // `deps` est fourni par l'appelant : c'est lui qui décide quand recharger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, run, ...deps])

  return { data, setData, loading, error, refetch: run }
}
