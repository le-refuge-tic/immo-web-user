import { etatVerification, type StatutVerificationDocuments as Statut } from '../utils/verificationDocuments'
import { withAlpha } from '../utils/color'

const COULEURS = { attente: 'var(--tx-amber)', ok: 'var(--tx-green)', refus: 'var(--tx-red)' } as const

/** Bandeau du statut de vérification des pièces d'identité (CIP/IFU). Rien tant qu'aucun document n'est envoyé. */
export default function StatutVerificationDocuments({ statut, motif }: { statut?: Statut | null; motif?: string | null }) {
  const etat = etatVerification(statut, motif)
  if (!etat) return null
  const couleur = COULEURS[etat.ton]
  return (
    <div role="status" className="rounded-xl px-4 py-3" style={{ background: withAlpha(couleur, '18'), border: `1px solid ${withAlpha(couleur, '40')}` }}>
      <p className="text-sm font-bold" style={{ color: couleur }}>{etat.titre}</p>
      {etat.detail && <p className="text-xs mt-0.5" style={{ color: couleur }}>{etat.detail}</p>}
    </div>
  )
}
