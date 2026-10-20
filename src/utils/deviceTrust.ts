/**
 * Appareil de confiance : après un OTP réussi, le backend renvoie un
 * `device_token` (opaque, signé côté serveur, valable 30 jours pour les
 * utilisateurs). On le renvoie à chaque connexion : tant qu'il est valide, le
 * serveur ne redemande pas d'OTP. Il survit volontairement à la déconnexion
 * (c'est l'appareil qui est reconnu, pas la session) ; c'est le serveur qui
 * l'expire ou le révoque (changement de mot de passe, de numéro, annulation).
 */
const DEVICE_KEY = 'rg_device_token'

export const deviceTrust = {
  get: (): string | undefined => {
    try { return localStorage.getItem(DEVICE_KEY) || undefined } catch { return undefined }
  },
  /** Mémorise le jeton renvoyé par /auth/otp/verify, s'il y en a un. */
  remember: (data: { device_token?: unknown; [cle: string]: unknown } | null | undefined) => {
    const t = data?.device_token
    if (typeof t !== 'string' || !t) return
    try { localStorage.setItem(DEVICE_KEY, t) } catch { /* stockage indisponible : OTP redemandé */ }
  },
  forget: () => {
    try { localStorage.removeItem(DEVICE_KEY) } catch { /* ignore */ }
  },
}
