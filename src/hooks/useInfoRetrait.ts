import { useCallback, useEffect, useState } from 'react'
import { walletApi } from '../api/walletApi'
import { RETRAIT_MINIMUM } from '../utils/retrait'
import type { LimitesRetrait, NumeroRetraitInfo } from '../types/wallet'

/**
 * Destination des retraits (numéro masqué, opérateur, suspension éventuelle) et limites
 * du serveur. Ce sont des informations secondaires : en cas d'échec, l'écran reste
 * utilisable (numéro « — », minimum par défaut) et le serveur tranche à la demande.
 */
export function useInfoRetrait() {
  const [info, setInfo] = useState<NumeroRetraitInfo | null>(null)
  const [limites, setLimites] = useState<Partial<LimitesRetrait>>({ min: RETRAIT_MINIMUM })

  const recharger = useCallback(() => {
    walletApi.numeroRetrait().then(setInfo).catch(() => { /* la ligne reste « non défini » */ })
  }, [])

  useEffect(() => {
    recharger()
    walletApi.limitesRetrait().then(setLimites).catch(() => { /* minimum par défaut */ })
  }, [recharger])

  return { info, limites, recharger }
}
