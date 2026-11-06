import { describe, it, expect } from 'vitest'
import { apiMessage, apiMessageDetail } from '../apiMessage'

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

  it('affiche les messages français d’un tableau de validation, sans les messages techniques', () => {
    expect(apiMessage(httpError(400, { message: ['Précisez le standing quand « Autre » est choisi', 'prix must be a number'] })))
      .toBe('Précisez le standing quand « Autre » est choisi')
  })

  it('apiMessageDetail renvoie le vrai message d’un 400, tableau compris', () => {
    expect(apiMessageDetail(httpError(400, { message: ['amenites.property chambres should not exist'] })))
      .toBe('amenites.property chambres should not exist')
    expect(apiMessageDetail(httpError(400, { message: ['a', 'b'] }))).toBe('a ; b')
  })

  it('apiMessageDetail ne dit rien pour une panne ou une réponse vide', () => {
    expect(apiMessageDetail(httpError(503, { message: 'x' }))).toBeUndefined()
    expect(apiMessageDetail(httpError(400, {}))).toBeUndefined()
    expect(apiMessageDetail(new Error('boom'))).toBeUndefined()
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
