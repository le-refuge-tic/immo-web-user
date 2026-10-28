/** Montant minimum d'une demande de retrait (FCFA). */
export const RETRAIT_MINIMUM = 500

const fcfa = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`

/**
 * Message à afficher sous le champ « montant à retirer » dès la saisie (FE-B-015),
 * ou chaîne vide si le montant est valide ou le champ vide.
 */
export function messageMontantRetrait(montant: string, solde: number): string {
  if (!montant.trim()) return ''
  const valeur = Number(montant)
  if (!Number.isFinite(valeur) || valeur <= 0) return 'Saisissez un montant en chiffres.'
  if (valeur > solde) return `Ce montant dépasse votre solde disponible (${fcfa(solde)}).`
  if (valeur < RETRAIT_MINIMUM) return `Le minimum de retrait est de ${fcfa(RETRAIT_MINIMUM)}.`
  return ''
}
