import { expect, test } from '@playwright/test'
import { BIEN, mockApp } from './support/mockApi'

// Vignettes (FE-D-002) : les cartes de l'accueil chargent la vignette de 480 px créée par le backend,
// l'original reste proposé aux écrans à haute densité ; une photo sans vignette garde l'original.

const AVEC = { ...BIEN, id: 21, photos: [{ id: 1, url: 'https://cdn.test/p21.webp', thumbnail_url: 'https://cdn.test/thumbs/p21.webp', is_cover: true }] }
const SANS = { ...BIEN, id: 22, photos: [{ id: 2, url: 'https://cdn.test/p22.webp', thumbnail_url: null, is_cover: true }] }

test('les cartes utilisent la vignette quand elle existe', async ({ page }) => {
  await page.route('https://cdn.test/**', r => r.fulfill({ status: 200, contentType: 'image/webp', body: '' }))
  await mockApp(page, { mocks: { biens: { status: 200, body: { data: [AVEC, SANS] } } } })
  await page.goto('/')

  const imageDe = (id: number) => page.locator(`article:has(a[href="/biens/${id}"]) img`).first()
  await expect(imageDe(21)).toHaveAttribute('src', 'https://cdn.test/thumbs/p21.webp')
  await expect(imageDe(21)).toHaveAttribute('srcset', /p21\.webp 1600w/)
  await expect(imageDe(22)).toHaveAttribute('src', 'https://cdn.test/p22.webp')
  expect(await imageDe(22).getAttribute('srcset')).toBeNull()
})
