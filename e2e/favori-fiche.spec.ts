import { expect, test, type Page } from '@playwright/test'
import { BIEN, mockApp, type MockResponse } from './support/mockApi'

// Lot 12 — bouton Favori sur la fiche d'un bien, synchronisé avec la liste et la page Favoris.

/** Serveur de favoris simulé : le bien 1 y est ou non, et chaque bascule change l'état renvoyé. */
function serveurFavoris(initial: boolean) {
  let favori = initial
  return {
    routes: {
      'GET /biens/favoris': (): MockResponse => ({ status: 200, body: { data: favori ? [BIEN] : [] } }),
      'POST /biens/1/favori': (): MockResponse => { favori = !favori; return { status: 200, body: { isFavori: favori } } },
    },
  }
}

// Format téléphone par défaut (config e2e) : un bouton sur la photo et un dans la barre du bas.
const bouton = (page: Page, nom: string) => page.getByRole('button', { name: nom }).first()

test.describe('favori sur la fiche', () => {
  test('ajout puis retrait : bouton, toasts et appels serveur', async ({ page }) => {
    const calls = await mockApp(page, { mocks: { bienDetail: { status: 200, body: BIEN }, routes: serveurFavoris(false).routes } })
    await page.goto('/biens/1')

    const ajouter = bouton(page, 'Ajouter aux favoris')
    await expect(ajouter).toBeVisible()
    await ajouter.click()
    await expect(page.getByText('Ajouté aux favoris')).toBeVisible()
    await expect(bouton(page, 'Retirer des favoris')).toHaveAttribute('aria-pressed', 'true')

    await bouton(page, 'Retirer des favoris').click()
    await expect(page.getByText('Retiré des favoris')).toBeVisible()
    await expect(bouton(page, 'Ajouter aux favoris')).toHaveAttribute('aria-pressed', 'false')
    expect(calls.filter(c => c.method === 'POST' && c.path === '/biens/1/favori')).toHaveLength(2)
  })

  test('un bien déjà en favori s’affiche comme tel', async ({ page }) => {
    await mockApp(page, { mocks: { bienDetail: { status: 200, body: BIEN }, routes: serveurFavoris(true).routes } })
    await page.goto('/biens/1')
    await expect(bouton(page, 'Retirer des favoris')).toBeVisible()
  })

  test('hors connexion : mène à la connexion et mémorise le retour sur la fiche', async ({ page }) => {
    await mockApp(page, { loggedIn: false, mocks: { bienDetail: { status: 200, body: BIEN } } })
    await page.goto('/biens/1')
    await bouton(page, 'Ajouter aux favoris').click()

    await expect(page).toHaveURL(/\/login/)
    expect(await page.evaluate(() => sessionStorage.getItem('post_login_redirect'))).toBe('/biens/1')
  })

  test('échec serveur : message d’erreur, le bouton garde son état', async ({ page }) => {
    await mockApp(page, {
      mocks: {
        bienDetail: { status: 200, body: BIEN },
        routes: { 'GET /biens/favoris': { status: 200, body: { data: [] } }, 'POST /biens/1/favori': { status: 500, body: { message: 'boom' } } },
      },
    })
    await page.goto('/biens/1')
    await bouton(page, 'Ajouter aux favoris').click()
    await expect(page.getByText('Favori non enregistré. Réessayez.')).toBeVisible()
    await expect(bouton(page, 'Ajouter aux favoris')).toHaveAttribute('aria-pressed', 'false')
  })

  test('le propriétaire du bien n’a pas de bouton favori', async ({ page }) => {
    await mockApp(page, { role: 'proprietaire', mocks: { bienDetail: { status: 200, body: { ...BIEN, user_id: 42 } } } })
    await page.goto('/biens/1')
    await expect(page.getByRole('heading', { level: 1 }).or(page.getByText('Modifier le bien').first()).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /favoris/ })).toHaveCount(0)
  })

  test.describe('téléphone', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('le bouton est sur la photo et dans la barre du bas', async ({ page }) => {
      await mockApp(page, { mocks: { bienDetail: { status: 200, body: BIEN }, routes: serveurFavoris(false).routes } })
      await page.goto('/biens/1')
      const boutons = page.getByRole('button', { name: 'Ajouter aux favoris' })
      await expect(boutons).toHaveCount(2)
      await boutons.last().click()
      await expect(page.getByText('Ajouté aux favoris')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Retirer des favoris' })).toHaveCount(2)
    })
  })
})

test.describe('favori sur la fiche — écran large', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('un seul bouton, sur la photo', async ({ page }) => {
    await mockApp(page, { mocks: { bienDetail: { status: 200, body: BIEN }, routes: serveurFavoris(false).routes } })
    await page.goto('/biens/1')
    const boutons = page.getByRole('button', { name: 'Ajouter aux favoris' })
    await expect(boutons).toHaveCount(1)
    await boutons.click()
    await expect(page.getByText('Ajouté aux favoris')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Retirer des favoris' })).toHaveCount(1)
  })
})
