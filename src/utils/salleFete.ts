/**
 * Affichage d'une salle de fêtes : résumé de carte, tarif, horaires, règles.
 * Le prix couvre `duree_heures` heures ; le prix à l'heure est calculé par le serveur
 * (`prix_par_heure`). Les heures arrivent au format HH:MM:SS ; une fin avant l'ouverture
 * tombe le lendemain (ouverture 18:00, fin 02:00).
 */
import type { ConfigurationSalle, DetailsSalleFete } from '../types/api'

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`
const fcfa = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`
const hhmm = (h: string) => h.slice(0, 5)

/** « 300 personnes · min. 4 h » ; null sans détails. */
export function resumeSalle(d: Pick<DetailsSalleFete, 'capacite' | 'heures_min'> | null | undefined): string | null {
  if (!d) return null
  return `${pluriel(d.capacite, 'personne')} · min. ${d.heures_min} h`
}

/** Prix ramené à l'heure : valeur du serveur, sinon recalculée (ancienne réponse). */
export function prixParHeure(d: Pick<DetailsSalleFete, 'prix' | 'duree_heures' | 'prix_par_heure'>): number {
  return d.prix_par_heure ?? Math.round(Number(d.prix) / Math.max(1, Number(d.duree_heures)))
}

/** Vrai si la fin tombe le lendemain de l'ouverture. */
export function finLendemain(ouverture: string, fin: string): boolean {
  return hhmm(fin) <= hhmm(ouverture)
}

export function libelleHoraires(d: Pick<DetailsSalleFete, 'heure_ouverture' | 'heure_fin_max'>): string {
  const lendemain = finLendemain(d.heure_ouverture, d.heure_fin_max)
  return `De ${hhmm(d.heure_ouverture)} à ${hhmm(d.heure_fin_max)}${lendemain ? ' (le lendemain)' : ''}`
}

const CONFIGURATIONS: Record<ConfigurationSalle, string> = {
  interieur: 'Intérieur',
  plein_air: 'Plein air',
  mixte: 'Mixte',
}
export const libelleConfiguration = (c: ConfigurationSalle) => CONFIGURATIONS[c] ?? c

const TRAITEURS: Record<DetailsSalleFete['traiteur'], string> = {
  libre: 'Traiteur libre',
  impose: 'Traiteur imposé',
  inclus: 'Traiteur inclus',
}

/** « 30 tables · 300 chaises », seulement si renseigné. */
export function libelleMobilier(d: Pick<DetailsSalleFete, 'nb_tables' | 'nb_chaises'>): string | null {
  const parties = [
    d.nb_tables != null ? pluriel(d.nb_tables, 'table') : '',
    d.nb_chaises != null ? pluriel(d.nb_chaises, 'chaise') : '',
  ].filter(Boolean)
  return parties.length ? parties.join(' · ') : null
}

export type LigneTarif = { libelle: string; valeur: string }

/** Lignes du bloc « Tarif » de la fiche. */
export function detailsPrix(d: DetailsSalleFete): LigneTarif[] {
  const plusieursHeures = d.duree_heures > 1
  const lignes: LigneTarif[] = [
    { libelle: plusieursHeures ? `Prix pour ${d.duree_heures} h` : 'Prix à l’heure', valeur: fcfa(d.prix) },
  ]
  if (plusieursHeures) lignes.push({ libelle: 'Soit, à l’heure', valeur: fcfa(prixParHeure(d)) })
  lignes.push({ libelle: 'Durée minimum', valeur: pluriel(d.heures_min, 'heure') })
  if (d.caution != null && d.caution > 0) lignes.push({ libelle: 'Caution', valeur: fcfa(d.caution) })
  if (d.frais_menage != null && d.frais_menage > 0) lignes.push({ libelle: 'Frais de ménage', valeur: fcfa(d.frais_menage) })
  return lignes
}

/** Parking, horaires et règles de la salle, en phrases courtes. */
export function reglesSalle(d: DetailsSalleFete): string[] {
  return [
    d.parking ? `Parking : ${pluriel(d.places_parking ?? 0, 'place')}` : 'Pas de parking',
    libelleHoraires(d),
    TRAITEURS[d.traiteur] ?? d.traiteur,
    d.deco_autorisee ? 'Décoration autorisée' : 'Décoration interdite',
    d.alcool_autorise ? 'Alcool autorisé' : 'Alcool interdit',
    ...(d.heure_fin_musique ? [`Musique jusqu’à ${hhmm(d.heure_fin_musique)}`] : []),
  ]
}
