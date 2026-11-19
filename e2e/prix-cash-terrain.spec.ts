import { expect, test } from '@playwright/test'
import { BIEN, mockApp } from './support/mockApi'

// Lot 11 — terrain en vente : « Prix normal » et « Prix cash » côte à côte sur la fiche.

const TERRAIN = {
  ...BIEN,
  id: 9,
  type: 'terrain',
  transaction: 'vente',
  prix: 2_500_000,
  prix_cash: 2_200_000,
  prix_promo: null,
  localisation: { ville: 'Abomey-Calavi', quartier: 'Godomey' },
}

test.describe('fiche d’un terrain en vente', () => {
  test('affiche le prix normal, le prix cash et la réduction, sans mention de promotion', async ({ page }) => {
    await mockApp(page, { mocks: { bienDetail: { status: 200, body: TERRAIN } } })
    await page.goto('/biens/9')

    await expect(page.getByText('Prix normal (paiement échelonné)').first()).toBeVisible()
    await expect(page.getByText('Prix cash (paiement comptant)').first()).toBeVisible()
    await expect(page.getByText(/2[\s  ]200[\s  ]000 FCFA/).first()).toBeVisible()
    await expect(page.getByText(/soit −12 %/).first()).toBeVisible()
    await expect(page.getByText(/PROMO/)).toHaveCount(0)
  })

  test('sans prix cash, la fiche reste comme avant', async ({ page }) => {
    await mockApp(page, { mocks: { bienDetail: { status: 200, body: { ...TERRAIN, prix_cash: null } } } })
    await page.goto('/biens/9')

    await expect(page.getByText(/2[\s  ]500[\s  ]000/).first()).toBeVisible()
    await expect(page.getByText('Prix cash (paiement comptant)')).toHaveCount(0)
    await expect(page.getByText('Prix normal (paiement échelonné)')).toHaveCount(0)
  })

  test('une maison n’affiche jamais de prix cash, même si l’API en renvoyait un', async ({ page }) => {
    await mockApp(page, { mocks: { bienDetail: { status: 200, body: { ...TERRAIN, type: 'maison' } } } })
    await page.goto('/biens/9')

    await expect(page.getByText('Prix cash (paiement comptant)')).toHaveCount(0)
  })
})
