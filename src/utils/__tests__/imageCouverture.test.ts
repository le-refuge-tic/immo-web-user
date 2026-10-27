import { describe, expect, it } from 'vitest'
import { imageDeCouverture } from '../imageCouverture'

const photo = (id: number, extra = {}) => ({ id, url: `https://cdn/p${id}.webp`, ...extra })

describe('imageDeCouverture (FE-D-002)', () => {
  it('prend la photo de couverture, sinon la première', () => {
    expect(imageDeCouverture([photo(1), photo(2, { is_cover: true })])?.src).toBe('https://cdn/p2.webp')
    expect(imageDeCouverture([photo(1), photo(2)])?.src).toBe('https://cdn/p1.webp')
  })

  it('avec vignette : vignette par défaut, original en haute densité', () => {
    const img = imageDeCouverture([photo(1, { thumbnail_url: 'https://cdn/thumbs/p1.webp' })])

    expect(img).toEqual({
      src: 'https://cdn/thumbs/p1.webp',
      srcSet: 'https://cdn/thumbs/p1.webp 480w, https://cdn/p1.webp 1600w',
      sizes: '(max-width: 640px) 50vw, 320px',
    })
  })

  it('sans vignette (photo antérieure) : l’original, sans srcset', () => {
    expect(imageDeCouverture([photo(1, { thumbnail_url: null })])).toEqual({ src: 'https://cdn/p1.webp' })
  })

  it('sans photo : null', () => {
    expect(imageDeCouverture([])).toBeNull()
    expect(imageDeCouverture(undefined)).toBeNull()
  })

  it('résout les URL relatives du backend', () => {
    const img = imageDeCouverture([{ id: 1, url: '/u/p1.webp', thumbnail_url: '/u/t/p1.webp' }], u => `https://api${u}`)
    expect(img?.src).toBe('https://api/u/t/p1.webp')
  })
})
