import { useQuery } from '@tanstack/react-query'
import { referentielsBiens } from '../api/referentielsBiens'
import { queryKeys } from '../api/queryKeys'
import type { TarifFraisVisite } from '../utils/promoVisite'

const CINQ_MINUTES_MS = 5 * 60 * 1000

/**
 * Tarif courant des frais de visite (lot 10). Une panne ne bloque rien : sans tarif, les montants
 * s'affichent sans mention promotionnelle.
 */
export function useTarifFraisVisite(): TarifFraisVisite | undefined {
  return useQuery({
    queryKey: queryKeys.fraisVisite,
    queryFn: () => referentielsBiens.fraisVisite(),
    staleTime: CINQ_MINUTES_MS,
    retry: false,
  }).data
}
