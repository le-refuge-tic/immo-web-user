// Constantes et types partagés de l'espace locataire.
export const GREEN  = '#15803D'
export const TEAL   = '#0369A1'
export const ORANGE = '#B45309'
/** Accents en couleur de texte : même valeur en clair, éclaircis en sombre (FE-B-024). Les fonds gardent GREEN / TEAL / ORANGE. */
export const GREEN_TX  = 'var(--tx-loc-green)'
export const TEAL_TX   = 'var(--tx-loc-teal)'
export const ORANGE_TX = 'var(--tx-amber)'

export type Tab = 'logement' | 'activite' | 'messages' | 'alertes' | 'profil'

/** Seul moyen de paiement externe : FedaPay (carte ou Mobile Money sur sa page sécurisée). */
export const MODE_FEDAPAY: { id: 'fedapay'; label: string; accent: string } = { id: 'fedapay', label: 'FedaPay', accent: '#00B4D8' }
