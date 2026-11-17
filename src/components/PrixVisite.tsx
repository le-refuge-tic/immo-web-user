import { libelleFraisVisite } from '../utils/fraisVisite'
import { presenterFraisVisite } from '../utils/promoVisite'
import { useTarifFraisVisite } from '../hooks/useTarifFraisVisite'

/**
 * Frais de visite : « ~~1 000 FCFA~~ 500 FCFA · Tarif promotionnel » quand le montant est le tarif
 * promotionnel, le montant seul sinon (lot 10). `compact` n'affiche que le prix barré et le prix.
 */
export function PrixVisite({ montant, compact = false, className }: { montant: number; compact?: boolean; className?: string }) {
  const { barre, offre } = presenterFraisVisite(montant, useTarifFraisVisite())
  if (barre === null) return <span className={className}>{libelleFraisVisite(montant)}</span>
  return (
    <span className={className}>
      <s className="opacity-60 font-normal" aria-label={`Prix normal ${libelleFraisVisite(barre)}`}>{libelleFraisVisite(barre)}</s>{' '}
      <span className="font-bold">{libelleFraisVisite(montant)}</span>
      {!compact && offre && <span className="block text-caption font-semibold opacity-80">{offre}</span>}
    </span>
  )
}

/** Mention seule de l'offre (« Tarif promotionnel », « Offre de lancement jusqu'au JJ/MM »), ou rien. */
export function OffreVisite({ montant, className }: { montant: number; className?: string }) {
  const { offre } = presenterFraisVisite(montant, useTarifFraisVisite())
  return offre ? <p className={className}>{offre}</p> : null
}
