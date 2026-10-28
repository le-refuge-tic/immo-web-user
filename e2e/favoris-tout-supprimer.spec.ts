import { expect, test } from '@playwright/test'
import { BIEN, mockApp, type MockResponse } from './support/mockApi'

// « Tout supprimer » des favoris (FE-B-011) : en cas d'échec partiel, la liste n'est rechargée
// qu'une fois toutes les suppressions terminées, pour refléter l'état réel du serveur.

const BIEN_2 = { ...BIEN, id: 2 }
const PANNE: MockResponse = { status: 500, body: { message: 'boom' } }
const DELAI_SUPPRESSION = 800

test('échec partiel : la liste rechargée ne garde que le favori non supprimé', async ({ page }) => {
  // Le favori 1 n'est retiré côté serveur qu'à la fin de sa requête (lente) ; le 2 échoue aussitôt.
  let favori1Retire = false
  const calls = await mockApp(page, {
    mocks: {
      routes: {
        'GET /biens/favoris': (): MockResponse => ({ status: 200, body: { data: favori1Retire ? [BIEN_2] : [BIEN, BIEN_2] } }),
        'POST /biens/1/favori': (): MockResponse => {
          setTimeout(() => { favori1Retire = true }, DELAI_SUPPRESSION - 50)
          return { status: 200, body: { favori: false }, delayMs: DELAI_SUPPRESSION }
        },
        'POST /biens/2/favori': PANNE,
      },
    },
  })
  await page.goto('/favoris')
  await expect(page.locator('article')).toHaveCount(2)

  await page.getByRole('button', { name: 'Tout supprimer' }).click()
  await page.getByRole('button', { name: 'Confirmer' }).click()

  await expect(page.getByRole('alert')).toBeVisible()
  await expect.poll(() => calls.filter(c => c.method === 'GET' && c.path === '/biens/favoris').length).toBe(2)
  await expect(page.locator('article')).toHaveCount(1)
  await expect(page.locator('article a[href="/biens/2"]')).toHaveCount(1)
})

test('succès : plus aucun favori, sans rechargement ni message', async ({ page }) => {
  const calls = await mockApp(page, {
    mocks: {
      routes: {
        'GET /biens/favoris': { status: 200, body: { data: [BIEN, BIEN_2] } },
        'POST /biens/1/favori': { status: 200, body: { favori: false } },
        'POST /biens/2/favori': { status: 200, body: { favori: false } },
      },
    },
  })
  await page.goto('/favoris')
  await expect(page.locator('article')).toHaveCount(2)

  await page.getByRole('button', { name: 'Tout supprimer' }).click()
  await page.getByRole('button', { name: 'Confirmer' }).click()

  await expect(page.getByText("Aucun favori pour l'instant")).toBeVisible()
  await expect.poll(() => calls.filter(c => c.method === 'POST' && c.path.endsWith('/favori')).length).toBe(2)
  expect(calls.filter(c => c.method === 'GET' && c.path === '/biens/favoris')).toHaveLength(1)
  await expect(page.getByRole('alert')).toHaveCount(0)
})
