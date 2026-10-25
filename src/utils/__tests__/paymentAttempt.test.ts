import { describe, it, expect } from 'vitest'
import { readPaymentConflict, keepIdempotencyKey, newIdempotencyKey, idempotencyHeader } from '../paymentAttempt'

const http = (status: number, data: unknown) => ({ response: { status, data } })

describe('readPaymentConflict (FE-B-006)', () => {
  it('lit un paiement encore en attente : référence et URL de paiement', () => {
    expect(readPaymentConflict(http(409, {
      code: 'PAIEMENT_EN_ATTENTE', referenceId: 'ref-1', url_paiement: 'https://pay/1', montant: 2000,
      message: 'Un paiement est déjà en cours.',
    }))).toEqual({ code: 'PAIEMENT_EN_ATTENTE', referenceId: 'ref-1', urlPaiement: 'https://pay/1', montant: 2000 })
  })

  it('lit un paiement déjà confirmé par l’opérateur', () => {
    expect(readPaymentConflict(http(409, { code: 'PAIEMENT_DEJA_CONFIRME', referenceId: 'ref-2' })))
      .toEqual({ code: 'PAIEMENT_DEJA_CONFIRME', referenceId: 'ref-2', urlPaiement: undefined, montant: undefined })
  })

  it('lit une visite gratuite', () => {
    expect(readPaymentConflict(http(409, { code: 'VISITE_GRATUITE' }))?.code).toBe('VISITE_GRATUITE')
  })

  it('ignore les autres 409 et les autres statuts', () => {
    expect(readPaymentConflict(http(409, { message: 'Les frais de cette visite ont déjà été payés' }))).toBeNull()
    expect(readPaymentConflict(http(400, { code: 'PAIEMENT_EN_ATTENTE' }))).toBeNull()
    expect(readPaymentConflict({ request: {} })).toBeNull()
    expect(readPaymentConflict(null)).toBeNull()
  })

  it('refuse une URL de paiement non textuelle', () => {
    expect(readPaymentConflict(http(409, { code: 'PAIEMENT_EN_ATTENTE', referenceId: 'r', url_paiement: 42 }))?.urlPaiement)
      .toBeUndefined()
  })
})

describe('keepIdempotencyKey', () => {
  it('garde la clé quand on ne sait pas si le serveur a traité la demande', () => {
    expect(keepIdempotencyKey({ request: {} })).toBe(true) // réseau coupé / délai dépassé
    expect(keepIdempotencyKey(http(502, {}))).toBe(true)
    expect(keepIdempotencyKey(http(504, {}))).toBe(true)
  })

  it('jette la clé quand le serveur a répondu clairement', () => {
    expect(keepIdempotencyKey(http(400, {}))).toBe(false)
    expect(keepIdempotencyKey(http(409, {}))).toBe(false)
  })
})

describe('newIdempotencyKey / idempotencyHeader', () => {
  it('produit des clés distinctes, compatibles avec la colonne (≤ 128)', () => {
    const a = newIdempotencyKey()
    const b = newIdempotencyKey()
    expect(a).not.toBe(b)
    expect(a.length).toBeGreaterThan(8)
    expect(a.length).toBeLessThanOrEqual(128)
  })

  it('forme l’en-tête attendu par le backend', () => {
    expect(idempotencyHeader('k-1')).toEqual({ 'Idempotency-Key': 'k-1' })
  })
})
