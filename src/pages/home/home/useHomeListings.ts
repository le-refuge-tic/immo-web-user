import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { biensApi, type BiensListParams } from '../../../api/biensApi'
import { queryKeys } from '../../../api/queryKeys'
import { useFavoriIds } from '../../../hooks/useFavoris'
import { unwrapList } from '../../../utils/unwrapList'
import type { Bien } from '../../../types/api'

const LISTES: BiensListParams[] = [
  { transaction: 'location', limit: 100 },
  { transaction: 'vente', limit: 100 },
]

/**
 * Annonces de l'accueil (location + vente) et favoris de l'utilisateur connecté.
 * En cache (FE-A-004) : revenir d'une fiche vers l'accueil ne recharge pas les listes.
 */
export function useHomeListings(isLoggedIn: boolean) {
  const listes = useQueries({
    queries: LISTES.map(params => ({
      queryKey: queryKeys.biens.list(params),
      queryFn: ({ signal }: { signal: AbortSignal }) => biensApi.list(params, signal).then(unwrapList),
    })),
  })
  const [location, vente] = listes
  const biens = useMemo<Bien[]>(() => [...(location.data ?? []), ...(vente.data ?? [])], [location.data, vente.data])
  const loading = listes.some(q => q.isPending && q.fetchStatus !== 'idle')
  const loadError = listes.some(q => q.isError)
  const loadBiens = () => { listes.forEach(q => { void q.refetch() }) }

  // Cœurs des favoris facultatifs : sans eux, les annonces s'affichent quand même.
  const { favIds, onFavToggle: handleFavToggle } = useFavoriIds(isLoggedIn)

  return { biens, loading, loadError, favIds, loadBiens, handleFavToggle }
}
