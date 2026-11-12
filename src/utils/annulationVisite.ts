import type { Visite } from '../types/api'
import { dateEffectiveVisite, type VisiteDatable } from './dateVisite'

/**
 * Politique des frais de visite, côté prospect — même grille que le backend
 * (immo-backend/src/visites/remboursement-visite.util.ts), à garder alignée :
 *   ≥ 24 h avant la visite → 100 %, ou report gratuit (même bien, 30 jours)
 *   ≥ 2 h                  → 70 %
 *   ≥ 1 h                  → 50 %
 *   < 1 h                  → rien
 * Le serveur fait foi : ce calcul ne sert qu'à prévenir le prospect.
 */

export type ChoixAnnulation = 'rembourser' | 'reporter'

export const DUREE_REPORT_JOURS = 30
export const DELAI_REMBOURSEMENT_JOURS = 7

const PALIERS: ReadonlyArray<readonly [number, number]> = [
  [24 * 60, 100],
  [2 * 60, 70],
  [60, 50],
]

export type VisiteAnnulable = VisiteDatable &
  Pick<Visite, 'paiement_effectue' | 'frais_visite' | 'couverture'>

export interface PolitiqueAnnulation {
  /** Frais réellement payés pour cette visite (0 : rien à rembourser). */
  fraisPayes: number
  pourcentage: number
  /** Montant remboursé si le prospect ne reporte pas. */
  montant: number
  /** Le prospect peut reporter au lieu d'être remboursé. */
  reportPossible: boolean
}

export function politiqueAnnulation(v: VisiteAnnulable, maintenant = Date.now()): PolitiqueAnnulation {
  const frais = Number(v.frais_visite)
  const fraisPayes = v.paiement_effectue && v.couverture !== 'bonus' && frais > 0 ? frais : 0
  if (!fraisPayes) return { fraisPayes: 0, pourcentage: 0, montant: 0, reportPossible: false }

  const date = dateEffectiveVisite(v)
  const minutes = date ? (new Date(date).getTime() - maintenant) / 60_000 : Infinity
  const palier = PALIERS.find(([min]) => minutes >= min)
  const pourcentage = palier ? palier[1] : 0
  return {
    fraisPayes,
    pourcentage,
    montant: Math.floor((fraisPayes * pourcentage) / 100),
    // Une visite déjà reportée ne se reporte pas une seconde fois.
    reportPossible: minutes >= 24 * 60 && v.couverture !== 'report',
  }
}

export const fcfa = (montant: number) => `${montant.toLocaleString('fr-FR')} FCFA`
