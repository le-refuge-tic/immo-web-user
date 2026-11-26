/**
 * Compte en suppression (délai de 7 jours, annulable en se reconnectant).
 * Lecture des erreurs que le serveur renvoie pour un tel compte :
 *  - 409 SUPPRESSION_EN_COURS : inscription avec le numéro d'un compte en suppression ;
 *  - 403 SUPPRESSION_PROGRAMMEE : code de connexion validé, le compte peut être réactivé ;
 *  - 401 SUPPRESSION_PROGRAMMEE ou COMPTE_SUPPRIME : session d'un compte qui n'est plus actif.
 */

type CorpsErreur = {
  code?: unknown
  message?: unknown
  suppression_effective_le?: unknown
}

type ErreurHttp = { response?: { status?: number; data?: CorpsErreur } }

export const CODES_COMPTE_INACTIF = ['SUPPRESSION_PROGRAMMEE', 'COMPTE_SUPPRIME'] as const

export interface InfosSuppression {
  /** Message du serveur, affiché tel quel. */
  message: string | null
  /** Date de suppression au format JJ/MM/AAAA, `null` si absente ou illisible. */
  date: string | null
}

function lire(err: unknown): { status: number; data: CorpsErreur } {
  const { response } = (err ?? {}) as ErreurHttp
  return { status: response?.status ?? 0, data: response?.data ?? {} }
}

function texte(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null
}

/** Date ISO → JJ/MM/AAAA (heure locale), `null` si la valeur n'est pas une date. */
export function formaterDateSuppression(iso: unknown): string | null {
  if (typeof iso !== 'string' || !iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function infos(data: CorpsErreur): InfosSuppression {
  return { message: texte(data.message), date: formaterDateSuppression(data.suppression_effective_le) }
}

/** 409 SUPPRESSION_EN_COURS à l'inscription, sinon `null`. */
export function suppressionEnCours(err: unknown): InfosSuppression | null {
  const { status, data } = lire(err)
  return status === 409 && data.code === 'SUPPRESSION_EN_COURS' ? infos(data) : null
}

/** 403 SUPPRESSION_PROGRAMMEE après le code de connexion, sinon `null`. */
export function suppressionProgrammee(err: unknown): InfosSuppression | null {
  const { status, data } = lire(err)
  return status === 403 && data.code === 'SUPPRESSION_PROGRAMMEE' ? infos(data) : null
}

/** 401 d'une route authentifiée pour un compte en suppression ou supprimé. */
export function estCompteInactif(err: unknown): boolean {
  const { status, data } = lire(err)
  return status === 401 && (CODES_COMPTE_INACTIF as readonly unknown[]).includes(data.code)
}
