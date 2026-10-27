/**
 * Palette d'illustration (FE-B-017) : dégradés des avatars sans photo. Couleurs décoratives,
 * hors jetons du thème : elles ne portent pas de texte à lire en dehors des initiales blanches
 * et restent identiques en clair et en sombre. Un seul endroit pour les changer.
 */
export const AVATAR_PALETTE = [
  'linear-gradient(135deg,var(--c-brand),var(--c-violet))',
  'linear-gradient(135deg,var(--c-accent),#FF3B7A)',
  'linear-gradient(135deg,#00C6A2,#0099CC)',
  'linear-gradient(135deg,#F7B731,#F55252)',
  'linear-gradient(135deg,#A855F7,var(--c-indigo))',
  'linear-gradient(135deg,#10B981,#3B82F6)',
] as const

/** Dégradé stable d'un avatar, choisi d'après l'identifiant de la personne. */
export function avatarGradient(id: number): string {
  return AVATAR_PALETTE[Math.abs(id || 0) % AVATAR_PALETTE.length]
}
