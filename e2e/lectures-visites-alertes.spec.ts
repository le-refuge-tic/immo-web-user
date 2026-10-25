import { expect, test } from '@playwright/test'
import { mockApp, visite } from './support/mockApi'

// Lectures corrigées : alertes lues, dates retenues des visites, bouton d'intégration,
// contre-proposition du démarcheur via la couche d'API (intercepteur axios).

const iso = (jours: number) => new Date(Date.now() + jours * 86_400_000).toISOString()
const fmt = (valeur: string) => {
  const d = new Date(valeur)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} à ${p(d.getHours())}h${p(d.getMinutes())}`
}

test.describe('Alertes du locataire', () => {
  test('une alerte lue (lu: true) n’est plus affichée comme non lue', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await mockApp(page, {
      role: 'locataire',
      mocks: {
        alertes: {
          status: 200,
          body: { data: [
            { id: 1, type: 'info', titre: 'Loyer reçu', lu: true, created_at: iso(-2) },
            { id: 2, type: 'info', titre: 'Nouvelle quittance', lu: false, created_at: iso(-1) },
          ] },
        },
      },
    })
    await page.goto('/locataire')
    await page.locator('aside nav').getByRole('button', { name: 'Alertes' }).click()

    const lue = page.getByTestId('alerte').filter({ hasText: 'Loyer reçu' })
    const nonLue = page.getByTestId('alerte').filter({ hasText: 'Nouvelle quittance' })
    await expect(lue).toHaveAttribute('data-lu', 'true')
    await expect(lue.locator('p').first()).not.toHaveClass(/font-semibold/)
    await expect(nonLue).toHaveAttribute('data-lu', 'false')
    await expect(nonLue.locator('p').first()).toHaveClass(/font-semibold/)
  })
})

test.describe('Mes visites : date retenue et paiement d’intégration', () => {
  test('une contre-proposition acceptée affiche la date du gestionnaire, pas la date initiale', async ({ page }) => {
    const souhaitee = iso(2)
    const contre = iso(4)
    await mockApp(page, {
      mocks: { visites: { status: 200, body: { data: [visite({ date_souhaitee: souhaitee, date_contre_proposee: contre })] } } },
    })
    await page.goto('/mes-visites')

    await expect(page.getByText(`Prévue : ${fmt(contre)}`)).toBeVisible()
    await expect(page.getByText(fmt(souhaitee))).toHaveCount(0)
  })

  test('sans bien rattaché, aucun bouton « Payer l’intégration » (pas de /paiement-integration/undefined)', async ({ page }) => {
    await mockApp(page, {
      mocks: {
        visites: {
          status: 200,
          body: { data: [
            visite({ id: 8, statut: 'effectuee', bien: null, client_decision_integration: true, paiement_integration_effectue: false }),
            visite({ id: 9, statut: 'effectuee', client_decision_integration: true, paiement_integration_effectue: false }),
          ] },
        },
      },
    })
    await page.goto('/mes-visites')

    // Un seul bouton : celui de la visite dont le bien est connu.
    await expect(page.getByRole('button', { name: /Payer l.intégration/ })).toHaveCount(1)
  })
})

test.describe('Démarcheur : contre-proposition de créneau', () => {
  const ouvrirFormulaire = async (page: import('@playwright/test').Page) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/demarcheur')
    await page.locator('aside nav').getByRole('button', { name: 'Réservations' }).click()
    await page.getByRole('button', { name: 'Autre créneau' }).click()
    await page.locator('input[type="date"]').fill('2030-05-17')
    await page.locator('input[type="time"]').fill('09:30')
  }
  const visites = { status: 200, body: { data: [visite({ id: 7, statut: 'en_attente' })] } }
  const patchs = (calls: Awaited<ReturnType<typeof mockApp>>) =>
    calls.filter(c => c.method === 'PATCH' && c.path === '/visites/7/contre-proposer')

  test('envoie la proposition avec le jeton et le même corps qu’avant', async ({ page }) => {
    const calls = await mockApp(page, {
      role: 'demarcheur',
      mocks: { visites, contreProposer: { status: 200, body: { id: 7, statut: 'contre_proposee' } } },
    })
    await ouvrirFormulaire(page)
    await page.getByRole('button', { name: 'Envoyer' }).click()

    await expect(page.getByText('Proposer un autre créneau')).toHaveCount(0)
    const [appel] = patchs(calls)
    expect(JSON.parse(appel.body ?? '{}')).toEqual({ date_proposee: '2030-05-17T09:30:00' })
    expect(appel.headers.authorization).toBe('Bearer a.e30.b')
  })

  test('rafraîchit le jeton sur 401 puis rejoue la requête', async ({ page }) => {
    const calls = await mockApp(page, {
      role: 'demarcheur',
      mocks: {
        visites,
        refresh: { status: 200, body: { access_token: 'n.e30.t', refresh_token: 'refresh-2' } },
        contreProposer: (_req, appels) =>
          appels.filter(c => c.path === '/visites/7/contre-proposer').length === 1
            ? { status: 401, body: { message: 'Unauthorized' } }
            : { status: 200, body: { id: 7, statut: 'contre_proposee' } },
      },
    })
    await ouvrirFormulaire(page)
    await page.getByRole('button', { name: 'Envoyer' }).click()

    await expect(page.getByText('Proposer un autre créneau')).toHaveCount(0)
    const envois = patchs(calls)
    expect(envois).toHaveLength(2)
    expect(envois[1].headers.authorization).toBe('Bearer n.e30.t')
  })

  test('affiche le message de l’API en cas de refus et garde le formulaire ouvert', async ({ page }) => {
    await mockApp(page, {
      role: 'demarcheur',
      mocks: { visites, contreProposer: { status: 400, body: { message: 'Cette date est déjà réservée.' } } },
    })
    await ouvrirFormulaire(page)
    await page.getByRole('button', { name: 'Envoyer' }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'Cette date est déjà réservée.' })).toBeVisible()
    await expect(page.getByText('Proposer un autre créneau')).toBeVisible()
  })

  test('affiche un message de repli sur une panne serveur', async ({ page }) => {
    await mockApp(page, {
      role: 'demarcheur',
      mocks: { visites, contreProposer: { status: 500, body: { message: 'boom' } } },
    })
    await ouvrirFormulaire(page)
    await page.getByRole('button', { name: 'Envoyer' }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'momentanément indisponible' })).toBeVisible()
  })
})
