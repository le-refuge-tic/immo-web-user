import { expect, test } from '@playwright/test'
import { mockApp } from './support/mockApi'

// Tableau de bord locataire : affichage et ouverture de chaque onglet (FE-A-002).

test.describe('Tableau de bord locataire', () => {
  test('le tableau s’affiche puis chaque onglet de la barre latérale s’ouvre', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await mockApp(page, { role: 'locataire' })
    await page.goto('/locataire')

    const nav = page.locator('aside nav')
    await expect(nav).toBeVisible()
    await expect(page.getByText('Espace Locataire')).toBeVisible()
    // Onglet Logement par défaut : état vide ou contenu du logement, jamais le spinner seul.
    await expect(
      page.getByText('Aucun logement actif').or(page.getByText('Loyer/mois')).first(),
    ).toBeVisible()

    await nav.getByRole('button', { name: 'Activité' }).click()
    await expect(
      page.getByText(/Historique \(\d+\)/).first(),
    ).toBeVisible()

    await nav.getByRole('button', { name: 'Alertes' }).click()
    await expect(
      page.getByText('Aucune alerte').or(page.locator('main, div').getByText(/\d{2}\/\d{2}\/\d{4}/).first()).first(),
    ).toBeVisible()

    await nav.getByRole('button', { name: 'Profil' }).click()
    await expect(page.getByText('Mon portefeuille')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Modifier le profil' })).toBeVisible()

    await nav.getByRole('button', { name: 'Logement' }).click()
    await expect(
      page.getByText('Aucun logement actif').or(page.getByText('Loyer/mois')).first(),
    ).toBeVisible()
  })
})
