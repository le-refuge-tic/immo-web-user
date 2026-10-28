import { describe, expect, it } from 'vitest'
import { avecCle, creerTentative } from '../paymentAttempt'

const compteur = () => { let n = 0; return () => `cle-${++n}` }

describe('creerTentative (FE-B-006)', () => {
  it('garde la même clé tant que la demande ne change pas', () => {
    const t = creerTentative(compteur())
    expect(t.key('5000')).toBe('cle-1')
    expect(t.key('5000')).toBe('cle-1')
  })

  it('nouvelle clé quand la demande change (autre montant)', () => {
    const t = creerTentative(compteur())
    t.key('5000')
    expect(t.key('8000')).toBe('cle-2')
  })

  it('sans signature : comportement d’avant (une clé par tentative)', () => {
    const t = creerTentative(compteur())
    expect(t.key()).toBe('cle-1')
    expect(t.key()).toBe('cle-1')
    t.reset()
    expect(t.key()).toBe('cle-2')
  })

  it('après une coupure réseau, la clé est gardée ; après un refus (4xx), elle est renouvelée', () => {
    const t = creerTentative(compteur())
    t.key('5000')
    t.fail(new Error('réseau'))
    expect(t.key('5000')).toBe('cle-1')
    t.fail({ response: { status: 400 } })
    expect(t.key('5000')).toBe('cle-2')
  })

  it('clé déjà servie (409 IDEMPOTENCY_KEY_REUSED) : un seul nouvel essai avec une nouvelle clé', async () => {
    const t = creerTentative(compteur())
    const cles: string[] = []
    const r = await avecCle(t, 'loyer', async cle => {
      cles.push(cle)
      if (cles.length === 1) throw { response: { status: 409, data: { code: 'IDEMPOTENCY_KEY_REUSED' } } }
      return 'ok'
    })
    expect(r).toBe('ok')
    expect(cles).toEqual(['cle-1', 'cle-2'])
  })

  it('autre erreur : pas de nouvel essai', async () => {
    const t = creerTentative(compteur())
    let appels = 0
    await expect(avecCle(t, 'x', async () => {
      appels++
      throw { response: { status: 409, data: { code: 'PAIEMENT_EN_ATTENTE' } } }
    })).rejects.toBeTruthy()
    expect(appels).toBe(1)
  })
})
