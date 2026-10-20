import { describe, it, expect, vi } from 'vitest'
import type { KeyboardEvent } from 'react'
import { onActivateKey } from '../keyboard'

const evt = (key: string, same = true) => {
  const el = {}
  // Faux évènement : seuls key, target, currentTarget et preventDefault sont lus (non typable sans DOM complet)
  return { key, target: el, currentTarget: same ? el : {}, preventDefault: vi.fn() } as unknown as KeyboardEvent<HTMLElement>
}

describe('onActivateKey', () => {
  it('Entrée et Espace déclenchent l\'action et bloquent le défilement', () => {
    const action = vi.fn()
    const handler = onActivateKey(action)
    for (const key of ['Enter', ' ']) {
      const e = evt(key)
      handler(e)
      expect(e.preventDefault).toHaveBeenCalled()
    }
    expect(action).toHaveBeenCalledTimes(2)
  })

  it('les autres touches sont ignorées', () => {
    const action = vi.fn()
    onActivateKey(action)(evt('a'))
    expect(action).not.toHaveBeenCalled()
  })

  it('une touche visant un contrôle imbriqué n\'est pas détournée', () => {
    const action = vi.fn()
    const e = evt('Enter', false)
    onActivateKey(action)(e)
    expect(action).not.toHaveBeenCalled()
    expect(e.preventDefault).not.toHaveBeenCalled()
  })
})
