import type { Bien, Localisation } from './api'

/**
 * Types propres à la recherche et à l'accueil (FE-A-003).
 *
 * Champs lus par le front mais absents de `Localisation` / `Bien` dans api.ts.
 */

/** Localisation telle que lue par le filtre de recherche (commune parfois renvoyée). */
export type LocalisationRecherche = Localisation & { commune?: string }

/** Forme minimale lue par `matchLoc` : un bien complet ou partiel. */
export type BienLocalisable = { localisation?: LocalisationRecherche | null }

/** Entrée de `GET /biens/favoris` : un bien, parfois avec la clé `bien_id` du favori. */
export type BienFavori = Bien & { bien_id?: number }
