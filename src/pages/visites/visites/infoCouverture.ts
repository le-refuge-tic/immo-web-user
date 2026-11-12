import type { Visite } from '../../../types/api'

type Info = { texte: string; couleur: string; fond: string }

const fmtJour = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

/** Ce que la politique des frais de visite dit de cette visite, s'il y a quelque chose à dire. */
export function infoCouverture(v: Visite, maintenant = Date.now()): Info | null {
  if (v.statut !== 'annulee' && v.couverture === 'bonus') {
    return { texte: 'Visite offerte : comprise dans vos frais de visite du jour.', couleur: 'var(--tx-green)', fond: 'rgba(34,197,94,0.10)' }
  }
  if (v.statut !== 'annulee' && v.couverture === 'report') {
    return { texte: 'Visite reportée : déjà réglée par votre visite annulée.', couleur: 'var(--tx-blue)', fond: 'rgba(75,107,255,0.10)' }
  }
  if (v.statut === 'annulee' && v.report_jusquau && new Date(v.report_jusquau).getTime() > maintenant) {
    return {
      texte: `Report gratuit : réservez à nouveau ce bien sans payer jusqu'au ${fmtJour(v.report_jusquau)}.`,
      couleur: 'var(--tx-blue)', fond: 'rgba(75,107,255,0.10)',
    }
  }
  return null
}
