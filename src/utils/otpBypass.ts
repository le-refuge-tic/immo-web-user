/**
 * ⚠️ TEMPORAIRE — tant que le backend a OTP_BYPASS=true (voir immo-backend,
 * n'importe quel code à 6 chiffres est alors accepté), on saute l'écran de
 * saisie du code pour accélérer les tests : le code factice ci-dessous est
 * soumis automatiquement dès réception du session_token, sans jamais montrer
 * l'étape OTP à l'utilisateur.
 *
 * Si la vérification automatique échoue (le bypass backend a été désactivé),
 * le flux retombe silencieusement sur le vrai parcours OTP — donc remettre
 * OTP_BYPASS à false côté backend suffit à tout réactiver, sans repasser ici.
 *
 * Repasser SKIP_OTP_UI à false dès la fin des tests pour ne plus tenter le
 * code factice en premier (optionnel, le fallback automatique gère déjà le
 * cas où le bypass backend est coupé).
 */
export const SKIP_OTP_UI = true
export const DUMMY_OTP_CODE = '000000'
