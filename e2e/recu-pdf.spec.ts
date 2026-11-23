import { expect, test } from '@playwright/test'
import { BIEN, mockApp } from './support/mockApi'

// Le PDF du reçu se génère même quand un montant dépasse 999 F : « 1 000 » contient une espace fine
// insécable (U+202F) que la police Helvetica ne sait pas écrire (régression : « Impossible de générer le PDF »).

const TARIF = { montant: 500, montant_normal: 1000, montant_promo: 500, promo_active: true, promo_fin_le: null }
const CLIENT = { prenom: 'Awa', nom: 'Test' }
const GESTIONNAIRE = { prenom: 'Koffi', nom: 'Adjovi', role: 'proprietaire' }
const BASE = { reference: 'abcd1234-0000-0000-0000-000000000000', date_paiement: '2026-11-23T10:37:00Z', methode_paiement: 'mtn', client: CLIENT, gestionnaire: GESTIONNAIRE }

test.describe('reçu PDF', () => {
  test('reçu de visite au tarif promotionnel (prix normal 1 000 FCFA)', async ({ page }) => {
    await mockApp(page, {
      mocks: { routes: {
        'GET /configuration/frais-visite': { status: 200, body: TARIF },
        'GET /paiements/visite/abcd1234/recu': { status: 200, body: { ...BASE, montant: 500, visite: { bien: BIEN, date_confirmee: '2026-11-25T09:00:00Z' } } },
      } },
    })
    await page.goto('/recu/visite/abcd1234')
    await expect(page.getByText('Tarif promotionnel').first()).toBeVisible()

    const [telechargement] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Télécharger le reçu PDF' }).click(),
    ])
    expect(telechargement.suggestedFilename()).toBe('refuge_recu_abcd1234.pdf')
    await expect(page.getByText('Impossible de générer le PDF')).toHaveCount(0)
  })

  test('reçu de loyer de 150 000 FCFA', async ({ page }) => {
    await mockApp(page, {
      role: 'locataire',
      mocks: { routes: {
        'GET /configuration/frais-visite': { status: 200, body: TARIF },
        'GET /paiements/loyer/abcd1234/recu': { status: 200, body: { ...BASE, montant: 150000, bien: BIEN, loyer: { mois: '2026-11' }, locataire: CLIENT } },
      } },
    })
    await page.goto('/recu/loyer/abcd1234')
    const [telechargement] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Télécharger le reçu PDF' }).click(),
    ])
    expect(telechargement.suggestedFilename()).toBe('refuge_loyer_abcd1234.pdf')
    await expect(page.getByText('Impossible de générer le PDF')).toHaveCount(0)
  })

  test('si la génération échoue, le reçu reste affiché avec un message sous le bouton', async ({ page }) => {
    await mockApp(page, {
      mocks: { routes: {
        'GET /configuration/frais-visite': { status: 200, body: TARIF },
        'GET /paiements/visite/abcd1234/recu': { status: 200, body: { ...BASE, montant: 500, visite: { bien: BIEN } } },
      } },
    })
    // La génération échoue en cours de route (navigateur qui refuse de fabriquer le fichier, mémoire…).
    await page.addInitScript(() => { URL.createObjectURL = () => { throw new Error('boom') } })
    await page.goto('/recu/visite/abcd1234')
    await page.getByRole('button', { name: 'Télécharger le reçu PDF' }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'Impossible de générer le PDF' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Télécharger le reçu PDF' })).toBeVisible()
    await expect(page.getByText('Reçu de visite').first()).toBeVisible()
  })
})
