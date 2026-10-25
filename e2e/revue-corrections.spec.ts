import { expect, test } from '@playwright/test'
import { BIEN, mockApp } from './support/mockApi'

// Défauts relevés par la revue indépendante du lot « erreurs de chargement » : fiche d'un bien et réservation.

test.describe('Fiche d’un bien : changement d’identifiant', () => {
  test('une panne sur le nouveau bien affiche l’erreur, jamais le bien précédent sous la nouvelle adresse', async ({ page }) => {
    await mockApp(page, {
      mocks: {
        routes: {
          'GET /biens/1': { status: 200, body: { ...BIEN, id: 1 } },
          'GET /biens/2': { status: 500, body: { message: 'Erreur interne' } },
        },
      },
    })
    await page.goto('/biens/1')
    const cta = page.locator('button:visible', { hasText: /Réserver une visite|Proposer une visite/ })
    await expect(cta.first()).toBeVisible()

    // Navigation interne (sans rechargement) vers un autre bien, comme un clic sur un bien similaire.
    await page.evaluate(() => {
      window.history.pushState({}, '', '/biens/2')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    await expect(page.getByText('Impossible de charger ce bien')).toBeVisible()
    // L'ancien bien (et son bouton de réservation vers /reservation/1) ne doit plus être affiché.
    await expect(cta).toHaveCount(0)
  })

  test('un identifiant refusé (400) ou inaccessible (403) affiche « Bien introuvable »', async ({ page }) => {
    await mockApp(page, { mocks: { bienDetail: { status: 403, body: { message: 'Forbidden' } } } })
    await page.goto('/biens/1')

    await expect(page.getByText('Bien introuvable')).toBeVisible()
  })
})

test.describe('Réservation : le bien ne charge pas', () => {
  test('les frais de visite sont annoncés indisponibles, jamais « gratuite », et l’envoi est bloqué', async ({ page }) => {
    await mockApp(page, { role: 'prospect', mocks: { bienDetail: { status: 500, body: { message: 'Erreur interne' } } } })
    await page.goto('/reservation/1')

    await expect(page.getByText('Impossible de charger le bien').first()).toBeVisible()
    await expect(page.getByText('Cette visite est gratuite')).toHaveCount(0)
    await expect(page.getByText('Gratuite', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Les frais de visite ne sont pas disponibles').first()).toBeVisible()
  })
})
