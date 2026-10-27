import { expect, test, type Page } from '@playwright/test'
import { BIEN, mockApp, type MockResponse } from './support/mockApi'

// Vidéo d'annonce : affichée sur la fiche sans téléchargement préalable ; format vérifié au choix ;
// un envoi qui échoue après la publication est signalé au lieu d'être ignoré.

async function allerAuxPhotos(page: Page) {
  const continuer = page.getByRole('button', { name: /Continuer/ })
  await page.locator('input[type="number"]').first().fill('45000')
  await continuer.click()
  await page.getByPlaceholder('Rechercher un quartier…').fill('Akpakpa')
  await page.getByRole('button', { name: /Akpakpa/ }).first().click()
  await continuer.click()
  await continuer.click()
  await continuer.click()
  await expect(page.getByText('Récapitulatif de votre annonce')).toBeVisible()
}
const champVideo = (page: Page) => page.locator('input[type="file"][accept="video/mp4"]')

test('la fiche affiche la vidéo, sans la télécharger avant la lecture', async ({ page }) => {
  await mockApp(page, { mocks: { bienDetail: { status: 200, body: { ...BIEN, video_url: 'https://cdn.test/videos/v1.mp4' } } } })
  await page.goto('/biens/1')

  const video = page.getByLabel('Vidéo de présentation du bien').locator('visible=true').first()
  await expect(video).toHaveAttribute('src', 'https://cdn.test/videos/v1.mp4')
  await expect(video).toHaveAttribute('preload', 'none')
})

test('sans vidéo, la fiche n’a pas de section vidéo', async ({ page }) => {
  await mockApp(page, { mocks: { bienDetail: { status: 200, body: { ...BIEN, video_url: null } } } })
  await page.goto('/biens/1')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await expect(page.getByLabel('Vidéo de présentation du bien')).toHaveCount(0)
})

test('une vidéo qui n’est pas en MP4 est refusée dès le choix', async ({ page }) => {
  await mockApp(page, { role: 'demarcheur' })
  await page.goto('/nouveau-bien')
  await allerAuxPhotos(page)
  await champVideo(page).setInputFiles({ name: 'visite.mov', mimeType: 'video/quicktime', buffer: Buffer.from('x') })

  await expect(page.getByRole('alert').filter({ hasText: 'Seules les vidéos MP4' })).toBeVisible()
  await expect(page.getByText('visite.mov')).toHaveCount(0)
})

test('un envoi de vidéo qui échoue après la publication est signalé', async ({ page }) => {
  const panne: MockResponse = { status: 500, body: { message: 'stockage indisponible' } }
  await mockApp(page, {
    role: 'demarcheur',
    mocks: { routes: { 'POST /biens': { status: 201, body: { id: 1 } }, 'POST /biens/1/video': panne } },
  })
  await page.goto('/nouveau-bien')
  await allerAuxPhotos(page)
  await champVideo(page).setInputFiles({ name: 'visite.mp4', mimeType: 'video/mp4', buffer: Buffer.from('fausse video') })
  await page.getByRole('button', { name: 'Publier le bien' }).click()

  await expect(page.getByRole('heading', { name: 'Bien soumis !' })).toBeVisible()
  await expect(page.getByRole('alert').filter({ hasText: "la vidéo n'a pas pu être envoyée" })).toBeVisible()
})
