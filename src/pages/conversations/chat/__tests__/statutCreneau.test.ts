import { describe, expect, it } from 'vitest'
import { statutCreneau } from '../helpers'

describe('statutCreneau', () => {
  const maintenant = new Date('2026-10-23T12:00:00Z')

  it('créneau en attente passé : expiré', () => {
    expect(statutCreneau({ status: 'pending', proposed_at: '2026-10-17T14:00:00Z' }, maintenant)).toBe('expired')
  })

  it('créneau sans statut passé : expiré', () => {
    expect(statutCreneau({ proposed_at: '2026-10-17T14:00:00Z' }, maintenant)).toBe('expired')
  })

  it('créneau en attente futur : en attente', () => {
    expect(statutCreneau({ status: 'pending', proposed_at: '2026-10-24T09:00:00Z' }, maintenant)).toBe('pending')
  })

  it('créneau déjà traité : statut conservé même passé', () => {
    expect(statutCreneau({ status: 'accepted', proposed_at: '2026-10-17T14:00:00Z' }, maintenant)).toBe('accepted')
  })

  it('statut serveur expiré conservé', () => {
    expect(statutCreneau({ status: 'expired', proposed_at: '2026-10-17T14:00:00Z' }, maintenant)).toBe('expired')
  })

  it('métadonnées absentes : en attente', () => {
    expect(statutCreneau(null, maintenant)).toBe('pending')
  })
})
