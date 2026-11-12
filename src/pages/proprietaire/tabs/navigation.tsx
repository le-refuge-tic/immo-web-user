import type { ReactNode } from 'react'
import { IcPayments, IcMessagesNav } from './icons'
import { IcDash, IcHome, IcCal, IcWallet, IcPerson, IcBell } from './shared'
import type { Tab } from './outils'

/** Onglets du tableau de bord propriétaire (barre du bas et menu latéral). */

export const TABS: { key: Tab; label: string; icon: ReactNode }[] = [
  { key: 'tableau',       label: 'Tableau',       icon: <IcDash /> },
  { key: 'biens',         label: 'Mes biens',     icon: <IcHome /> },
  { key: 'reservations',  label: 'Réservations',  icon: <IcCal /> },
  { key: 'loyers',        label: 'Loyers',        icon: <IcPayments /> },
  { key: 'portefeuille',  label: 'Portefeuille',  icon: <IcWallet /> },
  { key: 'profil',        label: 'Profil',        icon: <IcPerson /> },
]

export const NAV_ITEMS: { key: Tab; label: string; icon: ReactNode }[] = [
  { key: 'tableau',      label: 'Tableau',      icon: <IcDash /> },
  { key: 'biens',        label: 'Mes biens',    icon: <IcHome /> },
  { key: 'reservations', label: 'Réservations', icon: <IcCal /> },
  { key: 'loyers',       label: 'Loyers',       icon: <IcPayments /> },
  { key: 'messages',     label: 'Messages',      icon: <IcMessagesNav /> },
  { key: 'notifications', label: 'Notifications', icon: <IcBell /> },
  { key: 'portefeuille', label: 'Portefeuille',  icon: <IcWallet /> },
  { key: 'profil',       label: 'Profil',        icon: <IcPerson /> },
]
