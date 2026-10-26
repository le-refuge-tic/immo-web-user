import { expect, test } from '@playwright/test'
import { mockApp } from './support/mockApi'

// P4 — Propriétaire / démarcheur : publication d'une annonce, brouillon (FE-B-002).

test.describe("P4 publication d'annonce", () => {
  test('la saisie survit à un rechargement et « Tout effacer » repart de zéro', async ({ page }) => {
    await mockApp(page, { role: 'demarcheur' })
    await page.goto('/nouveau-bien')
    await page.locator('input[type="number"]').first().fill('75000')
    await page.waitForTimeout(1600)

    await page.reload()
    await expect(page.getByText('Votre saisie précédente a été retrouvée')).toBeVisible()
    expect((await page.locator('input[type="number"]').first().inputValue()).replace(/\D/g, '')).toBe('75000')

    await page.getByRole('button', { name: 'Tout effacer' }).click()
    await page.waitForLoadState('load')
    await expect(page.getByText('Votre saisie précédente a été retrouvée')).toHaveCount(0)
    await expect(page.locator('input[type="number"]').first()).toHaveValue('')
  })

  test("l'assistant parcourt les cinq étapes jusqu'à la publication", async ({ page }) => {
    await mockApp(page, { role: 'demarcheur' })
    await page.goto('/nouveau-bien')
    const continuer = page.getByRole('button', { name: /Continuer/ })

    // Étape 1 — type et prix
    await page.locator('input[type="number"]').first().fill('45000')
    await continuer.click()

    // Étape 2 — localisation : un quartier de la liste
    await page.getByPlaceholder('Rechercher un quartier…').fill('Akpakpa')
    await page.getByRole('button', { name: /Akpakpa/ }).first().click()
    await continuer.click()

    // Étapes 3 et 4 — confort puis honoraires, sans rien de plus à saisir
    await expect(page.getByText('3/5')).toBeVisible()
    await continuer.click()
    await expect(page.getByText('4/5')).toBeVisible()
    await continuer.click()

    // Étape 5 — récapitulatif puis publication
    await expect(page.getByText('Récapitulatif de votre annonce')).toBeVisible()
    await expect(page.getByText('Quartier : Akpakpa')).toBeVisible()
    await page.getByRole('button', { name: 'Publier le bien' }).click()
    await expect(page.getByRole('heading', { name: 'Bien soumis !' })).toBeVisible()
  })

  test('« En finition / Bientôt » propose une date de disponibilité, envoyée à la publication', async ({ page }) => {
    const calls = await mockApp(page, { role: 'demarcheur' })
    await page.goto('/nouveau-bien')
    const continuer = page.getByRole('button', { name: /Continuer/ })

    await page.locator('input[type="number"]').first().fill('45000')
    await continuer.click()
    await page.getByPlaceholder('Rechercher un quartier…').fill('Akpakpa')
    await page.getByRole('button', { name: /Akpakpa/ }).first().click()
    await continuer.click()

    // Étape 3 — le champ date n'apparaît qu'avec « En finition / Bientôt »
    const date = page.getByLabel(/Disponible à partir du/)
    await expect(date).toHaveCount(0)
    await page.getByRole('button', { name: 'En finition / Bientôt' }).click()
    await date.fill('2030-03-15')
    await continuer.click()
    await continuer.click()

    await expect(page.getByText('Disponible à partir du 15/03/2030')).toBeVisible()
    await page.getByRole('button', { name: 'Publier le bien' }).click()
    await expect(page.getByRole('heading', { name: 'Bien soumis !' })).toBeVisible()

    const creation = calls.find(c => c.method === 'POST' && c.path === '/biens')
    const body = JSON.parse(creation?.body ?? '{}') as { disponible_a?: string; amenites?: { disponibilite?: string } }
    expect(body.disponible_a).toBe('2030-03-15')
    expect(body.amenites?.disponibilite).toBe('en_finition')
  })

  test("un prix manquant bloque l'étape 1 avec un message", async ({ page }) => {
    await mockApp(page, { role: 'demarcheur' })
    await page.goto('/nouveau-bien')
    await page.getByRole('button', { name: /Continuer/ }).click()

    await expect(page.getByText('Veuillez entrer le prix')).toBeVisible()
  })
})
