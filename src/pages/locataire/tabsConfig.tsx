// Onglets de navigation de l'espace locataire.
import type { ReactNode } from 'react'
import type { Tab } from './shared'
import { IcHome, IcChart, IcChat, IcBell, IcPerson } from './icons'

export const TABS: { key: Tab; label: string; icon: (active: boolean) => ReactNode }[] = [
  { key: 'logement', label: 'Logement', icon: () => <IcHome /> },
  { key: 'activite', label: 'Activité',  icon: () => <IcChart /> },
  { key: 'messages', label: 'Messages', icon: () => <IcChat /> },
  { key: 'alertes',  label: 'Alertes',  icon: () => <IcBell /> },
  { key: 'profil',   label: 'Profil',   icon: () => <IcPerson /> },
]
