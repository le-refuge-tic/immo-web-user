import { libelleReductionCash } from '../../../utils/prixCash'

/**
 * Lot 11 — terrain en vente : le prix cash s'affiche à côté du prix normal, avec son libellé.
 * Ce n'est pas une promotion limitée dans le temps : pas de prix barré ni de badge « PROMO ».
 */
export function PrixCash({ prixNormal, prixCash }: { prixNormal: number; prixCash: number }) {
  return (
    <div className="mt-3 rounded-xl px-3 py-2.5" style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)' }}>
      <p className="text-xs font-semibold text-text-grey">Prix cash (paiement comptant)</p>
      <p className="text-xl font-bold" style={{ color: 'var(--tx-green)' }}>{prixCash.toLocaleString('fr-FR')} FCFA</p>
      <p className="text-xs text-text-grey mt-0.5">{libelleReductionCash(prixNormal, prixCash)}</p>
    </div>
  )
}
