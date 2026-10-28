import { expect, test, type Page } from '@playwright/test'
import { BIEN, mockApp, visite, type ApiCall, type MockResponse } from './support/mockApi'

// Lectures corrigées : référence du paiement de loyer (`reference`), réparation (`repare`),
// alertes du locataire (lu / tout lu / erreurs), date retenue du profil, erreurs du démarcheur
// et de la reproposition. Le suivi du loyer doit interroger /paiements/loyer/<reference>/statut.

const iso = (jours: number) => new Date(Date.now() + jours * 86_400_000).toISOString()
const PANNE: MockResponse = { status: 500, body: { message: 'boom' } }

const loyer = { id: 11, mois: iso(0), date_echeance: iso(2), montant: 50000, statut: 'en_attente' }
const logement = (extra: Record<string, unknown> = {}) => ({
  contrat: { loyer_mensuel: 50000 },
  bien: BIEN,
  loyers_en_attente: [loyer],
  historique_loyers: [],
  ...extra,
})
const TEL = '0196123456'
const FEDAPAY = 'https://checkout.fedapay.com/abc123'

const statutAppels = (calls: ApiCall[]) =>
  calls.filter(c => c.method === 'GET' && /^\/paiements\/loyer\/.+\/statut$/.test(c.path))
const initiations = (calls: ApiCall[]) => calls.filter(c => c.method === 'POST' && c.path === '/paiements/loyer')

/** Remplace window.open pour relever les pages de paiement ouvertes. */
const espionnerOuvertures = (page: Page) =>
  page.addInitScript(() => {
    const w = window as unknown as { __ouverts: string[] }
    w.__ouverts = []
    window.open = (url?: string | URL) => { w.__ouverts.push(String(url)); return null }
  })
const ouvertures = (page: Page) => page.evaluate(() => (window as unknown as { __ouverts: string[] }).__ouverts)

const ouvrirActivite = async (page: Page) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/locataire')
  await page.locator('aside nav').getByRole('button', { name: 'Activité' }).click()
}
const payerDepuisActivite = async (page: Page) => {
  await page.getByRole('button', { name: 'Payer ce loyer' }).click()
  await page.getByLabel('Numéro Mobile Money').fill(TEL)
  await page.getByRole('button', { name: 'Payer', exact: true }).click()
}
const payerDepuisLogement = async (page: Page) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/locataire')
  await page.getByRole('button', { name: /50\s?000 F/ }).click()
  await page.getByLabel('Numéro Mobile Money').fill(TEL)
  await page.getByRole('button', { name: /^Payer via/ }).click()
}

