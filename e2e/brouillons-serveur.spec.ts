import { expect, test, type Page } from '@playwright/test'
import { mockApp, userOf } from './support/mockApi'

// Lot 6 — brouillons gardés sur le serveur : repris sur un autre appareil, envoyés après la saisie,
// supprimés partout.

const UID = 42
const CLE_GH = 'proprietaire-guesthouse'
const avecTelephone = (page: Page) =>
  page.addInitScript(u => localStorage.setItem('rg_user', JSON.stringify(u)), { ...userOf('proprietaire'), telephone: '+2290197000000' })

const ouvrirMesBiens = async (page: Page) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/proprietaire')
  await page.getByRole('button', { name: 'Mes biens', exact: true }).first().click()
}

test('brouillon commencé sur un autre appareil : listé dans « Mes biens », repris à la bonne étape', async ({ page }) => {
  await mockApp(page, {
    role: 'proprietaire',
    mocks: { routes: {
      'GET /biens/mes-biens': { status: 200, body: { data: [] } },
      'GET /brouillons-biens': { status: 200, body: [{ cle: CLE_GH, famille: 'proprietaire_guesthouse', libelle: 'Villa Awa', etape: 1, maj_le: Date.UTC(2026, 10, 15) }] },
      [`GET /brouillons-biens/${CLE_GH}`]: { status: 200, body: {
        cle: CLE_GH, famille: 'proprietaire_guesthouse', libelle: 'Villa Awa', etape: 1, maj_le: Date.UTC(2026, 10, 15),
        donnees: { nom: 'Villa Awa', description: 'Calme, à 5 min de la plage.', quartier: 'Fidjrossè', ville: 'Cotonou' },
      } },
    } },
  })
  await avecTelephone(page)
  await ouvrirMesBiens(page)

  const brouillons = page.getByRole('region', { name: /Brouillons/ })
  await expect(brouillons).toContainText('Villa Awa')
  await expect(brouillons).toContainText('Guesthouse · Étape 2/5')
  await brouillons.getByRole('button', { name: 'Reprendre' }).click()

  await expect(page).toHaveURL(/\/nouveau-bien\/guesthouse$/)
  await expect(page.getByLabel('Quartier')).toHaveValue('Fidjrossè')
  await page.getByRole('button', { name: 'Précédent' }).click()
  await expect(page.getByLabel('Nom de la guesthouse')).toHaveValue('Villa Awa')
})

test('saisie : envoyée au serveur peu après, sans les photos', async ({ page }) => {
  const calls = await mockApp(page, {
    role: 'proprietaire',
    mocks: { routes: {
      'GET /brouillons-biens': { status: 200, body: [] },
      'POST /brouillons-biens': (req) => {
        const b = JSON.parse(req.postData() ?? '{}')
        return { status: 201, body: { cle: b.cle, famille: b.famille, libelle: b.libelle, etape: b.etape, maj_le: b.maj_le, applique: true } }
      },
    } },
  })
  await avecTelephone(page)
  await page.goto('/nouveau-bien/guesthouse')
  await page.getByLabel('Nom de la guesthouse').fill('Villa Awa')

  await expect.poll(() => calls.filter(c => c.method === 'POST' && c.path === '/brouillons-biens').length, { timeout: 10_000 }).toBeGreaterThan(0)
  const dernier = calls.filter(c => c.method === 'POST' && c.path === '/brouillons-biens').at(-1)
  expect(JSON.parse(dernier?.body ?? '{}')).toMatchObject({
    espace: 'proprietaire', cle: CLE_GH, famille: 'proprietaire_guesthouse', libelle: 'Villa Awa', etape: 0,
    donnees: expect.objectContaining({ nom: 'Villa Awa' }),
  })
})

test('suppression confirmée : retirée de l’appareil et du serveur', async ({ page }) => {
  const majLe = Date.UTC(2026, 10, 15)
  const calls = await mockApp(page, {
    role: 'proprietaire',
    mocks: { routes: {
      'GET /biens/mes-biens': { status: 200, body: { data: [] } },
      'GET /brouillons-biens': { status: 200, body: [{ cle: CLE_GH, famille: 'proprietaire_guesthouse', libelle: 'Villa Awa', etape: 0, maj_le: majLe }] },
      [`DELETE /brouillons-biens/${CLE_GH}`]: { status: 204, body: null },
    } },
  })
  await page.addInitScript(({ uid, majLe }) => {
    localStorage.setItem(`rg_draft_guesthouse_${uid}`, JSON.stringify({ form: { nom: 'Villa Awa' }, etape: 0, majLe }))
    localStorage.setItem('rg_draft_synchro', JSON.stringify({ compte: uid, etat: { 'proprietaire-guesthouse': majLe } }))
  }, { uid: UID, majLe })
  await ouvrirMesBiens(page)

  const brouillons = page.getByRole('region', { name: /Brouillons/ })
  await brouillons.getByRole('button', { name: 'Supprimer le brouillon Villa Awa' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Supprimer' }).click()
  await expect(brouillons).toHaveCount(0)
  await expect.poll(() => calls.some(c => c.method === 'DELETE' && c.path === `/brouillons-biens/${CLE_GH}`), { timeout: 10_000 }).toBe(true)
})
