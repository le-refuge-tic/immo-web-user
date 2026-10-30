import { describe, expect, it } from 'vitest'
import { erreurVideo } from '../videoAnnonce'

const Mo = 1024 * 1024

describe('erreurVideo', () => {
  it('accepte un MP4 de 30 Mo au plus', () => {
    expect(erreurVideo({ type: 'video/mp4', size: 30 * Mo })).toBeNull()
  })
  it('refuse un autre format', () => {
    expect(erreurVideo({ type: 'video/quicktime', size: Mo })).toMatch(/MP4/)
  })
  it('refuse une vidéo trop lourde', () => {
    expect(erreurVideo({ type: 'video/mp4', size: 30 * Mo + 1 })).toMatch(/30 Mo/)
  })
})
