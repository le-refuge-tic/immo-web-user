import { describe, it, expect, beforeEach, vi } from 'vitest'
import { deviceTrust } from '../deviceTrust'

// Environnement de test « node » : localStorage minimal en mémoire.
const store = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v) },
  removeItem: (k: string) => { store.delete(k) },
})

describe('deviceTrust', () => {
  beforeEach(() => store.clear())

  it('mémorise le device_token renvoyé par le serveur', () => {
    deviceTrust.remember({ access_token: 'a', device_token: 'dev-123' })
    expect(deviceTrust.get()).toBe('dev-123')
  })

  it('ignore une réponse sans device_token', () => {
    deviceTrust.remember({ device_token: 'dev-1' })
    deviceTrust.remember({ access_token: 'a' })
    expect(deviceTrust.get()).toBe('dev-1')
  })

  it('oublie le jeton', () => {
    deviceTrust.remember({ device_token: 'dev-1' })
    deviceTrust.forget()
    expect(deviceTrust.get()).toBeUndefined()
  })
})
