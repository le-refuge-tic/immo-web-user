/**
 * Texte compatible avec les polices standard d'un PDF (Helvetica, encodage WinAnsi).
 *
 * `toLocaleString('fr-FR')` sépare les milliers par une espace fine insécable (U+202F) que
 * WinAnsi ne sait pas encoder : pdf-lib lève alors « WinAnsi cannot encode » et tout reçu dont un
 * montant dépasse 999 F échouait. Les autres espaces typographiques deviennent des espaces
 * simples ; un caractère hors WinAnsi (emoji, lettre non latine…) devient « ? » plutôt que de
 * faire échouer tout le document.
 */

/** Espaces typographiques (U+2000–U+200A, U+202F, U+205F, U+3000) : remplacées par une espace. */
const ESPACES_TYPOGRAPHIQUES = /[ -   　]/g

/** Caractères que WinAnsi (Windows-1252) sait écrire : ASCII, Latin-1 et le bloc 0x80–0x9F. */
const NON_WINANSI = /[^\x20-\x7e\xa0-\xff€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/g

export function texteCompatiblePdf(texte: string): string {
  return texte.replace(ESPACES_TYPOGRAPHIQUES, ' ').replace(NON_WINANSI, '?')
}
