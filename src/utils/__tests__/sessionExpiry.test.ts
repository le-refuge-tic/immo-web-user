import { describe, it, expect, beforeEach } from 'vitest'
import { markSessionExpired, isSessionExpired, clearSessionExpired, estDestinationInterne, POST_LOGIN_REDIRECT_KEY } from '../sessionExpiry'

class MemoryStorage {
  private data = new Map<string, string>()
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null }
  setItem(k: string, v: string) { this.data.set(k, v) }
  removeItem(k: string) { this.data.delete(k) }
}

describe('expiration de session (FE-B-002)', () => {
  let store: MemoryStorage
  beforeEach(() => { store = new MemoryStorage() })

  it('mémorise la page en cours pour y revenir après reconnexion', () => {
    markSessionExpired('/nouveau-bien?etape=3', store)
    expect(store.getItem(POST_LOGIN_REDIRECT_KEY)).toBe('/nouveau-bien?etape=3')
  })

  it('le message « session expirée » ne s’affiche qu’une fois', () => {
    expect(isSessionExpired(store)).toBe(false)
    markSessionExpired('/mes-visites', store)
    expect(isSessionExpired(store)).toBe(true)
    clearSessionExpired(store)
    expect(isSessionExpired(store)).toBe(false)
  })

  it('ne mémorise pas les pages de connexion comme destination', () => {
    markSessionExpired('/login', store)
    expect(store.getItem(POST_LOGIN_REDIRECT_KEY)).toBeNull()
    markSessionExpired('/register?x=1', store)
    expect(store.getItem(POST_LOGIN_REDIRECT_KEY)).toBeNull()
  })

  it('remplace une destination plus ancienne par la page où la session a expiré', () => {
    store.setItem(POST_LOGIN_REDIRECT_KEY, '/reservation/12')
    markSessionExpired('/mes-visites', store)
    expect(store.getItem(POST_LOGIN_REDIRECT_KEY)).toBe('/mes-visites')
  })

  it('n’affiche pas « session expirée » quand on est déjà sur la connexion', () => {
    markSessionExpired('/login', store)
    expect(isSessionExpired(store)).toBe(false)
  })

  it('refuse les destinations qui sortent du site', () => {
    expect(estDestinationInterne('/mes-visites')).toBe(true)
    expect(estDestinationInterne('//evil.example')).toBe(false)
    expect(estDestinationInterne('/\\evil.example')).toBe(false)
    expect(estDestinationInterne('https://evil.example')).toBe(false)
  })

  it('ignore une destination externe', () => {
    markSessionExpired('//evil.example/x', store)
    expect(store.getItem(POST_LOGIN_REDIRECT_KEY)).toBeNull()
  })
})
