import { expect, test } from '@playwright/test'
import { BIEN, mockApp } from './support/mockApi'

// Bandeau « Emplacements » de l'accueil : avec peu de quartiers, des pastilles fixes toutes visibles ;
// avec beaucoup, le défilement horizontal (sinon la boucle laissait des vides et les pastilles
// sortaient de l'écran).

/** Visiteur qui a déjà vu l'écran de présentation : sinon l'accueil le renvoie sur /splash. */
const dejaOnboarde = (page: import('@playwright/test').Page) =>
  page.addInitScript(() => localStorage.setItem('rg_onboarded', 'true'))

const bienDans = (id: number, quartier: string) =>
  ({ ...BIEN, id, localisation: { ...BIEN.localisation, quartier, ville: 'Cotonou' } })

test('peu de quartiers : pastilles fixes, toutes visibles dans l’écran', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await mockApp(page, { mocks: { biens: { status: 200, body: { data: [bienDans(1, 'adjagbo-aïdjèdo'), bienDans(2, 'adjogansa')] } } } })
  await dejaOnboarde(page)
  await page.goto('/')

  const zone = page.getByTestId('quartiers-fixes')
  await expect(zone).toBeVisible()
  await expect(page.getByTestId('quartiers-defilants')).toHaveCount(0)
  for (const nom of ['Adjagbo-Aïdjèdo', 'Adjogansa']) {
    const pastille = zone.getByRole('button', { name: new RegExp(nom, 'i') })
    await expect(pastille).toBeVisible()
    const boite = await pastille.boundingBox()
    expect(boite && boite.x >= 0 && boite.x + boite.width <= 1440).toBe(true)
  }
  expect(await page.locator('.scroll-ltr, .scroll-rtl').count()).toBe(0)
})

test('beaucoup de quartiers : le bandeau défile', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const noms = ['akpakpa', 'cadjehoun', 'fidjrossè', 'gbégamey', 'haie vive', 'jéricho', 'ménontin', 'sènadé', 'zogbo']
  await mockApp(page, { mocks: { biens: { status: 200, body: { data: noms.map((q, i) => bienDans(i + 1, q)) } } } })
  await dejaOnboarde(page)
  await page.goto('/')

  await expect(page.getByTestId('quartiers-defilants')).toBeVisible()
  await expect(page.getByTestId('quartiers-fixes')).toHaveCount(0)
  expect(await page.locator('.scroll-ltr').count()).toBeGreaterThan(0)
})
