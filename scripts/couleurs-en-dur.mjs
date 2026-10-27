// Décompte des couleurs hexadécimales écrites en dur (FE-B-017), sans effet de bord : utilisé par
// check-inline-colors.mjs et par ses tests.

export const HEX = /#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b(?![0-9A-Za-z-])/g

/**
 * Fichiers dont les couleurs sont des illustrations, hors jetons du thème : comptées à part.
 * Chaque entrée dit pourquoi.
 */
export const FICHIERS_ILLUSTRATION = {
  'components/FaceRating.tsx': 'visages de notation dessinés (teintes, reflets, contours)',
  'components/ui/auth/CountryFlag.tsx': 'couleurs officielles des drapeaux',
}

/** Marqueur d'exemption d'une ligne (même ligne ou ligne précédente), suivi de sa raison. */
export const MARQUEUR = /couleur-libre\s*:/

/** Retire les commentaires (/* … *\/, {/* … *\/} et // …) en gardant les retours à la ligne. */
export function sansCommentaires(texte) {
  return texte
    .replace(/\/\*[\s\S]*?\*\//g, bloc => bloc.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1')
}

/**
 * Compte les couleurs d'un fichier : `libres` = exemptées (fichier d'illustration ou ligne
 * marquée « couleur-libre : … »), `enDur` = toutes les autres. Les commentaires ne comptent pas.
 */
export function compterCouleurs(texte, cheminRelatif) {
  const chemin = cheminRelatif.replace(/\\/g, '/')
  const lignesBrutes = texte.split('\n')
  const lignes = sansCommentaires(texte).split('\n')
  const illustration = Object.keys(FICHIERS_ILLUSTRATION).some(f => chemin.endsWith(f))
  let enDur = 0
  let libres = 0
  lignes.forEach((ligne, i) => {
    const n = ligne.match(HEX)?.length ?? 0
    if (!n) return
    // La ligne précédente n'exempte que si elle n'est qu'un commentaire (pas une ligne de code marquée).
    const precedente = i > 0 ? lignesBrutes[i - 1].trim() : ''
    const commentaireSeul = /^(\/\/|\/\*|\{\/\*)/.test(precedente)
    const marquee = MARQUEUR.test(lignesBrutes[i]) || (commentaireSeul && MARQUEUR.test(precedente))
    if (illustration || marquee) libres += n
    else enDur += n
  })
  return { enDur, libres }
}
