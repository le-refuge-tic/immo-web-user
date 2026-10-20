import type { Visite } from '../../../types/api'

export const STATUT_META: Record<string, { label: string; color: string; bg: string }> = {
  en_attente:      { label: 'En attente',      color: 'var(--tx-amber)', bg: 'rgba(245,158,11,0.1)' },
  contre_proposee: { label: 'Contre-proposée', color: 'var(--tx-amber)', bg: 'rgba(230,126,34,0.12)' },
  confirmee:       { label: 'Confirmée',        color: 'var(--tx-green)', bg: 'rgba(34,197,94,0.1)' },
  effectuee:       { label: 'Effectuée',        color: 'var(--tx-blue)', bg: 'rgba(58,90,238,0.1)' },
  annulee:         { label: 'Annulée',          color: 'var(--tx-red)', bg: 'rgba(239,68,68,0.1)' },
  payee:           { label: 'Payée',            color: 'var(--tx-green)', bg: 'rgba(34,197,94,0.1)' },
  echouee:         { label: 'Échouée',          color: 'var(--tx-red)', bg: 'rgba(239,68,68,0.1)' },
}

export const OPERATORS = [
  { key: 'momo',    label: 'MTN MoMo' },
  { key: 'fedapay', label: 'FedaPay'  },
]

export const TABS = ['Toutes', 'À venir', 'Terminées', 'Annulées', 'Échouées']

export const ISSUES_TAGS = [
  "L'interlocuteur n'était pas professionnel",
  'Le bien ne correspond pas aux photos',
  'La description était trompeuse',
  "L'état du bien était décevant",
  'Des informations importantes ont été omises',
  'La visite était trop précipitée',
  "Le bien n'est plus disponible comme annoncé",
  'Le prix annoncé ne reflète pas la réalité',
]

export const NO_VISITES: Visite[] = []

// Numéro d'assistance des visites, au format béninois à 10 chiffres (01 93 46 37 16).
export const SUPPORT_VISITE_PHONE = '+2290193463716'
