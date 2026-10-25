import { expect, test } from '@playwright/test'
import { mockApp } from './support/mockApi'

// P2 — Inscription web réservée aux propriétaires (VITE_INSCRIPTION_PROPRIETAIRES_UNIQUEMENT, actif par défaut).

test.describe('P2 inscription propriétaires uniquement', () => {
  test("le choix du projet est sauté : on arrive directement sur l'étape de destination", async ({ page }) => {
    await mockApp(page, { loggedIn: false })
    await page.goto('/onboarding')

    await page.waitForURL('**/onboarding/destination')
  })

  test('un visiteur sur les favoris est invité à se connecter, sans proposition de créer un compte', async ({ page }) => {
    await mockApp(page, { loggedIn: false })
    await page.goto('/favoris')

    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Créer mon compte/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /J’ai déjà un compte/ })).toHaveCount(0)
  })

  test('un visiteur sur les notifications est invité à se connecter, sans proposition de créer un compte', async ({ page }) => {
    await mockApp(page, { loggedIn: false })
    await page.goto('/notifications')

    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Créer mon compte/ })).toHaveCount(0)
  })
})
