import { describe, expect, it } from 'vitest'
import { creerTentative } from '../paymentAttempt'

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
})