test.describe('Paiement du loyer : onglet Activité', () => {
  test('suit le paiement avec la référence renvoyée par le backend et affiche la confirmation', async ({ page }) => {
    const calls = await mockApp(page, {
      role: 'locataire',
      mocks: {
        routes: {
          'GET /loyers/mon-logement': { status: 200, body: logement() },
          'POST /paiements/loyer': { status: 201, body: { reference: 'LOY-REF-1', montant: 50000, statut: 'en_attente' } },
          'GET /paiements/loyer/LOY-REF-1/statut': { status: 200, body: { statut: 'reussi' } },
        },
      },
    })
    await ouvrirActivite(page)
    await payerDepuisActivite(page)

    await expect(page.getByText('Paiement confirmé !')).toBeVisible()
    const suivis = statutAppels(calls)
    expect(suivis.length).toBeGreaterThan(0)
    expect(suivis.every(c => c.path === '/paiements/loyer/LOY-REF-1/statut')).toBe(true)
    expect(calls.some(c => c.path.includes('undefined'))).toBe(false)
    // Clé d'idempotence : une demande rejouée retrouve la transaction et son url_paiement (FE-B-006, backend ed22ff6).
    expect(initiations(calls)[0].headers['idempotency-key']).toMatch(/.{8,}/)
  })

  test('paiement FedaPay : ouvre la page de paiement, puis affiche l’échec annoncé par le suivi', async ({ page }) => {
    await espionnerOuvertures(page)
    const calls = await mockApp(page, {
      role: 'locataire',
      mocks: {
        routes: {
          'GET /loyers/mon-logement': { status: 200, body: logement() },
          'POST /paiements/loyer': { status: 201, body: { reference: 'LOY-REF-2', montant: 50000, statut: 'en_attente', url_paiement: FEDAPAY } },
          'GET /paiements/loyer/LOY-REF-2/statut': { status: 200, body: { statut: 'echoue' } },
        },
      },
    })
    await ouvrirActivite(page)
    await page.getByRole('button', { name: 'Payer ce loyer' }).click()
    await page.getByRole('button', { name: 'FedaPay' }).click()
    await page.getByRole('button', { name: 'Payer', exact: true }).click()

    await expect(page.getByText('Paiement échoué.')).toBeVisible()
    expect(await ouvertures(page)).toEqual([FEDAPAY])
    expect(statutAppels(calls).every(c => c.path === '/paiements/loyer/LOY-REF-2/statut')).toBe(true)
  })

  test('un double clic sur « Payer » n’ouvre qu’un seul paiement', async ({ page }) => {
    const calls = await mockApp(page, {
      role: 'locataire',
      mocks: {
        routes: {
          'GET /loyers/mon-logement': { status: 200, body: logement() },
          'POST /paiements/loyer': { status: 201, delayMs: 800, body: { reference: 'LOY-REF-3', montant: 50000, statut: 'en_attente' } },
          'GET /paiements/loyer/LOY-REF-3/statut': { status: 200, body: { statut: 'en_attente' } },
        },
      },
    })
    await ouvrirActivite(page)
    await page.getByRole('button', { name: 'Payer ce loyer' }).click()
    await page.getByLabel('Numéro Mobile Money').fill(TEL)
    await page.getByRole('button', { name: 'Payer', exact: true }).dblclick()

    await expect(page.getByText('Validez sur votre téléphone…')).toBeVisible()
    expect(initiations(calls)).toHaveLength(1)
  })

  test('une initiation refusée affiche le message de l’API et permet de réessayer', async ({ page }) => {
    await mockApp(page, {
      role: 'locataire',
      mocks: {
        routes: {
          'GET /loyers/mon-logement': { status: 200, body: logement() },
          'POST /paiements/loyer': { status: 409, body: { message: 'Ce loyer est déjà payé' } },
        },
      },
    })
    await ouvrirActivite(page)
    await payerDepuisActivite(page)

    await expect(page.getByText('Ce loyer est déjà payé')).toBeVisible()
    await page.getByRole('button', { name: 'Réessayer' }).click()
    await expect(page.getByRole('button', { name: 'Payer', exact: true })).toBeEnabled()
  })

  test('une réponse sans référence n’envoie aucun suivi vers /undefined/statut', async ({ page }) => {
    const calls = await mockApp(page, {
      role: 'locataire',
      mocks: {
        routes: {
          'GET /loyers/mon-logement': { status: 200, body: logement() },
          'POST /paiements/loyer': { status: 201, body: { montant: 50000, statut: 'en_attente' } },
        },
      },
    })
    await ouvrirActivite(page)
    await payerDepuisActivite(page)

    await expect(page.getByText(/Référence de paiement manquante/)).toBeVisible()
    expect(statutAppels(calls)).toHaveLength(0)
  })

  test('la réconciliation silencieuse recharge le logement quand le backend répond { repare: true }', async ({ page }) => {
    const paye = { mois: iso(-30), created_at: iso(-1), date_paiement: iso(-1), montant: 50000, transaction_id: 5 }
    await mockApp(page, {
      role: 'locataire',
      mocks: {
        routes: {
          'GET /loyers/mon-logement': (_req, appels) =>
            appels.some(c => c.path === '/paiements/loyer/11/repair')
              ? { status: 200, body: logement({ loyers_en_attente: [], historique_loyers: [paye] }) }
              : { status: 200, body: logement() },
          'POST /paiements/loyer/11/repair': { status: 201, body: { repare: true, statut: 'reussi' } },
        },
      },
    })
    await ouvrirActivite(page)

    await expect(page.getByText('Historique (1)')).toBeVisible()
  })
})

test.describe('Paiement du loyer : onglet Logement', () => {
  test('suit chaque loyer avec sa référence et recharge le logement après le succès', async ({ page }) => {
    const calls = await mockApp(page, {
      role: 'locataire',
      mocks: {
        routes: {
          'GET /loyers/mon-logement': { status: 200, body: logement() },
          'POST /paiements/loyer': { status: 201, body: { reference: 'LOY-REF-4', montant: 50000, statut: 'en_attente' } },
          'GET /paiements/loyer/LOY-REF-4/statut': { status: 200, body: { statut: 'reussi' } },
        },
      },
    })
    await payerDepuisLogement(page)

    await expect.poll(() => statutAppels(calls).length).toBeGreaterThan(0)
    expect(statutAppels(calls).every(c => c.path === '/paiements/loyer/LOY-REF-4/statut')).toBe(true)
    expect(calls.some(c => c.path.includes('undefined'))).toBe(false)
    await expect.poll(() => calls.filter(c => c.path === '/loyers/mon-logement').length).toBeGreaterThan(1)
    expect(initiations(calls)[0].headers['idempotency-key']).toMatch(/.{8,}/)
  })

  test('une réponse sans référence affiche une erreur au lieu de suivre /undefined/statut', async ({ page }) => {
    const calls = await mockApp(page, {
      role: 'locataire',
      mocks: {
        routes: {
          'GET /loyers/mon-logement': { status: 200, body: logement() },
          'POST /paiements/loyer': { status: 201, body: { montant: 50000, statut: 'en_attente' } },
        },
      },
    })
    await payerDepuisLogement(page)

    await expect(page.getByText(/Référence de paiement manquante/)).toBeVisible()
    expect(statutAppels(calls)).toHaveLength(0)
  })
})

