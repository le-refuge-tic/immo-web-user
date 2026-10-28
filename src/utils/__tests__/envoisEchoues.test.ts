import { describe, expect, it } from 'vitest'
import { messageEnvoisEchoues } from '../envoisEchoues'

describe('messageEnvoisEchoues', () => {
  it('rien en échec : pas de message', () => {
    expect(messageEnvoisEchoues(0, false)).toBeNull()
  })
  it('accords : une photo, des photos, la vidéo, photos et vidéo', () => {
    expect(messageEnvoisEchoues(1, false)).toMatch(/^1 photo n'a pas pu être envoyée\./)
    expect(messageEnvoisEchoues(3, false)).toMatch(/^3 photos n'ont pas pu être envoyées\./)
    expect(messageEnvoisEchoues(0, true)).toMatch(/^La vidéo n'a pas pu être envoyée\./)
    expect(messageEnvoisEchoues(2, true)).toMatch(/^2 photos et la vidéo n'ont pas pu être envoyées\./)
  })
})
