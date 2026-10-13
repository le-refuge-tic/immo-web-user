/**
 * FE-B-002 — Brouillon d'un formulaire long, conservé dans le navigateur.
 *
 * Une session expirée renvoie à la connexion par un rechargement complet de
 * page : sans brouillon, toute la saisie était perdue. Seules les valeurs
 * sérialisables sont gardées (pas les fichiers : photos et vidéo sont à
 * ajouter de nouveau).
 */
export const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const VERSION = 1

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

interface DraftPayload {
  v: number
  savedAt: number
  fields: Record<string, unknown>
}

function memeType(valeur: unknown, defaut: unknown): boolean {
  if (defaut === null) return true
  if (Array.isArray(defaut)) return Array.isArray(valeur)
  return typeof valeur === typeof defaut
}

export class FormDraft {
  readonly restored: boolean
  private readonly saved: Record<string, unknown>
  private readonly defaults = new Map<string, string>()
  private readonly values = new Map<string, unknown>()
  private cleared = false
  private readonly key: string
  private readonly storage: StorageLike
  private readonly now: () => number

  constructor(key: string, storage: StorageLike, now: () => number = Date.now) {
    this.key = key
    this.storage = storage
    this.now = now
    this.saved = this.read()
    this.restored = Object.keys(this.saved).length > 0
  }

  /** Valeur de départ d'un champ : celle du brouillon si elle est utilisable, sinon `fallback`. */
  initialValue<T>(name: string, fallback: T): T {
    this.defaults.set(name, JSON.stringify(fallback))
    const stored = this.saved[name]
    const value = stored !== undefined && memeType(stored, fallback) ? (stored as T) : fallback
    this.values.set(name, value)
    return value
  }

  set(name: string, value: unknown): void {
    this.values.set(name, value)
  }

  /** Écrit le brouillon ; le supprime si tous les champs sont revenus à leur valeur par défaut. */
  flush(): void {
    if (this.cleared) return
    const fields: Record<string, unknown> = {}
    for (const [name, value] of this.values) {
      if (JSON.stringify(value) !== this.defaults.get(name)) fields[name] = value
    }
    try {
      if (Object.keys(fields).length === 0) {
        this.storage.removeItem(this.key)
        return
      }
      const payload: DraftPayload = { v: VERSION, savedAt: this.now(), fields }
      this.storage.setItem(this.key, JSON.stringify(payload))
    } catch {
      // Stockage plein ou interdit : le brouillon est un confort, pas une garantie.
    }
  }

  clear(): void {
    this.cleared = true
    try { this.storage.removeItem(this.key) } catch { /* stockage indisponible */ }
  }

  private read(): Record<string, unknown> {
    try {
      const raw = this.storage.getItem(this.key)
      if (!raw) return {}
      const payload = JSON.parse(raw) as Partial<DraftPayload>
      const valide = payload?.v === VERSION
        && typeof payload.savedAt === 'number'
        && this.now() - payload.savedAt <= DRAFT_MAX_AGE_MS
        && payload.fields && typeof payload.fields === 'object'
      if (valide) return payload.fields as Record<string, unknown>
      this.storage.removeItem(this.key)
    } catch {
      try { this.storage.removeItem(this.key) } catch { /* stockage indisponible */ }
    }
    return {}
  }
}

/** Préfixe commun des clés de brouillon : permet de tout effacer à la déconnexion volontaire. */
export const DRAFT_KEY_PREFIX = 'rg_draft_'

/** Supprime tous les brouillons du navigateur (appareil partagé : rien ne doit survivre à la déconnexion). */
export function clearFormDrafts(storage: Pick<Storage, 'length' | 'key' | 'removeItem'> = localStorage): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key?.startsWith(DRAFT_KEY_PREFIX)) keys.push(key)
    }
    keys.forEach(key => storage.removeItem(key))
  } catch {
    // Stockage indisponible : il n'y a alors rien à effacer.
  }
}