test.describe('Alertes du locataire : lecture', () => {
  const alertes = {
    status: 200,
    body: { data: [
      { id: 1, type: 'info', titre: 'Loyer reçu', lu: true, created_at: iso(-2) },
      { id: 2, type: 'info', titre: 'Nouvelle quittance', lu: false, created_at: iso(-1) },
      { id: 3, type: 'info', titre: 'Rappel d’échéance', lu: false, created_at: iso(-1) },
      { id: 4, type: 'info', titre: 'Alerte propriétaire', lu: false, target_role: 'proprietaire', created_at: iso(-1) },
    ] },
  }
  const ouvrirAlertes = async (page: Page) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/locataire')
    await page.locator('aside nav').getByRole('button', { name: 'Alertes' }).click()
  }
  const alerte = (page: Page, titre: string) => page.getByTestId('alerte').filter({ hasText: titre })
  const lectures = (calls: ApiCall[]) => calls.filter(c => c.method === 'PATCH' && c.path.startsWith('/alertes/'))

  test('ouvrir une alerte la marque lue tout de suite et prévient le serveur', async ({ page }) => {
    const calls = await mockApp(page, { role: 'locataire', mocks: { alertes, routes: { 'PATCH /alertes/2/lire': { status: 200, body: { message: 'ok' } } } } })
    await ouvrirAlertes(page)
    await expect(alerte(page, 'Nouvelle quittance')).toHaveAttribute('data-lu', 'false')
    await alerte(page, 'Nouvelle quittance').click()

    await expect(alerte(page, 'Nouvelle quittance')).toHaveAttribute('data-lu', 'true')
    await expect.poll(() => lectures(calls).map(c => c.path)).toEqual(['/alertes/2/lire'])
    await expect(alerte(page, 'Rappel d’échéance')).toHaveAttribute('data-lu', 'false')
  })

  test('l’onglet n’affiche que les alertes du locataire, pas celles d’un autre espace', async ({ page }) => {
    await mockApp(page, { role: 'locataire', mocks: { alertes } })
    await ouvrirAlertes(page)

    await expect(alerte(page, 'Nouvelle quittance')).toBeVisible()
    await expect(alerte(page, 'Alerte propriétaire')).toHaveCount(0)
  })

  test('« Tout marquer comme lu » marque les alertes du locataire et prévient le serveur une seule fois', async ({ page }) => {
    const calls = await mockApp(page, { role: 'locataire', mocks: { alertes, routes: { 'PATCH /alertes/lire-tout': { status: 200, body: { message: 'ok' } } } } })
    await ouvrirAlertes(page)
    await page.getByRole('button', { name: 'Tout marquer comme lu' }).click()

    await expect(alerte(page, 'Nouvelle quittance')).toHaveAttribute('data-lu', 'true')
    await expect(alerte(page, 'Rappel d’échéance')).toHaveAttribute('data-lu', 'true')
    await expect.poll(() => lectures(calls).map(c => c.path)).toEqual(['/alertes/lire-tout'])
  })

  test('sans alerte non lue du locataire, aucun bouton « Tout marquer comme lu »', async ({ page }) => {
    await mockApp(page, { role: 'locataire', mocks: { alertes: { status: 200, body: { data: [{ id: 1, type: 'info', titre: 'Loyer reçu', lu: true, created_at: iso(-2) }] } } } })
    await ouvrirAlertes(page)

    await expect(alerte(page, 'Loyer reçu')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tout marquer comme lu' })).toHaveCount(0)
  })

  test('un marquage refusé par le serveur resynchronise la liste (l’alerte redevient non lue)', async ({ page }) => {
    await mockApp(page, { role: 'locataire', mocks: { alertes, routes: { 'PATCH /alertes/2/lire': PANNE } } })
    await ouvrirAlertes(page)
    await alerte(page, 'Nouvelle quittance').click()

    await expect(alerte(page, 'Nouvelle quittance')).toHaveAttribute('data-lu', 'false')
  })

  test('si la resynchronisation échoue aussi, la liste reste affichée avec un bandeau « Réessayer »', async ({ page }) => {
    await mockApp(page, {
      role: 'locataire',
      mocks: {
        alertes: (_req, appels) => (appels.filter(c => c.method === 'GET' && c.path === '/alertes').length === 1 ? alertes : PANNE),
        routes: { 'PATCH /alertes/2/lire': PANNE },
      },
    })
    await ouvrirAlertes(page)
    await alerte(page, 'Nouvelle quittance').click()

    await expect(page.getByText(/Actualisation impossible/)).toBeVisible()
    await expect(alerte(page, 'Loyer reçu')).toBeVisible()
  })

  test('panne au chargement : erreur et « Réessayer », jamais « Aucune alerte »', async ({ page }) => {
    let enPanne = true
    await mockApp(page, { role: 'locataire', mocks: { alertes: () => (enPanne ? PANNE : alertes) } })
    await ouvrirAlertes(page)

    await expect(page.getByText('Impossible de charger vos alertes')).toBeVisible()
    await expect(page.getByText('Aucune alerte')).toHaveCount(0)
    enPanne = false
    await page.getByRole('button', { name: 'Réessayer' }).click()
    await expect(alerte(page, 'Loyer reçu')).toBeVisible()
  })
})

