import { expect, test, type Page } from '@playwright/test'
import { BIEN, mockApp, visite, type ApiCall, type Mocks } from './support/mockApi'

// P3 — Visite et paiement : réservation, liste des visites, paiement des frais (FE-B-001, B-006, B-012, B-018).

const NUMERO = '0197123456'
const payer = (page: Page) => page.getByRole('button', { name: /Payer les frais de visite/ }).first()
const confirmer = (page: Page) => page.getByRole('button', { name: 'Confirmer le paiement' })
const initiations = (calls: ApiCall[]) => calls.filter(c => c.method === 'POST' && c.path === '/paiements/visite')
const cle = (call: ApiCall) => call.headers['idempotency-key']

async function ouvrirPaiement(page: Page, mocks: Mocks) {
  const calls = await mockApp(page, {
    mocks: {
      visites: { status: 200, body: { data: [visite()] } },
      statut: { status: 200, body: { statut: 'en_attente' } },
      ...mocks,
    },
  })
  await page.goto('/mes-visites')
  await payer(page).click()
  await page.getByPlaceholder(/\d/).first().fill(NUMERO)
  return calls
}

test.describe('P3 visite et paiement', () => {
  test("une panne de l'API affiche une erreur avec « Réessayer », jamais « Aucune visite »", async ({ page }) => {
    let fail = true
    await mockApp(page, {
      mocks: { visites: () => (fail ? { status: 500, body: { message: 'boom' } } : { status: 200, body: { data: [visite()] } }) },
    })
    await page.goto('/mes-visites')

    await expect(page.getByText('Impossible de charger vos visites')).toBeVisible()
    await expect(page.getByText('Aucune visite')).toHaveCount(0)
    fail = false
    await page.getByRole('button', { name: 'Réessayer' }).click()
    await expect(page.getByText('Payer les frais de visite').first()).toBeVisible()
  })

  test('la demande de visite affiche une confirmation stable avec récapitulatif', async ({ page }) => {
    await mockApp(page, {
      mocks: {
        bienDetail: { status: 200, body: { bien: { ...BIEN, photos: [] } } },
        reserver: { status: 201, body: { id: 90, statut: 'en_attente' } },
        creerConv: { status: 201, body: { conversationId: 55 } },
      },
    })
    await page.goto('/reservation/1')
    await page.locator('button:visible', { hasText: /^\d{1,2}[:h]\d{2}$/ }).first().click()
    await page.locator('button:has-text("Envoyer"):visible, button:has-text("Proposer"):visible, button:has-text("Confirmer"):visible').last().click()

    const dialog = page.getByRole('dialog', { name: 'Demande de visite envoyée' })
    await expect(dialog).toBeVisible()
    await page.waitForTimeout(3500)
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Créneau demandé')
    await expect(dialog).toContainText('500')
    await dialog.getByRole('button', { name: /Voir mes visites/ }).click()
    await page.waitForURL(/mes-visites/)
  })

  test("une visite gratuite n'affiche pas de frais de 500 FCFA", async ({ page }) => {
    await mockApp(page, {
      mocks: {
        visites: { status: 200, body: { data: [visite({ frais_visite: 0, bien: { ...BIEN, frais_visite: 0, amenites: { visite_gratuite: true } } })] } },
      },
    })
    await page.goto('/mes-visites')

    const label = (await payer(page).textContent()) ?? ''
    expect(label).toMatch(/Gratuite/)
    expect(label).not.toMatch(/500/)
  })

  test('la fenêtre de paiement est une vraie modale : focus piégé, Échap, retour du focus', async ({ page }) => {
    await mockApp(page, { mocks: { visites: { status: 200, body: { data: [visite()] } } } })
    await page.goto('/mes-visites')
    await payer(page).click()

    const dialog = page.getByRole('dialog', { name: 'Payer la visite' })
    await expect(dialog).toBeVisible()
    expect(await dialog.evaluate(el => !!el.closest('[aria-hidden="true"]'))).toBe(false)
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    expect(await page.evaluate(() => document.activeElement?.textContent ?? '')).toContain('Payer les frais')
  })

  test("409 « déjà en cours » : le suivi est repris avec une clé d'idempotence, une seule initiation", async ({ page }) => {
    const calls = await ouvrirPaiement(page, {
      payer: { status: 409, body: { code: 'PAIEMENT_EN_ATTENTE', referenceId: 'ref-existante', message: 'Un paiement est déjà en cours.' } },
    })
    await confirmer(page).click()

    await expect(page.getByText('Confirmation en cours')).toBeVisible()
    expect(initiations(calls)).toHaveLength(1)
    expect(cle(initiations(calls)[0])).toBeTruthy()
    await page.mouse.click(5, 5)
    await expect(page.getByRole('dialog', { name: 'Payer la visite' })).toHaveCount(1)
  })

  test("réponse perdue (502) : la relance réutilise la même clé d'idempotence", async ({ page }) => {
    let essais = 0
    const calls = await ouvrirPaiement(page, {
      payer: () => (++essais === 1 ? { status: 502, body: { message: 'bad gateway' } } : { status: 200, body: { referenceId: 'ref-9', statut: 'en_attente' } }),
    })
    await confirmer(page).click()
    await expect(confirmer(page)).toBeVisible()
    await page.waitForTimeout(400)
    await confirmer(page).click()

    await expect(page.getByText('Confirmation en cours')).toBeVisible()
    const posts = initiations(calls)
    expect(posts).toHaveLength(2)
    expect(cle(posts[0])).toBe(cle(posts[1]))
  })

  test('refus clair (400) : la nouvelle tentative utilise une nouvelle clé', async ({ page }) => {
    let essais = 0
    const calls = await ouvrirPaiement(page, {
      payer: () => (++essais === 1 ? { status: 400, body: { message: 'Numéro invalide' } } : { status: 200, body: { referenceId: 'ref-10', statut: 'en_attente' } }),
    })
    await confirmer(page).click()
    await expect(confirmer(page)).toBeVisible()
    await page.waitForTimeout(400)
    await confirmer(page).click()

    await expect(page.getByText('Confirmation en cours')).toBeVisible()
    const posts = initiations(calls)
    expect(posts).toHaveLength(2)
    expect(cle(posts[0])).not.toBe(cle(posts[1]))
  })
})
