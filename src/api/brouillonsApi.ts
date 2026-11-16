import axios from 'axios'
import { BASE, auth } from './apiBase'
import type { ApiBrouillons } from '../shared/brouillons/synchroniser'

const ESPACE = 'proprietaire'

/** Lot 6 — brouillons du compte connecté gardés sur le serveur (espace propriétaire). */
export const brouillonsApi: ApiBrouillons = {
  lister: () =>
    axios.get(`${BASE}/brouillons-biens`, { ...auth(), params: { espace: ESPACE } }).then(r => r.data),
  lire: (cle: string) =>
    axios.get(`${BASE}/brouillons-biens/${encodeURIComponent(cle)}`, { ...auth(), params: { espace: ESPACE } }).then(r => r.data),
  enregistrer: e =>
    axios.post(`${BASE}/brouillons-biens`, {
      espace: ESPACE, cle: e.cle, famille: e.famille, libelle: e.libelle.slice(0, 120), etape: e.etape, donnees: e.donnees, maj_le: e.majLe,
    }, auth()).then(r => r.data),
  supprimer: (cle: string, majLeMax: number) =>
    axios.delete(`${BASE}/brouillons-biens/${encodeURIComponent(cle)}`, { ...auth(), params: { espace: ESPACE, maj_le_max: majLeMax } }).then(() => undefined),
}
