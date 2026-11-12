import { expect, test, type Page } from '@playwright/test'
import { ajouterPhotos, BIEN, mockApp, type MockResponse } from './support/mockApi'

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

test('un envoi de vidéo qui échoue après la publication est signalé et peut être relancé', async ({ page }) => {
  let envois = 0
  // Les 3 essais automatiques échouent (1 + 2 réessais), « Réessayer » réussit.
  const video = (): MockResponse => (++envois <= 3
    ? { status: 500, body: { message: 'stockage indisponible' } }
    : { status: 201, body: { video_url: 'https://cdn.test/videos/v1.mp4' } })
  await mockApp(page, {
    role: 'demarcheur',
    mocks: { routes: { 'POST /biens': { status: 201, body: { id: 1 } }, 'POST /biens/1/video': video } },
  })
  await page.goto('/nouveau-bien')
  await allerAuxPhotos(page)
  await champVideo(page).setInputFiles({ name: 'visite.mp4', mimeType: 'video/mp4', buffer: Buffer.from('fausse video') })
  await ajouterPhotos(page)
  await page.getByRole('button', { name: 'Publier le bien' }).click()

  // Lot 1 : retour au tableau de bord ; l'échec est signalé par l'indicateur d'envoi.
  await expect(page).toHaveURL(/\/demarcheur$/)
  await expect(page.getByText(/1 fichier non envoyé/)).toBeVisible({ timeout: 20_000 })
  expect(envois).toBe(3)

  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(page.getByText(/Toutes les photos de .* sont en ligne/)).toBeVisible()
  await expect(page.getByText(/1 fichier non envoyé/)).toHaveCount(0)
  expect(envois).toBe(4)
})
