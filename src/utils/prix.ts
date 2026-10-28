/**
 * Unité du prix d'une annonce. L'API renvoie `unite_prix` (nuit / mois / total)
 * pour chaque bien ; à défaut, elle est déduite du type et de la transaction.
 * Les loyers de bail (`loyer_mensuel`) restent mensuels et n'utilisent pas ce module.
 */
type BienPrix = { unite_prix?: string | null; type?: string; transaction?: string }

function unite(b: BienPrix): string {
  return b.unite_prix ?? (b.type === 'guesthouse' ? 'nuit' : b.transaction === 'location' ? 'mois' : 'total')
}

/** Suffixe collé au montant : « /nuit », « /mois », ou rien pour une vente. */
export function suffixeUnite(b: BienPrix): string {
  const u = unite(b)
  return u === 'nuit' ? '/nuit' : u === 'mois' ? '/mois' : ''
}

/** Précision écrite sous le prix : « par nuit », « par mois », « prix de vente ». */
export function libellePrix(b: BienPrix): string {
  const u = unite(b)
  return u === 'nuit' ? 'par nuit' : u === 'mois' ? 'par mois' : 'prix de vente'
}
