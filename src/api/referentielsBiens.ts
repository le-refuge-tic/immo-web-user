import axios from 'axios'
import { BASE, auth } from './apiBase'
import { invaliderBiens } from '../lib/queryClient'

export type EquipementOption = { code: string; libelle: string }
export type GroupeEquipements = { categorie: string; libelle: string; equipements: EquipementOption[] }
export type TypeEvenement = { code: string; libelle: string }

/** Lot 4 — référentiels publics des formulaires guesthouse et salle de fêtes, et création du bien. */
export const referentielsBiens = {
  /** GET /equipements, groupés par catégorie. */
  equipements: (type: 'guesthouse' | 'salle_fete') =>
    axios.get<GroupeEquipements[]>(`${BASE}/equipements`, { params: { type } }).then(r => r.data),
  /** GET /evenements-types (salle de fêtes). */
  evenements: () => axios.get<TypeEvenement[]>(`${BASE}/evenements-types`).then(r => r.data),
  /** Frais de visite par défaut fixés par l'administration. */
  fraisVisite: () => axios.get<{ montant: number }>(`${BASE}/configuration/frais-visite`).then(r => r.data),
  /** POST /biens (guesthouse ou salle de fêtes) : toujours en attente de modération. */
  creer: (payload: unknown) =>
    axios.post<{ id: number }>(`${BASE}/biens`, payload, auth()).then(r => { invaliderBiens(); return r.data }),
}