test.describe('Date retenue de la visite en cours (profil)', () => {
  test('affiche la date de la contre-proposition, pas un champ creneau.debut inexistant', async ({ page }) => {
    const contre = iso(4)
    await mockApp(page, { mocks: { visites: { status: 200, body: { data: [visite({ statut: 'confirmee', date_contre_proposee: contre })] } } } })
    await page.goto('/profil')

    const attendu = new Date(contre).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    await expect(page.getByText(`· ${attendu}`)).toBeVisible()
  })
})

test.describe('Démarcheur : actions sur les réservations', () => {
  const ouvrirReservations = async (page: Page) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/demarcheur')
    await page.locator('aside nav').getByRole('button', { name: 'Réservations' }).click()
  }
  const attente = { status: 200, body: { data: [visite({ id: 7, statut: 'en_attente', client: { id: 5, prenom: 'Awa' } })] } }

  test('panne au chargement : erreur et « Réessayer », jamais « Aucune réservation »', async ({ page }) => {
    let enPanne = true
    await mockApp(page, { role: 'demarcheur', mocks: { visites: () => (enPanne ? PANNE : attente) } })
    await ouvrirReservations(page)

    await expect(page.getByText('Impossible de charger vos réservations')).toBeVisible()
    await expect(page.getByText('Aucune réservation')).toHaveCount(0)
    enPanne = false
    await page.getByRole('button', { name: 'Réessayer' }).click()
    await expect(page.getByRole('button', { name: 'Confirmer' })).toBeVisible()
  })

  test('une confirmation refusée affiche le message de l’API et le bouton redevient actif', async ({ page }) => {
    await mockApp(page, { role: 'demarcheur', mocks: { visites: attente, routes: { 'PATCH /visites/7/confirmer': { status: 400, body: { message: 'Cette visite est déjà confirmée.' } } } } })
    await ouvrirReservations(page)
    await page.getByRole('button', { name: 'Confirmer' }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'Cette visite est déjà confirmée.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirmer' })).toBeEnabled()
  })

  test('« Marquer effectuée » en panne affiche un message de repli français', async ({ page }) => {
    await mockApp(page, {
      role: 'demarcheur',
      mocks: { visites: { status: 200, body: { data: [visite({ id: 7, statut: 'confirmee' })] } }, routes: { 'PATCH /visites/7/effectuee': PANNE } },
    })
    await ouvrirReservations(page)
    await page.getByRole('button', { name: 'Marquer effectuée' }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'momentanément indisponible' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Marquer effectuée' })).toBeEnabled()
  })

  test('l’ouverture du chat en panne affiche un message au lieu d’échouer en silence', async ({ page }) => {
    await mockApp(page, { role: 'demarcheur', mocks: { visites: attente, conversations: PANNE } })
    await ouvrirReservations(page)
    await page.getByRole('button', { name: 'Chat' }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'momentanément indisponible' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Chat' })).toBeEnabled()
  })
})

test.describe('Mes visites : reproposition d’une date', () => {
  test('une reproposition refusée affiche l’erreur et garde le formulaire ouvert', async ({ page }) => {
    await mockApp(page, {
      mocks: {
        visites: { status: 200, body: { data: [visite({ id: 7, statut: 'contre_proposee', date_contre_proposee: iso(4) })] } },
        routes: { 'PATCH /visites/7/re-proposer': { status: 400, body: { message: 'Cette date est déjà réservée.' } } },
      },
    })
    await page.goto('/mes-visites')
    await page.getByRole('button', { name: 'Autre date' }).click()
    await page.locator('input[type="date"]').fill('2030-05-17')
    await page.locator('input[type="time"]').fill('09:30')
    await page.getByRole('button', { name: 'Envoyer' }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'Cette date est déjà réservée.' })).toBeVisible()
    await expect(page.getByText('Proposer une autre date')).toBeVisible()
  })
})
