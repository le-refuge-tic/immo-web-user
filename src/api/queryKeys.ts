import type { BiensListParams } from './biensApi'

/**
 * Clés de cache des requêtes (FE-A-004). Une même clé = une seule requête partagée par tous
 * les écrans qui l'utilisent. Invalider `queryKeys.biens.all` recharge toutes les listes et fiches.
 */
export const queryKeys = {
  biens: {
    all: ['biens'] as const,
    /** Liste simple (une page) : accueil, biens similaires de la fiche. */
    list: (params: BiensListParams) => ['biens', 'list', params] as const,
    /** Liste paginée (« Afficher plus ») : recherche. Données de forme différente de `list`. */
    pages: (params: BiensListParams) => ['biens', 'pages', params] as const,
    detail: (id: number) => ['biens', 'detail', id] as const,
  },
  favoris: ['favoris'] as const,
}
