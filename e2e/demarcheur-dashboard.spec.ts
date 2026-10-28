import { expect, test } from '@playwright/test'
import { mockApp } from './support/mockApi'

// Tableau de bord démarcheur : affichage et ouverture de chaque onglet (FE-A-002).

test.describe('Tableau de bord démarcheur', () => {
  test('le tableau s’affiche puis chaque onglet de la barre latérale s’ouvre', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await mockApp(page, { role: 'demarcheur' })
    await page.goto('/demarcheur')

    await expect(page.getByText('Actions rapides')).toBeVisible()
    await expect(page.getByText('Score de crédibilité').first()).toBeVisible()
    await expect(page.getByText('Mes biens récents')).toBeVisible()

    const nav = page.locator('aside nav')

    await nav.getByRole('button', { name: 'Mes biens' }).click()
    await expect(page.getByRole('button', { name: /Actualiser/ })).toBeVisible()

    await nav.getByRole('button', { name: 'Réservations' }).click()
    await expect(page.getByRole('button', { name: 'À traiter' })).toBeVisible()

    await nav.getByRole('button', { name: 'Notifications' }).click()
    await expect(page.getByRole('button', { name: /^Toutes$/ })).toBeVisible()

    await nav.getByRole('button', { name: 'Portefeuille' }).click()
    await expect(page.getByText('Historique des transactions').first()).toBeVisible()

    await nav.getByRole('button', { name: 'Profil' }).click()
    await expect(page.getByText('Vérification d’identité').or(page.getByText("Vérification d'identité"))).toBeVisible()

    await page.getByRole('button', { name: 'Délégations reçues' }).click()
    await expect(page.getByText('Aucune délégation')).toBeVisible()
  })
})
