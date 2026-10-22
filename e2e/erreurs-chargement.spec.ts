import { expect, test, type Page } from '@playwright/test'
import { BIEN, mockApp, visite, type MockResponse, type Mocks } from './support/mockApi'

// Erreurs de chargement (FE-B-001, FE-B-011) : une panne de l'API ne se présente jamais comme
// « aucun résultat » ; chaque écran montre un message clair avec « Réessayer », et la relance recharge les données.

const PANNE: MockResponse = { status: 500, body: { message: 'boom' } }
const reessayer = (page: Page) => page.getByRole('button', { name: 'Réessayer' })
// Certains écrans montrent deux mises en page (mobile / bureau) dont une est masquée : on ne cible que le texte visible.
const vu = (page: Page, texte: string) => page.getByText(texte).locator('visible=true').first()

/** Réponse qui échoue (500) tant que `reparer()` n'a pas été appelé, puis renvoie `ok`. */
function interrupteur(ok: MockResponse) {
  let enPanne = true
  return { mock: (): MockResponse => (enPanne ? PANNE : ok), reparer: () => { enPanne = false } }
}

const transaction = { id: 1, type: 'depot', description: 'Dépôt test', libelle: 'Loyer janvier', amount: 5000, created_at: new Date().toISOString() }

test.describe('erreurs de chargement : portefeuille', () => {
  test("portefeuille locataire : panne → erreur et « Réessayer », jamais « Aucune transaction »", async ({ page }) => {
    const solde = interrupteur({ status: 200, body: { balance: 12000 } })
    const txs = interrupteur({ status: 200, body: { data: [transaction] } })
    await mockApp(page, { role: 'locataire', mocks: { solde: solde.mock, transactions: txs.mock } })
    await page.goto('/portefeuille')

    await expect(page.getByText('Impossible de charger votre portefeuille')).toBeVisible()
    await expect(page.getByText('Aucune transaction')).toHaveCount(0)
    solde.reparer(); txs.reparer()
    await reessayer(page).click()
    await expect(page.getByText('Dépôt test')).toBeVisible()
    await expect(page.getByText('Impossible de charger votre portefeuille')).toHaveCount(0)
  })

  test('portefeuille propriétaire : panne → erreur, relance → commissions affichées', async ({ page }) => {
    const solde = interrupteur({ status: 200, body: { balance: 50000 } })
    const txs = interrupteur({ status: 200, body: { data: [transaction] } })
    await mockApp(page, { role: 'proprietaire', mocks: { solde: solde.mock, transactions: txs.mock } })
    await page.goto('/portefeuille')

    await expect(page.getByText('Impossible de charger votre portefeuille')).toBeVisible()
    await expect(page.getByText('Aucune transaction')).toHaveCount(0)
    solde.reparer(); txs.reparer()
    await reessayer(page).click()
    await expect(page.getByText('Loyer mensuel')).toBeVisible()
  })

  test('une demande de retrait refusée affiche un message et laisse le bouton actif', async ({ page }) => {
    await mockApp(page, {
      role: 'proprietaire',
      mocks: { solde: { status: 200, body: { balance: 50000 } }, demandeRetrait: PANNE },
    })
    await page.goto('/portefeuille')
    await page.getByRole('button', { name: 'Demander un retrait' }).click()
    await page.getByPlaceholder('Ex: 50000').fill('1000')
    await page.getByRole('button', { name: 'Envoyer' }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'momentanément indisponible' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Envoyer' })).toBeEnabled()
  })
})

test.describe('erreurs de chargement : listes du compte', () => {
  test('favoris : panne → erreur, jamais « Aucun favori », relance → biens affichés', async ({ page }) => {
    const favoris = interrupteur({ status: 200, body: { data: [BIEN] } })
    await mockApp(page, { mocks: { routes: { 'GET /biens/favoris': favoris.mock } } })
    await page.goto('/favoris')

    await expect(page.getByText('Impossible de charger vos favoris')).toBeVisible()
    await expect(page.getByText("Aucun favori pour l'instant")).toHaveCount(0)
    favoris.reparer()
    await reessayer(page).click()
    await expect(page.locator('article')).toHaveCount(1)
  })

  test('alertes : panne → erreur, jamais « Aucune alerte », relance → alerte affichée', async ({ page }) => {
    const alertes = interrupteur({
      status: 200,
      body: { data: [{ id: 1, type: 'bien_approuve', titre: 'Votre bien est publié', lu: false, created_at: new Date().toISOString() }] },
    })
    await mockApp(page, { mocks: { alertes: alertes.mock } })
    await page.goto('/notifications')

    await expect(page.getByText('Impossible de charger vos alertes')).toBeVisible()
    await expect(page.getByText('Aucune alerte')).toHaveCount(0)
    alertes.reparer()
    await reessayer(page).click()
    await expect(page.getByText('Votre bien est publié')).toBeVisible()
  })

  test('profil : visites indisponibles → erreur au lieu de « 0 visite », relance → visite en cours', async ({ page }) => {
    const visites = interrupteur({ status: 200, body: { data: [visite()] } })
    await mockApp(page, { mocks: { visites: visites.mock } })
    await page.goto('/profil')

    await expect(page.getByText('Impossible de charger vos visites')).toBeVisible()
    visites.reparer()
    await reessayer(page).click()
    await expect(vu(page, '1 en cours')).toBeVisible()
    await expect(page.getByText('Impossible de charger vos visites')).toHaveCount(0)
  })

  test('mon logement : panne → erreur, relance → écran du logement', async ({ page }) => {
    const logement = interrupteur({ status: 200, body: {} })
    await mockApp(page, { role: 'locataire', mocks: { routes: { 'GET /loyers/mon-logement': logement.mock } } })
    await page.goto('/locataire')

    await expect(page.getByText('Impossible de charger votre logement')).toBeVisible()
    await expect(page.getByText('Aucun logement actif')).toHaveCount(0)
    logement.reparer()
    await reessayer(page).click()
    await expect(page.getByText('Aucun logement actif')).toBeVisible()
  })

  test("mes visites : l'échec d'une annulation est signalé, la liste reste affichée", async ({ page }) => {
    await mockApp(page, {
      mocks: {
        visites: { status: 200, body: { data: [visite({ paiement_effectue: true })] } },
        routes: { 'PATCH /visites/7/annuler': PANNE },
      },
    })
    await page.goto('/mes-visites')
    await page.getByRole('button', { name: 'Annuler', exact: true }).click()
    await page.getByRole('button', { name: 'Confirmer' }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'momentanément indisponible' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Annuler', exact: true })).toBeVisible()
  })
})

test.describe('erreurs de chargement : fiche et réservation d\'un bien', () => {
  test('fiche bien : panne → « Impossible de charger ce bien » (pas « introuvable »), relance → fiche', async ({ page }) => {
    const detail = interrupteur({ status: 200, body: { ...BIEN } })
    await mockApp(page, { mocks: { bienDetail: detail.mock } })
    await page.goto('/biens/1')

    await expect(vu(page, 'Impossible de charger ce bien')).toBeVisible()
    await expect(page.getByText('Bien introuvable')).toHaveCount(0)
    detail.reparer()
    await reessayer(page).click()
    await expect(vu(page, 'Akpakpa')).toBeVisible()
    await expect(page.getByText('Impossible de charger ce bien')).toHaveCount(0)
  })

  test('fiche bien : un vrai 404 reste « Bien introuvable », sans bouton « Réessayer »', async ({ page }) => {
    await mockApp(page, { mocks: { bienDetail: { status: 404, body: { message: 'Not found' } } } })
    await page.goto('/biens/1')

    await expect(page.getByText('Bien introuvable')).toBeVisible()
    await expect(reessayer(page)).toHaveCount(0)
  })

  test('réservation : bien indisponible → erreur au lieu de « visite gratuite », relance → bien affiché', async ({ page }) => {
    const detail = interrupteur({ status: 200, body: { bien: { ...BIEN } } })
    await mockApp(page, { mocks: { bienDetail: detail.mock } })
    await page.goto('/reservation/1')

    await expect(vu(page, 'Impossible de charger le bien')).toBeVisible()
    detail.reparer()
    await reessayer(page).click()
    await expect(vu(page, 'Akpakpa')).toBeVisible()
    await expect(page.getByText('Impossible de charger le bien')).toHaveCount(0)
  })

  test('contrat de bail : bien indisponible → erreur et paiement bloqué, relance → contrat', async ({ page }) => {
    const detail = interrupteur({ status: 200, body: { ...BIEN } })
    await mockApp(page, { role: 'locataire', mocks: { bienDetail: detail.mock } })
    await page.goto('/contrat-bail/1')

    await expect(vu(page, 'Impossible de charger le contrat')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continuer vers le paiement' })).toBeDisabled()
    detail.reparer()
    await reessayer(page).click()
    await expect(page.getByText('1. Objet du contrat')).toBeVisible()
  })

  test("paiement d'intégration : bien indisponible → erreur au lieu d'un total à 0 FCFA, relance → détail", async ({ page }) => {
    const detail = interrupteur({ status: 200, body: { bien: { ...BIEN } } })
    await mockApp(page, { role: 'locataire', mocks: { bienDetail: detail.mock } })
    await page.goto('/paiement-integration/1')

    await expect(page.getByText('Impossible de charger le paiement')).toBeVisible()
    await expect(page.getByText('Total à payer')).toHaveCount(0)
    detail.reparer()
    await reessayer(page).click()
    await expect(page.getByText('Total à payer')).toBeVisible()
  })
})

test.describe('erreurs de chargement : messagerie', () => {
  test('fil de discussion : panne → erreur, jamais « Démarrez la conversation », relance → fil vide valide', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const messages = interrupteur({ status: 200, body: { data: [] } })
    await mockApp(page, { mocks: { messages: messages.mock } })
    await page.goto('/conversations/5')

    await expect(vu(page, 'Impossible de charger la conversation')).toBeVisible()
    await expect(page.getByText('Démarrez la conversation')).toHaveCount(0)
    messages.reparer()
    await reessayer(page).click()
    await expect(vu(page, 'Démarrez la conversation')).toBeVisible()
  })
})

const ouvrirOnglet = (page: Page, nom: string) => page.getByRole('button', { name: nom, exact: true }).first().click()

async function ouvrirEspace(page: Page, role: 'proprietaire' | 'demarcheur', url: string, mocks: Mocks) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await mockApp(page, { role, mocks })
  await page.goto(url)
}

test.describe('erreurs de chargement : espaces propriétaire et démarcheur', () => {
  test('tableau propriétaire : panne → bandeau d’erreur avec « Réessayer », relance → bandeau disparu', async ({ page }) => {
    const biens = interrupteur({ status: 200, body: { data: [BIEN] } })
    await ouvrirEspace(page, 'proprietaire', '/proprietaire', { routes: { 'GET /biens/mes-biens': biens.mock } })

    await expect(page.getByText('Impossible de charger votre tableau de bord')).toBeVisible()
    biens.reparer()
    await reessayer(page).click()
    await expect(page.getByText('Impossible de charger votre tableau de bord')).toHaveCount(0)
  })

  test('mes biens propriétaire : panne → erreur, jamais « Aucun bien trouvé », relance → biens', async ({ page }) => {
    const biens = interrupteur({ status: 200, body: { data: [BIEN] } })
    await ouvrirEspace(page, 'proprietaire', '/proprietaire', { routes: { 'GET /biens/mes-biens': biens.mock } })
    await ouvrirOnglet(page, 'Mes biens')

    await expect(page.getByText('Impossible de charger vos biens')).toBeVisible()
    await expect(page.getByText('Aucun bien trouvé')).toHaveCount(0)
    biens.reparer()
    await reessayer(page).last().click()
    await expect(page.getByText('Impossible de charger vos biens')).toHaveCount(0)
    await expect(vu(page, 'Akpakpa')).toBeVisible()
  })

  test('loyers propriétaire : panne → erreur, jamais « Aucun contrat », relance → liste vide valide', async ({ page }) => {
    const loyers = interrupteur({ status: 200, body: { contrats: [], stats: {} } })
    await ouvrirEspace(page, 'proprietaire', '/proprietaire', { routes: { 'GET /loyers/dashboard': loyers.mock } })
    await ouvrirOnglet(page, 'Loyers')

    await expect(page.getByText('Impossible de charger vos loyers')).toBeVisible()
    await expect(page.getByText('Aucun contrat')).toHaveCount(0)
    loyers.reparer()
    await reessayer(page).last().click()
    await expect(page.getByText('Aucun contrat').first()).toBeVisible()
  })

  test('portefeuille démarcheur : panne → erreur, jamais « Aucune transaction », relance → transactions', async ({ page }) => {
    const txs = interrupteur({ status: 200, body: { data: [{ ...transaction, description: 'Commission test' }] } })
    await ouvrirEspace(page, 'demarcheur', '/demarcheur', { transactions: txs.mock })
    await page.locator('aside nav').getByRole('button', { name: 'Portefeuille' }).click()

    await expect(page.getByText('Impossible de charger vos transactions')).toBeVisible()
    await expect(page.getByText('Aucune transaction')).toHaveCount(0)
    txs.reparer()
    await reessayer(page).click()
    await expect(page.getByText('Commission test')).toBeVisible()
  })

  test('notifications démarcheur : panne → erreur, jamais « Aucune notification », relance → alerte', async ({ page }) => {
    const alertes = interrupteur({
      status: 200,
      body: { data: [{ id: 1, type: 'bien_approuve', titre: 'Annonce validée', lu: false, created_at: new Date().toISOString() }] },
    })
    await ouvrirEspace(page, 'demarcheur', '/demarcheur', { alertes: alertes.mock })
    await page.locator('aside nav').getByRole('button', { name: 'Notifications' }).click()

    await expect(page.getByText('Impossible de charger vos notifications')).toBeVisible()
    await expect(page.getByText('Aucune notification')).toHaveCount(0)
    alertes.reparer()
    await reessayer(page).click()
    await expect(page.getByText('Annonce validée')).toBeVisible()
  })
})
