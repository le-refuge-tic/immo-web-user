/**
 * Service de partage centralisé.
 *
 * Web app responsive : la décision entre share sheet natif et fenêtre custom
 * se base sur la CAPACITÉ du navigateur (feature detection de navigator.share),
 * jamais sur la largeur d'écran ni un OS déclaré.
 */

const TYPE_LABELS: Record<string, string> = {
  maison: 'Maison', appart_vide: 'Appartement', appart_meuble: 'Appartement meublé',
  guesthouse: 'Guesthouse', terrain: 'Terrain',
}

export interface ShareBien {
  id: number
  type?: string
  prix?: number | string
  prix_promo?: number | string | null
  localisation?: { quartier?: string; ville?: string }
}

/** Lien profond vers la fiche du bien (ouvre l'app web sur la bonne route). */
export function bienUrl(bien: ShareBien): string {
  return `${window.location.origin}/biens/${bien.id}`
}

/** Texte court adapté au marché béninois : type — prix FCFA — quartier, ville. */
export function bienShareText(bien: ShareBien): string {
  const typeLabel = (bien.type && TYPE_LABELS[bien.type]) || 'Bien immobilier'
  const brut = bien.prix_promo != null && Number(bien.prix_promo) > 0 ? bien.prix_promo : bien.prix
  const prix = brut != null ? `${Number(brut).toLocaleString('fr-FR')} FCFA` : null
  const lieu = [bien.localisation?.quartier, bien.localisation?.ville].filter(Boolean).join(', ')
  return [typeLabel, prix, lieu].filter(Boolean).join(' — ')
}

/** Le navigateur supporte-t-il le partage natif ? */
export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

/**
 * Tente le partage natif (Web Share API).
 * @returns true si le share sheet natif a été déclenché, false s'il faut le fallback custom.
 */
export async function shareBien(bien: ShareBien): Promise<boolean> {
  const url = bienUrl(bien)
  const text = bienShareText(bien)
  if (!canNativeShare()) return false
  try {
    await navigator.share({ title: 'REFUGE', text, url })
    return true
  } catch (e: any) {
    // AbortError = l'utilisateur a fermé le share sheet → ne pas ouvrir le fallback
    if (e?.name === 'AbortError') return true
    return false
  }
}

/** Liens de partage pour la fenêtre fallback. */
export function shareLinks(bien: ShareBien) {
  const url = bienUrl(bien)
  const text = bienShareText(bien)
  const payload = encodeURIComponent(`${text}\n${url}`)
  return {
    url,
    text,
    whatsapp: `https://wa.me/?text=${payload}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  }
}
