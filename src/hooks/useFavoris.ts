import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { favoritesApi } from '../api/favoritesApi'
import { queryKeys } from '../api/queryKeys'
import { unwrapList } from '../utils/unwrapList'
import type { Bien } from '../types/api'

/** Les favoris sont parfois renvoyés avec l'identifiant du bien dans `bien_id`. */
export type Favori = Bien & { bien_id?: number; bien?: Bien }

export const favoriId = (f: Favori): number => f.bien_id || f.id

/** Liste des favoris, partagée par l'accueil, la recherche et la page Favoris (FE-A-004). */
export function useFavorisQuery(isLoggedIn: boolean) {
  return useQuery({
    queryKey: queryKeys.favoris,
    queryFn: ({ signal }) => favoritesApi.list(signal).then(r => unwrapList<Favori>(r)),
    enabled: isLoggedIn,
  })
}

/**
 * Identifiants des favoris (cœurs des cartes) et mise à jour après un clic sur un cœur :
 * un retrait est appliqué tout de suite au cache, puis la liste est relue au serveur.
 */
export function useFavoriIds(isLoggedIn: boolean) {
  const { data } = useFavorisQuery(isLoggedIn)
  const queryClient = useQueryClient()
  const favIds = useMemo(() => new Set<number>((data ?? []).map(favoriId)), [data])
  const onFavToggle = useCallback((id: number, added: boolean) => {
    if (!added) queryClient.setQueryData<Favori[]>(queryKeys.favoris, prev => prev?.filter(f => favoriId(f) !== id))
    void queryClient.invalidateQueries({ queryKey: queryKeys.favoris })
  }, [queryClient])
  return { favIds, onFavToggle }
}
