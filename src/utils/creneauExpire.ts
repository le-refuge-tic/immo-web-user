import { dateEffectiveVisite, type VisiteDatable } from './dateVisite'

/**
 * Lot 10 — « Créneau expiré » : une visite non confirmée (en attente ou contre-proposée) dont la
 * date retenue est passée. C'est un état dérivé : le statut du backend ne change pas ; le serveur
 * prévient les deux parties (alerte `visite_creneau_expire`).
 */

export const MOT_CRENEAU_EXPIRE = 'Créneau expiré'

type VisiteExpirable = { statut: string } & VisiteDatable

export const STATUTS_NON_CONFIRMES: readonly string[] = ['en_attente', 'contre_proposee']

export function estCreneauExpire(v: VisiteExpirable, maintenant: number = Date.now()): boolean {
  if (!STATUTS_NON_CONFIRMES.includes(v.statut)) return false
  const brut = dateEffectiveVisite(v)
  return !!brut && new Date(brut).getTime() < maintenant
}

/** Phrase affichée sur la carte, selon qui lit et quelle partie n'a pas répondu. */
export function phraseCreneauExpire(
  v: Pick<VisiteExpirable, 'statut'>,
  lecteur: 'client' | 'proprietaire',
): string {
  if (v.statut === 'contre_proposee') {
    return lecteur === 'client'
      ? 'Le créneau proposé est passé sans réponse de votre part.'
      : 'Le client n’a pas répondu avant le créneau proposé.'
  }
  return lecteur === 'client'
    ? 'Le propriétaire n’a pas répondu avant le créneau.'
    : 'Vous n’avez pas répondu avant le créneau demandé.'
}
