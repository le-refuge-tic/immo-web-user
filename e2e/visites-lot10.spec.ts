import { expect, test } from '@playwright/test'
import { mockApp, visite } from './support/mockApi'

// Lot 10 — créneau expiré et frais de visite présentés comme une promotion.

const HIER = new Date(Date.now() - 86_400_000).toISOString()
const TARIF = { montant: 500, montant_normal: 1000, montant_promo: 500, promo_active: true, promo_fin_le: null }

test.describe('Visites : créneau expiré', () => {
  const visites = {
    status: 200,
    body: { data: [
      visite({ id: 7, statut: 'en_attente', date_souhaitee: HIER, paiement_effectue: false }),
      visite({ id: 8, statut: 'confirmee', paiement_effectue: false }),
    ] },
  }

  test('badge, phrase et actions adaptées ; onglet « Expirées »', async ({ page }) => {
    await mockApp(page, { role: 'prospect', mocks: { visites, routes: { 'GET /configuration/frais-visite': { status: 200, body: TARIF } } } })
    await page.goto('/mes-visites')

    const carte = page.locator('#visite-7')
    await expect(carte.getByText('Créneau expiré').first()).toBeVisible()
    await expect(carte.getByText('Le propriétaire n’a pas répondu avant le créneau.')).toBeVisible()
    await expect(carte.getByRole('button', { name: 'Proposer un nouveau créneau' })).toBeVisible()
    await expect(carte.getByRole('link', { name: 'Contacter le support' })).toBeVisible()
    await expect(carte.getByRole('button', { name: 'Annuler' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Expirées' }).click()
    await expect(page.locator('#visite-7')).toBeVisible()
    await expect(page.locator('#visite-8')).toHaveCount(0)
    await page.getByRole('button', { name: 'À venir' }).click()
    await expect(page.locator('#visite-7')).toHaveCount(0)
    await expect(page.locator('#visite-8')).toBeVisible()
  })

  test('les frais de la visite confirmée montrent le prix normal barré', async ({ page }) => {
    await mockApp(page, { role: 'prospect', mocks: { visites, routes: { 'GET /configuration/frais-visite': { status: 200, body: TARIF } } } })
    await page.goto('/mes-visites')

    const payer = page.locator('#visite-8').getByRole('button', { name: /Payer les frais de visite/ })
    await expect(payer.locator('s')).toHaveText('1 000 FCFA')
    await expect(payer).toContainText('500 FCFA')
  })

  test('sans promotion active, aucun prix barré', async ({ page }) => {
    await mockApp(page, { role: 'prospect', mocks: { visites, routes: { 'GET /configuration/frais-visite': { status: 200, body: { ...TARIF, promo_active: false } } } } })
    await page.goto('/mes-visites')

    const payer = page.locator('#visite-8').getByRole('button', { name: /Payer les frais de visite/ })
    await expect(payer).toContainText('500 FCFA')
    await expect(payer.locator('s')).toHaveCount(0)
  })
})
