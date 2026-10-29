/**
 * Affichage d'une guesthouse : nom, capacité, lits, équipements, règles.
 * Le nom n'a pas de colonne : c'est la 1re ligne de la description (même convention
 * que le titre d'un terrain), séparée du texte par une ligne vide.
 */
import type { DetailsGuesthouse, EquipementBien, LitGuesthouse } from '../types/api'

/** Types dont le nom est la 1re ligne de la description (guesthouse, salle de fêtes). */
const TYPES_AVEC_NOM = ['guesthouse', 'salle_fete']

export function nomEtDescription(b: { type?: string; description?: string | null }): { nom: string | null; description: string } {
  const desc = (b.description ?? '').trim()
  const coupe = desc.indexOf('\n\n')
  if (!TYPES_AVEC_NOM.includes(b.type ?? '') || coupe <= 0) return { nom: null, description: desc }
  return { nom: desc.slice(0, coupe).trim(), description: desc.slice(coupe + 2).trim() }
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`

/** « 4 voyageurs · 2 chambres » ; null sans détails. */
export function resumeCapacite(d: Pick<DetailsGuesthouse, 'capacite' | 'nb_chambres'> | null | undefined): string | null {
  if (!d) return null
  return `${pluriel(d.capacite, 'voyageur')} · ${pluriel(d.nb_chambres, 'chambre')}`
}

const LITS: Record<string, [string, string]> = {
  double: ['lit double', 'lits doubles'],
  simple: ['lit simple', 'lits simples'],
  superpose: ['lit superposé', 'lits superposés'],
  canape_lit: ['canapé-lit', 'canapés-lits'],
}

export function libelleLits(lits: LitGuesthouse[]): string {
  return lits.map(l => {
    const [un, plusieurs] = LITS[l.type] ?? [l.type, l.type]
    return `${l.nombre} ${l.nombre > 1 ? plusieurs : un}`
  }).join(', ')
}

/** Ordre d'affichage : le même que `GET /equipements` (les 3 premières et « Confort et accès » sont celles des salles de fêtes). */
const CATEGORIES: [string, string][] = [
  ['son_scene', 'Son, scène et projection'],
  ['mobilier', 'Mobilier'],
  ['base', 'Base'],
  ['cuisine', 'Cuisine'],
  ['linge_hygiene', 'Linge et hygiène'],
  ['exterieur', 'Extérieur'],
  ['parking', 'Parking'],
  ['autonomie_securite', 'Autonomie et sécurité'],
  ['confort_acces', 'Confort et accès'],
  ['services', 'Services'],
]

export type GroupeEquipements = { categorie: string; libelle: string; equipements: EquipementBien[] }

/** Équipements cochés, groupés par catégorie dans l'ordre du référentiel. */
export function grouperEquipements(liste: EquipementBien[] | null | undefined): GroupeEquipements[] {
  const tries = [...(liste ?? [])].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
  return CATEGORIES
    .map(([categorie, libelle]) => ({ categorie, libelle, equipements: tries.filter(e => e.categorie === categorie) }))
    .filter(g => g.equipements.length > 0)
}

/** Horaires, règles de la maison et garage, en phrases courtes. */
export function regles(d: Pick<DetailsGuesthouse,
  'heure_arrivee' | 'heure_depart' | 'animaux_autorises' | 'fetes_autorisees' | 'fumeur_autorise' | 'garage' | 'type_acces_garage'>): string[] {
  return [
    `Arrivée à partir de ${d.heure_arrivee.slice(0, 5)}`,
    `Départ avant ${d.heure_depart.slice(0, 5)}`,
    d.animaux_autorises ? 'Animaux autorisés' : 'Animaux non autorisés',
    d.fetes_autorisees ? 'Fêtes autorisées' : 'Fêtes non autorisées',
    d.fumeur_autorise ? 'Fumeurs acceptés' : 'Non-fumeur',
    d.garage ? `Garage : accès ${d.type_acces_garage === 'prive' ? 'privé' : 'commun'}` : 'Pas de garage',
  ]
}
