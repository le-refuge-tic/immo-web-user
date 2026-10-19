import axios from 'axios'
import { BASE, auth } from './apiBase'

export interface CompteursCommercial {
  total_publies: number
  en_verification: number
  valides: number
  valides_semaine: number
}

export interface PerfHebdoSemaine {
  semaine_debut: string
  nb_biens_valides: number
  montant: number
  palier_atteint: boolean
}

export const commercialApi = {
  /** Compteurs du commercial connecté : total publiés, en vérification, validés, validés cette semaine. */
  compteurs: (commercialId: number) =>
    axios.get(`${BASE}/admin/commerciaux/${commercialId}/compteurs`, auth())
      .then(r => r.data as CompteursCommercial),

  /** Historique hebdomadaire de performance (gains par semaine) du commercial. */
  performanceHebdo: (commercialId: number, semaines = 8) =>
    axios.get(`${BASE}/admin/commerciaux/${commercialId}/performance-hebdo`, { ...auth(), params: { semaines } })
      .then(r => r.data as PerfHebdoSemaine[]),
}
