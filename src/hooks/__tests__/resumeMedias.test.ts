import { describe, expect, it } from 'vitest'
import { resumeMedias } from '../useMediaDraft'

const fichier = (name: string) => new File(['x'], name)

describe('resumeMedias (bandeau du brouillon restauré)', () => {
  it('photos et vidéo', () => {
    expect(resumeMedias({ photos: [fichier('a.png'), fichier('b.png')], video: fichier('v.mp4') })).toBe('2 photos et la vidéo')
  })

  it('une seule photo, au singulier', () => {
    expect(resumeMedias({ photos: [fichier('a.png')], video: null })).toBe('1 photo')
  })

  it('vidéo seule', () => {
    expect(resumeMedias({ photos: [], video: fichier('v.mp4') })).toBe('la vidéo')
  })
})
