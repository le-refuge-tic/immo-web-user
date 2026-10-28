import { useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { biensApi, type BiensListParams } from '../../../api/biensApi'
import { queryKeys } from '../../../api/queryKeys'
import { unwrapList } from '../../../utils/unwrapList'
import type { Bien, ListResponse } from '../../../types/api'

/** Délai de saisie avant d'interroger le serveur. */
export const SEARCH_DEBOUNCE_MS = 420

/**
 * Valeur retardée de `SEARCH_DEBOUNCE_MS` ; la première valeur est prise tout de suite
 * (pas d'attente à l'ouverture de la page).
 */
export function useDebouncedValue<T>(value: T, delayMs = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    if (Object.is(value, debounced)) return
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, debounced, delayMs])
  return debounced
}

/** Nombre total annoncé par le serveur, ou `null` si la réponse est un tableau sans total. */
function totalDe(page: ListResponse<Bien>): number | null {
  return Array.isArray(page) || page.total === undefined ? null : Number(page.total)
}

/**
 * Liste paginée de `GET /biens` (FE-A-004, FE-D-005) : une clé de cache par jeu de paramètres,
 * annulation de la requête précédente, jamais de réponse périmée affichée, « Afficher plus »
 * par `fetchNextPage`. Deux écrans (ou deux usages) avec les mêmes paramètres partagent la requête.
 *
 * @param paramsKey paramètres sérialisés en JSON (clé stable entre deux rendus)
 */
export function useBiensPages(paramsKey: string) {
  const params = useMemo(() => JSON.parse(paramsKey) as BiensListParams, [paramsKey])
  const query = useInfiniteQuery({
    queryKey: queryKeys.biens.pages(params),
    queryFn: ({ pageParam, signal }) => biensApi.list({ ...params, page: pageParam }, signal),
    initialPageParam: 1,
    getNextPageParam: (dernière, pages, dernierePage) => {
      const total = totalDe(dernière)
      const charges = pages.reduce((n, p) => n + unwrapList(p).length, 0)
      return total !== null && charges < total && unwrapList(dernière).length > 0 ? dernierePage + 1 : undefined
    },
  })

  const pages = query.data?.pages
  const biens = useMemo<Bien[]>(() => {
    const vus = new Set<number>()
    const liste: Bien[] = []
    for (const page of pages ?? []) {
      for (const b of unwrapList(page)) {
        if (!vus.has(b.id)) { vus.add(b.id); liste.push(b) }
      }
    }
    return liste
  }, [pages])
  const derniere = pages?.[pages.length - 1]
  const total = derniere ? (totalDe(derniere) ?? biens.length) : 0

  return { query, biens, total }
}
