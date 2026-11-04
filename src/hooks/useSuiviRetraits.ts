import { useCallback, useEffect, useRef, useState } from 'react'
import { walletApi } from '../api/walletApi'
import { estRetraitEnCours } from '../utils/retrait'
import type { RetraitProprio } from '../types/proprietaire'

const INTERVALLE_MS = 8000

/**
 * Suivi des demandes de retrait : liste (GET /retraits/me), rafraîchie toute seule tant
 * qu'un virement est en cours. Quand l'un se termine, `quandTermine` est appelé : un échec
 * rend le montant au portefeuille, l'écran doit alors relire le solde.
 */
export function useSuiviRetraits(quandTermine?: () => void) {
  const [retraits, setRetraits] = useState<RetraitProprio[]>([])
  const precedent = useRef<Map<number, string>>(new Map())
  const rappel = useRef(quandTermine)
  rappel.current = quandTermine

  const recharger = useCallback(async () => {
    try {
      const r = await walletApi.mesRetraits()
      setRetraits(Array.isArray(r) ? r : r.data || [])
    } catch { /* le suivi est secondaire : on garde la liste déjà affichée */ }
  }, [])

  useEffect(() => { recharger() }, [recharger])

  const actif = retraits.some(r => estRetraitEnCours(r.statut))
  useEffect(() => {
    if (!actif) return
    const id = setInterval(recharger, INTERVALLE_MS)
    return () => clearInterval(id)
  }, [actif, recharger])

  useEffect(() => {
    const termine = retraits.some(r => {
      const avant = precedent.current.get(r.id)
      return avant !== undefined && estRetraitEnCours(avant) && !estRetraitEnCours(r.statut)
    })
    precedent.current = new Map(retraits.map(r => [r.id, r.statut]))
    if (termine) rappel.current?.()
  }, [retraits])

  return { retraits, recharger }
}
