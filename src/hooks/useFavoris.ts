import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/useAuth'
import { useToast } from '../context/useToast'
import { track } from '../lib/analytics'
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

/**
 * Lot 12 — favori d'un bien sur sa fiche. L'état vient du même cache React Query que les cœurs des
 * cartes et la page Favoris : un clic ici met tout à jour, et inversement.
 * Hors connexion, le clic mène à la connexion puis ramène sur la fiche (`post_login_redirect`).
 */
export function useFavoriBien(bien: { id: number; type?: string }) {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { data } = useFavorisQuery(isLoggedIn)
  const [enCours, setEnCours] = useState(false)
  const estFavori = useMemo(() => (data ?? []).some(f => favoriId(f) === bien.id), [data, bien.id])

  const basculer = useCallback(async () => {
    if (!isLoggedIn) {
      sessionStorage.setItem('post_login_redirect', window.location.pathname + window.location.search)
      navigate('/login')
      return
    }
    if (enCours) return
    setEnCours(true)
    try {
      const { isFavori } = await favoritesApi.toggle(bien.id)
      if (isFavori) track('favori_ajoute', { type: bien.type ?? '' })
      else queryClient.setQueryData<Favori[]>(queryKeys.favoris, prev => prev?.filter(f => favoriId(f) !== bien.id))
      await queryClient.invalidateQueries({ queryKey: queryKeys.favoris })
      toast(isFavori ? 'Ajouté aux favoris' : 'Retiré des favoris', 'success')
    } catch {
      toast('Favori non enregistré. Réessayez.', 'error')
    } finally {
      setEnCours(false)
    }
  }, [isLoggedIn, enCours, bien.id, bien.type, navigate, queryClient, toast])

  return { estFavori, enCours, basculer }
}
