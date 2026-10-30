import { expect, test } from '@playwright/test'
import { mockApp } from './support/mockApi'

// P2 — Inscription web ouverte à tous, prospects compris (VITE_INSCRIPTION_PROPRIETAIRES_UNIQUEMENT :
// seule la valeur « true » la restreint aux propriétaires ; non définie ici, donc ouverte).

test.describe('P2 inscription ouverte à tous', () => {
  test("l'en-tête propose « S'inscrire », pas « Je suis propriétaire »", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await mockApp(page, { loggedIn: false })
    // Visiteur qui a déjà vu l'écran de présentation : sans cela, l'accueil le renvoie sur /splash.
    await page.addInitScript(() => localStorage.setItem('rg_onboarded', 'true'))
    await page.goto('/')

    await expect(page.getByRole('button', { name: "S'inscrire" }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Je suis propriétaire' })).toHaveCount(0)
  })

  test('le choix du projet n’est pas sauté : le parcours d’inscription propose le choix du rôle', async ({ page }) => {
    await mockApp(page, { loggedIn: false })
    await page.goto('/onboarding')

    await expect(page).not.toHaveURL(/\/onboarding\/destination/)
  })

  test('un visiteur sur les favoris peut créer un compte ou se connecter', async ({ page }) => {
    await mockApp(page, { loggedIn: false })
    await page.goto('/favoris')

    await expect(page.getByRole('button', { name: /Créer mon compte/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /J’ai déjà un compte/ })).toBeVisible()
  })

  test('un visiteur sur les notifications peut créer un compte', async ({ page }) => {
    await mockApp(page, { loggedIn: false })
    await page.goto('/notifications')

    await expect(page.getByRole('button', { name: /Créer mon compte/ })).toBeVisible()
  })
})
