import { describe, it, expect } from 'vitest'
import { targetSize } from '../compressImage'

describe('targetSize', () => {
  it('réduit le côté le plus long à 1600 px en gardant les proportions', () => {
    expect(targetSize(4000, 3000)).toEqual({ width: 1600, height: 1200 })
    expect(targetSize(3000, 4000)).toEqual({ width: 1200, height: 1600 })
  })
  it('n’agrandit jamais une petite image', () => {
    expect(targetSize(800, 600)).toEqual({ width: 800, height: 600 })
  })
})
