import { describe, expect, it } from 'vitest'
import { userApi } from '../userApi'

describe('userApi', () => {
  it("n'expose plus retrait : la route /users/me/retrait n'existe pas côté backend", () => {
    expect('retrait' in userApi).toBe(false)
  })
})
