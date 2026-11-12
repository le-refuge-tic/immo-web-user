import { expect, test, type Page, type Request } from '@playwright/test'
import { ajouterPhotos, mockApp, type MockResponse } from './support/mockApi'

// Lot 1 — envoi des photos en arrière-plan : retour immédiat au tableau de bord, indicateur
// visible, avertissement à la fermeture, reprise après un rechargement sans doublon (cle_envoi).

/** Valeur du champ `cle_envoi` d'un envoi multipart. */
const cleEnvoi = (req: Request): string | null =>
  /name="cle_envoi"\r\n\r\n([A-Za-z0-9_-]+)/.exec(req.postDataBuffer()?.toString('latin1') ?? '')?.[1] ?? null

/** Remplit les étapes obligatoires jusqu'au récapitulatif (même parcours que p4-proprietaire). */
async function remplirJusquAuxPhotos(page: Page) {
  const continuer = page.getByRole('button', { name: /Continuer/ })
  await page.locator('input[type="number"]').first().fill('45000')
  await continuer.click()
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

test.describe('Envoi des photos en arrière-plan', () => {
  test('retour immédiat, indicateur, puis toast de fin', async ({ page }) => {
    await mockApp(page, { role: 'proprietaire', mocks: { routes: { 'POST /biens/1/photos': { status: 201, body: { id: 10 }, delayMs: 400 } } } })
    await page.goto('/nouveau-bien')
    await remplirJusquAuxPhotos(page)
    await ajouterPhotos(page, 3)
    await page.getByRole('button', { name: 'Publier le bien' }).click()

    await expect(page).toHaveURL(/\/proprietaire$/)
    await expect(page.getByText('Les photos s’envoient en arrière-plan', { exact: false })).toBeVisible()
    await expect(page.getByText(/Envoi des photos de .* : [0-2]\/3/)).toBeVisible()
    await expect(page.getByText(/Toutes les photos de .* sont en ligne/)).toBeVisible()
    await expect(page.getByText(/Envoi des photos de/)).toHaveCount(0)
  })

  test('rechargement en plein envoi : avertissement, reprise sans doublon', async ({ page }) => {
    const cles: (string | null)[] = []
    let bloquer = true
    // 1re photo (couverture) reçue ; la 2e reste en vol tant que `bloquer` : la page est rechargée avant sa réponse.
    const photos = (req: Request): MockResponse => {
      cles.push(cleEnvoi(req))
      const enVol = bloquer && cles.length === 2
      return { status: 201, body: { id: cles.length }, delayMs: enVol ? 60_000 : 50 }
    }
    await mockApp(page, { role: 'proprietaire', mocks: { routes: { 'POST /biens/1/photos': photos } } })
    await page.goto('/nouveau-bien')
    await remplirJusquAuxPhotos(page)
    await ajouterPhotos(page, 2)
    await page.getByRole('button', { name: 'Publier le bien' }).click()
    await expect(page.getByText(/Envoi des photos de .* : 1\/2/)).toBeVisible()
    expect(cles).toHaveLength(2)
    expect(cles.every(c => c && /^[A-Za-z0-9_-]{8,64}$/.test(c))).toBe(true)

    // La fermeture de l'onglet est signalée pendant l'envoi.
    const avertissements: string[] = []
    page.on('dialog', d => { avertissements.push(d.type()); void d.accept() })
    await page.reload()
    expect(avertissements).toContain('beforeunload')

    // Après le rechargement : l'envoi est proposé à la reprise.
    await expect(page.getByText(/Envoi interrompu/)).toBeVisible()
    await expect(page.getByText('1/2 fichiers envoyés avant la fermeture de la page.')).toBeVisible()
    bloquer = false
    await page.getByRole('button', { name: 'Reprendre l’envoi' }).click()
    await expect(page.getByText(/Toutes les photos de .* sont en ligne/)).toBeVisible()

    // Seule la photo interrompue repart, avec la même clé : l'API ne crée pas de doublon.
    expect(cles).toHaveLength(3)
    expect(cles[2]).toBe(cles[1])
    expect(cles.filter(c => c === cles[0])).toHaveLength(1)
    await expect(page.getByText(/Envoi interrompu/)).toHaveCount(0)
  })

  test('« Ignorer » abandonne un envoi interrompu', async ({ page }) => {
    let n = 0
    const photos = (): MockResponse => ({ status: 201, body: { id: ++n }, delayMs: n === 2 ? 60_000 : 50 })
    await mockApp(page, { role: 'proprietaire', mocks: { routes: { 'POST /biens/1/photos': photos } } })
    await page.goto('/nouveau-bien')
    await remplirJusquAuxPhotos(page)
    await ajouterPhotos(page, 2)
    await page.getByRole('button', { name: 'Publier le bien' }).click()
    await expect(page.getByText(/Envoi des photos de .* : 1\/2/)).toBeVisible()
    page.on('dialog', d => void d.accept())
    await page.reload()
    await page.getByRole('button', { name: 'Ignorer' }).click()
    await expect(page.getByText(/Envoi interrompu/)).toHaveCount(0)
    await page.reload()
    await expect(page.getByText(/Envoi interrompu/)).toHaveCount(0)
  })
})
