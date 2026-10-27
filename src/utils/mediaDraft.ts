/**
 * FE-B-002 — Photos et vidéo du brouillon d'annonce, conservées dans IndexedDB.
 *
 * Le brouillon des champs (formDraft.ts) vit dans localStorage, qui ne stocke que du texte ;
 * IndexedDB garde les fichiers tels quels. Même durée de vie que le brouillon des champs.
 * Tout échec (navigation privée, quota, navigateur ancien) désactive simplement la fonction :
 * le brouillon est un confort, pas une garantie.
 */
import { DRAFT_MAX_AGE_MS } from './formDraft'

export const MEDIA_DB_NAME = 'rg_brouillons_medias'
const STORE = 'medias'
const DB_VERSION = 1

// Incrémenté à chaque effacement global (déconnexion) : une écriture mise en file avant
// l'effacement ne doit pas recréer la base et y remettre les fichiers.
let generation = 0
/** Génération courante, à capturer au moment où une écriture est mise en file. */
export function mediaDraftGeneration(): number {
  return generation
}

export interface MediaDraft {
  photos: File[]
  video: File | null
}

interface MediaRecord extends MediaDraft {
  savedAt: number
}

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(MEDIA_DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE) }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error('IndexedDB bloquée'))
  })
}

/** Exécute une requête dans une transaction, puis ferme la base. */
async function executer<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await ouvrir()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const req = action(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(req.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

function estMediaRecord(valeur: unknown): valeur is MediaRecord {
  const r = valeur as Partial<MediaRecord> | undefined
  return !!r && typeof r.savedAt === 'number' && Array.isArray(r.photos)
    && r.photos.every(p => p instanceof Blob) && (r.video === null || r.video instanceof Blob)
}

/** Médias du brouillon `key`, ou `null` s'il n'y en a pas (ou plus : expiré, illisible). */
export async function loadMediaDraft(key: string, now: () => number = Date.now): Promise<MediaDraft | null> {
  try {
    const record = await executer<unknown>('readonly', store => store.get(key))
    if (record === undefined) return null
    if (!estMediaRecord(record) || now() - record.savedAt > DRAFT_MAX_AGE_MS) {
      await clearMediaDraft(key)
      return null
    }
    if (record.photos.length === 0 && !record.video) return null
    return { photos: record.photos, video: record.video }
  } catch {
    return null
  }
}

/**
 * Enregistre les médias du brouillon ; sans photo ni vidéo, le supprime.
 * `gen` : génération capturée à la mise en file ; si un effacement global est passé depuis, rien n'est écrit.
 */
export async function saveMediaDraft(key: string, media: MediaDraft, gen: number = generation, now: () => number = Date.now): Promise<void> {
  if (gen !== generation) return
  if (media.photos.length === 0 && !media.video) return clearMediaDraft(key)
  const record: MediaRecord = { photos: [...media.photos], video: media.video, savedAt: now() }
  try {
    await executer('readwrite', store => store.put(record, key))
  } catch {
    // Quota dépassé ou stockage interdit : on retire l'ancien brouillon plutôt que de le
    // laisser revenir, périmé, au prochain rechargement.
    await clearMediaDraft(key)
  }
}

export async function clearMediaDraft(key: string): Promise<void> {
  try {
    await executer('readwrite', store => store.delete(key))
  } catch {
    // Stockage indisponible : il n'y a alors rien à effacer.
  }
}

/** Supprime les médias de tous les brouillons (déconnexion volontaire, appareil partagé). */
export function clearMediaDrafts(): Promise<void> {
  generation++
  return new Promise(resolve => {
    try {
      const req = indexedDB.deleteDatabase(MEDIA_DB_NAME)
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
      req.onblocked = () => resolve()
    } catch {
      resolve()
    }
  })
}
