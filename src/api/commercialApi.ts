import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}` } })

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
