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
})
