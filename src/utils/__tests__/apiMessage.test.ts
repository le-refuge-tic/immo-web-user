import { describe, it, expect } from 'vitest'
import { apiMessage } from '../apiMessage'

const httpError = (status: number, data?: unknown, headers: Record<string, string> = {}) => ({ response: { status, data, headers } })

describe('apiMessage', () => {
  it('garde un message serveur en français', () => {
    expect(apiMessage(httpError(400, { message: 'Un code a déjà été envoyé récemment. Réessayez dans une minute.' })))
      .toBe('Un code a déjà été envoyé récemment. Réessayez dans une minute.')
  })

  it('ignore les messages techniques de validation (liste ou anglais)', () => {
    expect(apiMessage(httpError(400, { message: ['telephone must be a string'] }))).toBeUndefined()
    expect(apiMessage(httpError(400, { message: 'property website should not exist' }))).toBeUndefined()
    expect(apiMessage(httpError(403, { message: 'Forbidden resource' }))).toBeUndefined()
  })

  it('annonce le délai quand il y a trop de tentatives', () => {
    expect(apiMessage(httpError(429, { message: 'ThrottlerException: Too Many Requests' }, { 'retry-after': '42' })))
      .toBe('Trop de tentatives. Réessayez dans 42 secondes.')
    expect(apiMessage(httpError(429, {}))).toBe('Trop de tentatives. Réessayez dans une minute.')
  })

  it('traduit les pannes serveur et réseau', () => {
    expect(apiMessage(httpError(503, { message: 'Internal server error' })))
      .toBe('Le service est momentanément indisponible. Réessayez dans quelques instants.')
    expect(apiMessage({ request: {}, message: 'Network Error' }))
      .toBe('Connexion impossible. Vérifiez votre connexion Internet et réessayez.')
  })

  it('signale un fichier trop lourd', () => {
    expect(apiMessage(httpError(413))).toBe('Fichier trop volumineux. Choisissez une image plus légère.')
  })

  it('ne renvoie rien pour une erreur inconnue, pour laisser le message de repli', () => {
    expect(apiMessage(undefined)).toBeUndefined()
    expect(apiMessage(new Error('boom'))).toBeUndefined()
  })
})
