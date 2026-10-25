/**
 * Métadonnées libres d'une notification (FE-A-003). Seules les clés lues par
 * les écrans sont typées ; les autres restent `unknown` (le backend en ajoute
 * selon le type de notification).
 */
export interface NotificationMeta {
  action?: string
  bien_id?: number | string
  bien_localisation?: string
  bien_type?: string
  client_prenom?: string
  conversation_id?: number | string
  date_visite?: string
  localisation?: string
  motif?: string
  prenom?: string
  quartier?: string
  type_bien?: string
  visite_id?: number
  [cle: string]: unknown
}
