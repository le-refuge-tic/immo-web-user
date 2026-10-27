import { expect, test } from '@playwright/test'
import { BIEN, mockApp, type MockResponse } from './support/mockApi'

// Couche de données (FE-A-004), critères d'acceptation du rapport d'audit :
// 1. sur /search, une seule requête de liste au montage ;
// 2. taper « Cotonou » lettre à lettre n'affiche jamais un résultat antérieur à la dernière frappe ;
// 3. revenir de la fiche vers l'accueil n'émet pas de nouvelle requête de liste tant que le cache est valide.

const BIEN_COTONOU = { ...BIEN, id: 11, localisation: { ...BIEN.localisation, ville: 'Cotonou', quartier: 'Akpakpa' } }
const BIEN_COTONOU_2 = { ...BIEN, id: 12, localisation: { ...BIEN.localisation, ville: 'Cotonou', quartier: 'Cadjehoun' } }

/** Mock de GET /biens qui note chaque URL demandée (avec ses paramètres). */
function listeBiens(reponse: (url: URL) => MockResponse) {
  const urls: URL[] = []
  return {
    urls,
    mock: (req: { url(): string }): MockResponse => {
      const url = new URL(req.url())
      urls.push(url)
      return reponse(url)
    },
  }
}

test('1. /search : une seule requête de liste au montage', async ({ page }) => {
  const liste = listeBiens(() => ({ status: 200, body: { data: [BIEN_COTONOU], total: 1 } }))
  await mockApp(page, { mocks: { biens: liste.mock } })
  await page.goto('/search')

  await expect(page.locator('article').first()).toBeVisible()
  // Laisse passer le délai de saisie (420 ms) et une éventuelle requête tardive.
  await page.waitForTimeout(1200)
  expect(liste.urls.map(u => u.search)).toHaveLength(1)
})

test('2. une réponse lente d’une recherche précédente n’écrase jamais la dernière', async ({ page }) => {
  // La liste sans ville (montage) arrive très tard avec deux biens de Cotonou ; celle de la
  // recherche « Cotonou », tout de suite, avec un seul. Si la réponse lente écrasait la dernière,
  // l'en-tête passerait à « 2 résultats ».
  const liste = listeBiens(url => (url.searchParams.get('ville')
    ? { status: 200, body: { data: [BIEN_COTONOU], total: 1 } }
    : { status: 200, body: { data: [BIEN_COTONOU, BIEN_COTONOU_2], total: 2 }, delayMs: 2500 }))
  await mockApp(page, { mocks: { biens: liste.mock } })
  await page.goto('/search?transaction=location')
  await page.getByRole('textbox').first().pressSequentially('Cotonou', { delay: 60 })

  const entete = page.locator('p', { hasText: /résultats?/ }).locator('visible=true').first()
  await expect(entete).toContainText('1 résultat')
  await page.waitForTimeout(3000)
  await expect(entete).toContainText('1 résultat')
  await expect(entete).not.toContainText('2 résultats')
})

test('3. retour de la fiche vers l’accueil : pas de nouvelle requête de liste', async ({ page }) => {
  const liste = listeBiens(() => ({ status: 200, body: { data: [BIEN_COTONOU], total: 1 } }))
  await mockApp(page, { mocks: { biens: liste.mock, bienDetail: { status: 200, body: BIEN_COTONOU } } })
  await page.goto('/')
  await page.locator('a[href="/biens/11"]').first().click()
  await expect(page).toHaveURL(/\/biens\/11$/)
  // La fiche termine ses propres chargements avant la mesure.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.waitForTimeout(1500)
  const listesAccueil = () => liste.urls.filter(u => u.searchParams.get('limit') === '100').length
  const avantRetour = listesAccueil()
  expect(avantRetour).toBeGreaterThan(0)

  await page.goBack()
  await expect(page.locator('a[href="/biens/11"]').first()).toBeVisible()
  // L'accueil est rechargé à la demande (chunk) : on laisse le temps à une éventuelle requête.
  await page.waitForTimeout(2500)
  expect(listesAccueil()).toBe(avantRetour)
})
