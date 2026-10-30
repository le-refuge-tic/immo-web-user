/**
 * FE-B-006 — Relance d'un paiement sans double débit.
 *
 * - Chaque tentative porte une clé d'idempotence (en-tête `Idempotency-Key`) :
 *   rejouée après une coupure réseau, la même demande renvoie la transaction
 *   déjà créée au lieu d'en ouvrir une seconde.
 * - Le backend refuse (409) une nouvelle demande tant que la précédente est
 *   encore ouverte chez l'opérateur, et renvoie sa référence pour reprendre
 *   le suivi.
 */

export type PaymentConflictCode = 'PAIEMENT_EN_ATTENTE' | 'PAIEMENT_DEJA_CONFIRME' | 'VISITE_GRATUITE'

export interface PaymentConflict {
  code: PaymentConflictCode
  referenceId?: string
  urlPaiement?: string
  montant?: number
}

const CODES: ReadonlySet<string> = new Set(['PAIEMENT_EN_ATTENTE', 'PAIEMENT_DEJA_CONFIRME', 'VISITE_GRATUITE'])

type ErreurHttp = { response?: { status?: number; data?: Record<string, unknown> } }

/** Conflit de paiement connu renvoyé par le backend, `null` pour toute autre erreur. */
export function readPaymentConflict(err: unknown): PaymentConflict | null {
  if (!err || typeof err !== 'object') return null
  const { response } = err as ErreurHttp
  if (response?.status !== 409 || !response.data) return null
  const { code, referenceId, url_paiement, montant } = response.data
  if (typeof code !== 'string' || !CODES.has(code)) return null
  return {
    code: code as PaymentConflictCode,
    referenceId: typeof referenceId === 'string' ? referenceId : undefined,
    urlPaiement: typeof url_paiement === 'string' ? url_paiement : undefined,
    montant: typeof montant === 'number' ? montant : undefined,
  }
}

/**
 * Faut-il réutiliser la même clé pour la prochaine tentative ? Oui quand on
 * ignore si le serveur a traité la demande (pas de réponse, passerelle en
 * erreur) : la rejouer avec la même clé ne peut pas débiter deux fois.
 */
export function keepIdempotencyKey(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const { response } = err as ErreurHttp
  if (!response) return true
  return (response.status ?? 0) >= 500
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export function idempotencyHeader(key: string): Record<string, string> {
  return { 'Idempotency-Key': key }
}

export interface Tentative {
  /**
   * Clé d'idempotence de la tentative en cours (créée au premier appel). `signature` décrit la
   * demande (montant, portefeuille, loyer…) : si elle change, c'est une autre demande, donc une
   * nouvelle clé (rejouer l'ancienne serait refusé par le serveur).
   */
  key: (signature?: string) => string
  /** Tentative terminée (confirmée, refusée ou abandonnée) : la prochaine aura une nouvelle clé. */
  reset: () => void
  /** À appeler quand l'envoi échoue : garde la clé seulement si le serveur a pu traiter la demande. */
  fail: (err: unknown) => void
}

/** Tentative d'une opération d'argent (paiement, recharge, retrait), sans état React. */
export function creerTentative(nouvelleCle: () => string = newIdempotencyKey): Tentative {
  let cle: string | null = null
  let signatureCle: string | undefined
  return {
    key: signature => {
      if (!cle || signature !== signatureCle) {
        cle = nouvelleCle()
        signatureCle = signature
      }
      return cle
    },
    reset: () => { cle = null },
    fail: err => { if (!keepIdempotencyKey(err)) cle = null },
  }
}

/** Le serveur refuse une clé déjà servie pour une autre demande ou après un échec (409). */
export function cleDejaServie(err: unknown): boolean {
  const { response } = (err ?? {}) as ErreurHttp
  return response?.status === 409 && response.data?.code === 'IDEMPOTENCY_KEY_REUSED'
}

/**
 * Envoie une opération d'argent avec la clé de la tentative. Si le serveur répond que la clé a
 * déjà servi (paiement précédent expiré ou refusé entre-temps), c'est une nouvelle demande :
 * nouvelle clé et un seul nouvel essai, sans faire recliquer la personne.
 */
export async function avecCle<T>(tentative: Tentative, signature: string, appel: (cle: string) => Promise<T>): Promise<T> {
  try {
    return await appel(tentative.key(signature))
  } catch (err) {
    if (!cleDejaServie(err)) throw err
    tentative.reset()
    return appel(tentative.key(signature))
  }
}
