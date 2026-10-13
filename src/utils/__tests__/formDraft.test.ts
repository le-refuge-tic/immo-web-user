import { describe, it, expect, beforeEach } from 'vitest'
import { FormDraft, DRAFT_MAX_AGE_MS } from '../formDraft'

class MemoryStorage {
  data = new Map<string, string>()
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null }
  setItem(k: string, v: string) { this.data.set(k, v) }
  removeItem(k: string) { this.data.delete(k) }
}

const KEY = 'rg_brouillon_test'

describe('FormDraft (FE-B-002)', () => {
  let store: MemoryStorage
  let now: number
  const draft = () => new FormDraft(KEY, store, () => now)

  beforeEach(() => { store = new MemoryStorage(); now = Date.UTC(2026, 9, 9) })

  it('sans brouillon : valeurs par défaut, rien n’est restauré', () => {
    const d = draft()
    expect(d.initialValue('prix', '')).toBe('')
    expect(d.restored).toBe(false)
  })

  it('n’enregistre rien tant que tout est à sa valeur par défaut', () => {
    const d = draft()
    d.initialValue('prix', '')
    d.initialValue('chambres', 1)
    d.set('prix', '')
    d.set('chambres', 1)
    d.flush()
    expect(store.getItem(KEY)).toBeNull()
  })

  it('enregistre les champs modifiés et les restaure à la visite suivante', () => {
    const d1 = draft()
    d1.initialValue('prix', '')
    d1.initialValue('equipements', [] as string[])
    d1.set('prix', '75 000')
    d1.set('equipements', ['clim'])
    d1.flush()

    const d2 = draft()
    expect(d2.restored).toBe(true)
    expect(d2.initialValue('prix', '')).toBe('75 000')
    expect(d2.initialValue('equipements', [] as string[])).toEqual(['clim'])
    expect(d2.initialValue('inconnu', 'x')).toBe('x')
  })

  it('revenir à la valeur par défaut efface le brouillon', () => {
    const d = draft()
    d.initialValue('prix', '')
    d.set('prix', '1')
    d.flush()
    d.set('prix', '')
    d.flush()
    expect(store.getItem(KEY)).toBeNull()
  })

  it('ignore une valeur dont le type ne correspond plus au champ', () => {
    store.setItem(KEY, JSON.stringify({ v: 1, savedAt: now, fields: { chambres: 'trois' } }))
    expect(draft().initialValue('chambres', 1)).toBe(1)
  })

  it('accepte null quand le champ peut être vide', () => {
    store.setItem(KEY, JSON.stringify({ v: 1, savedAt: now, fields: { sanitaire: 'cour' } }))
    expect(draft().initialValue<string | null>('sanitaire', null)).toBe('cour')
  })

  it('brouillon trop ancien ou illisible : ignoré et supprimé', () => {
    store.setItem(KEY, JSON.stringify({ v: 1, savedAt: now - DRAFT_MAX_AGE_MS - 1, fields: { prix: '9' } }))
    const d = draft()
    expect(d.restored).toBe(false)
    expect(d.initialValue('prix', '')).toBe('')
    expect(store.getItem(KEY)).toBeNull()

    store.setItem(KEY, '{pas du json')
    expect(draft().restored).toBe(false)
  })

  it('clear() supprime le brouillon et bloque les écritures en attente', () => {
    const d = draft()
    d.initialValue('prix', '')
    d.set('prix', '5')
    d.clear()
    d.flush()
    expect(store.getItem(KEY)).toBeNull()
  })

  it('stockage indisponible (navigation privée) : aucune exception', () => {
    const broken = {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('denied') },
      removeItem: () => { throw new Error('denied') },
    }
    const d = new FormDraft(KEY, broken, () => now)
    expect(d.initialValue('prix', '')).toBe('')
    d.set('prix', '5')
    expect(() => d.flush()).not.toThrow()
    expect(() => d.clear()).not.toThrow()
  })
})

describe('clearFormDrafts', () => {
  it('supprime seulement les clés de brouillon', async () => {
    const { clearFormDrafts } = await import('../formDraft')
    const data = new Map<string, string>([
      ['rg_draft_nouveau_bien_42', '{}'],
      ['rg_draft_autre', '{}'],
      ['rg_token', 'secret'],
    ])
    const storage = {
      get length() { return data.size },
      key: (i: number) => [...data.keys()][i] ?? null,
      removeItem: (k: string) => { data.delete(k) },
    }

    clearFormDrafts(storage)

    expect([...data.keys()]).toEqual(['rg_token'])
  })
})
