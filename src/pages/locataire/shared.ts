// Constantes et types partagés de l'espace locataire.
export const GREEN  = '#15803D'
export const TEAL   = '#0369A1'
export const ORANGE = '#B45309'

export type Tab = 'logement' | 'activite' | 'messages' | 'alertes' | 'profil'

export const OPERATEURS: { id: 'momo' | 'flooz' | 'celtiis' | 'fedapay'; label: string; accent: string }[] = [
  { id: 'momo', label: 'MTN MoMo', accent: '#FFCC00' },
  { id: 'flooz', label: 'Moov Flooz', accent: '#0066CC' },
  { id: 'celtiis', label: 'Celtiis', accent: '#D32F2F' },
  { id: 'fedapay', label: 'FedaPay', accent: '#00B4D8' },
]
