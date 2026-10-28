import { expect, test, type Page } from '@playwright/test'
import { mockApp } from './support/mockApi'

// Brouillon d'annonce (FE-B-002) : les photos et la vidéo choisies survivent à un rechargement
// (session expirée, onglet fermé) ; « Tout effacer », la publication et la déconnexion les suppriment.

// PNG 1×1 valide.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
const photo = (name: string) => ({ name, mimeType: 'image/png', buffer: PNG })
const VIDEO = { name: 'visite.mp4', mimeType: 'video/mp4', buffer: Buffer.from('fausse video') }
// Le brouillon des champs est écrit toutes les secondes ; on laisse le temps aux deux écritures.
const ATTENTE_ECRITURE_MS = 1600

/** Remplit les étapes obligatoires et ouvre l'étape « Photos ». */
async function allerAuxPhotos(page: Page) {
  const continuer = page.getByRole('button', { name: /Continuer/ })
  await page.locator('input[type="number"]').first().fill('45000')
  await continuer.click()
  // Un quartier retrouvé dans le brouillon remplace le champ de recherche.
  const recherche = page.getByPlaceholder('Rechercher un quartier…')
  await expect(page.getByText('2/5', { exact: true })).toBeVisible()
  if (await recherche.isVisible()) {
    await recherche.fill('Akpakpa')
    await page.getByRole('button', { name: /Akpakpa/ }).first().click()
  }
  await continuer.click()
  await continuer.click()
  await continuer.click()
  await expect(page.getByText('Récapitulatif de votre annonce')).toBeVisible()
}

const champPhotos = (page: Page) => page.locator('input[type="file"][accept^="image"]')
const champVideo = (page: Page) => page.locator('input[type="file"][accept="video/mp4"]')

test.describe("Brouillon d'annonce : photos et vidéo", () => {
  test('photos et vidéo retrouvées après un rechargement, puis effacées par « Tout effacer »', async ({ page }) => {
    await mockApp(page, { role: 'demarcheur' })
    await page.goto('/nouveau-bien')
    await allerAuxPhotos(page)
    await champPhotos(page).setInputFiles([photo('salon.png'), photo('chambre.png')])
    await champVideo(page).setInputFiles(VIDEO)
    await expect(page.getByText('2/5 photos')).toBeVisible()
    await page.waitForTimeout(ATTENTE_ECRITURE_MS)

    await page.reload()
    await expect(page.getByText('Votre saisie précédente a été retrouvée, avec 2 photos et la vidéo.')).toBeVisible()
    await allerAuxPhotos(page)
    await expect(page.getByText('2/5 photos')).toBeVisible()
    await expect(page.getByText('visite.mp4')).toBeVisible()

    await page.getByRole('button', { name: 'Tout effacer' }).click()
    await page.waitForLoadState('load')
    await expect(page.getByText('Votre saisie précédente a été retrouvée')).toHaveCount(0)
    await allerAuxPhotos(page)
    await expect(page.getByText(/\/5 photo/)).toHaveCount(0)
    await expect(page.getByText('visite.mp4')).toHaveCount(0)
  })

  test('une photo retirée ne revient pas au rechargement', async ({ page }) => {
    await mockApp(page, { role: 'demarcheur' })
    await page.goto('/nouveau-bien')
    await allerAuxPhotos(page)
    await champPhotos(page).setInputFiles([photo('salon.png'), photo('chambre.png')])
    await page.getByRole('button', { name: 'Retirer la photo' }).first().click()
    await expect(page.getByText('1/5 photo')).toBeVisible()
    await page.waitForTimeout(ATTENTE_ECRITURE_MS)

    await page.reload()
    await allerAuxPhotos(page)
    await expect(page.getByText('1/5 photo —')).toBeVisible()
  })

  test('la déconnexion supprime les photos du brouillon (appareil partagé)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await mockApp(page, { role: 'demarcheur' })
    await page.goto('/nouveau-bien')
    await allerAuxPhotos(page)
    await champPhotos(page).setInputFiles([photo('salon.png')])
    const baseMedias = () => page.evaluate(async () => (await indexedDB.databases()).some(d => d.name === 'rg_brouillons_medias'))
    await expect.poll(baseMedias).toBe(true)

    // L'assistant de publication est plein écran : la déconnexion se fait depuis le profil.
    await page.goto('/profil')
    await page.getByRole('button', { name: 'Se déconnecter' }).locator('visible=true').first().click()
    await expect.poll(baseMedias).toBe(false)
  })

  test('après la publication, le brouillon et ses photos sont effacés', async ({ page }) => {
    await mockApp(page, { role: 'demarcheur' })
    await page.goto('/nouveau-bien')
    await allerAuxPhotos(page)
    await champPhotos(page).setInputFiles([photo('salon.png')])
    await page.waitForTimeout(ATTENTE_ECRITURE_MS)
    await page.getByRole('button', { name: 'Publier le bien' }).click()
    await expect(page.getByRole('heading', { name: 'Bien soumis !' })).toBeVisible()

    await page.goto('/nouveau-bien')
    await expect(page.getByText('Votre saisie précédente a été retrouvée')).toHaveCount(0)
    await allerAuxPhotos(page)
    await expect(page.getByText(/\/5 photo/)).toHaveCount(0)
  })
})
