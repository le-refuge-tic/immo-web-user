/**
 * Unité du prix d'une annonce. L'API renvoie `unite_prix` (nuit / heure / mois / total)
 * pour chaque bien ; à défaut, elle est déduite du type et de la transaction.
 * Une salle de fêtes se loue à l'heure : son prix couvre `details_salle_fete.duree_heures`
 * heures (« 45 000 FCFA / 8 h »). Une unité inconnue ne doit jamais passer pour une vente.
 * Les loyers de bail (`loyer_mensuel`) restent mensuels et n'utilisent pas ce module.
 */
type BienPrix = {
  unite_prix?: string | null
  type?: string
  transaction?: string
  details_salle_fete?: { duree_heures?: number | null } | null
}

function unite(b: BienPrix): string {
  if (b.unite_prix) return b.unite_prix
  if (b.type === 'guesthouse') return 'nuit'
  if (b.type === 'salle_fete') return 'heure'
  return b.transaction === 'location' ? 'mois' : 'total'
}

/** Heures couvertes par le prix d'une salle (1 si inconnu). */
const heuresCouvertes = (b: BienPrix) => Math.max(1, Number(b.details_salle_fete?.duree_heures ?? 1))

/** Suffixe collé au montant : « /nuit », « /mois », « / 8 h », « / heure », ou rien pour une vente. */
export function suffixeUnite(b: BienPrix): string {
  const u = unite(b)
  if (u === 'nuit') return '/nuit'
  if (u === 'mois') return '/mois'
  if (u === 'heure') {
    const h = heuresCouvertes(b)
    return h > 1 ? ` / ${h} h` : ' / heure'
  }
  return ''
}

/** Précision écrite sous le prix : « par nuit », « par mois », « pour 8 h », « par heure », « prix de vente ». */
export function libellePrix(b: BienPrix): string {
  const u = unite(b)
  if (u === 'nuit') return 'par nuit'
  if (u === 'mois') return 'par mois'
  if (u === 'heure') {
    const h = heuresCouvertes(b)
    return h > 1 ? `pour ${h} h` : 'par heure'
  }
  return 'prix de vente'
}
