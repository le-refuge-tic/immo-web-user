import { QueryClient } from '@tanstack/react-query'

/**
 * Couche de données (FE-A-004) : cache par clé, déduplication, annulation et ordre garanti
 * par TanStack Query.
 *
 * - `staleTime` : pendant une minute, revenir sur un écran (fiche → accueil, Retour vers la
 *   recherche) réutilise les données sans nouvelle requête ;
 * - `gcTime` : un écran quitté garde ses données cinq minutes ;
 * - `retry: false` : une panne s'affiche tout de suite avec « Réessayer » (FE-B-001), au lieu
 *   de plusieurs nouvelles tentatives silencieuses sur un réseau mobile lent ;
 * - `refetchOnWindowFocus: false` : pas de rechargement à chaque retour sur l'onglet, pour
 *   limiter les données consommées (FE-D-004) ; les écrans « temps réel » gardent leur propre
 *   rafraîchissement.
 */
export const STALE_TIME_MS = 60_000
export const GC_TIME_MS = 5 * 60_000

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: STALE_TIME_MS, gcTime: GC_TIME_MS, retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  })
}

/** Client de l'application ; vidé à la connexion et à la déconnexion (aucune donnée d'un compte ne survit). */
export const queryClient = createQueryClient()

/**
 * Après une écriture sur un bien (création, modification, statut, photo, suppression) : listes et
 * fiches sont relues, aucun écran ne garde l'ancien état pendant la durée du cache. Un bien
 * supprimé quitte le cache aussitôt (sa fiche ne doit plus s'ouvrir depuis le cache).
 */
export function invaliderBiens(supprime?: number): void {
  if (supprime !== undefined) queryClient.removeQueries({ queryKey: ['biens', 'detail', supprime] })
  void queryClient.invalidateQueries({ queryKey: ['biens'] })
}
