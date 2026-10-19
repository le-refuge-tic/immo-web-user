import { describe, it, expect } from 'vitest'
import { toStoredUser } from '../storedUser'

describe('toStoredUser', () => {
  it('ne conserve aucune donnée sensible', () => {
    const stored = toStoredUser({
      id: 1, prenom: 'A', nom: 'B', role_principal: 'prospect', roles_actifs: ['prospect'], photo_profil: null,
      telephone: '0196123456', email: 'a@b.c', numero_retrait: '01', numero_whatsapp: '01',
      cip_url: 'x', ifu_url: 'y', fcm_token: 'z',
    }) as Record<string, unknown>
    for (const k of ['telephone', 'email', 'numero_retrait', 'numero_whatsapp', 'cip_url', 'ifu_url', 'fcm_token']) {
      expect(k in stored).toBe(false)
    }
    expect(stored.id).toBe(1)
    expect(stored.roles_actifs).toEqual(['prospect'])
  })
})
