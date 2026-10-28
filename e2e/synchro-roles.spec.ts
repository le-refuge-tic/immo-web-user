import { expect, test, type Page } from '@playwright/test'
import { mockApp, userOf, type MockResponse } from './support/mockApi'

// BUG-05 du cahier des rôles (FE-A-004) : quand le jeton est rafraîchi (401 puis /auth/refresh),
// les rôles renvoyés par le serveur sont repris par l'interface tout de suite, sans recharger la page.

/** Session prospect dont le premier appel aux favoris expire ; le rafraîchissement renvoie `utilisateur`. */
async function ouvrirAvecRafraichissement(page: Page, utilisateur: object) {
  await page.setViewportSize({ width: 1440, height: 900 })
  let favorisAppels = 0
  await mockApp(page, {
    role: 'prospect',
    mocks: {
      refresh: { status: 200, body: { access_token: 'n.e30.t', refresh_token: 'refresh-2', user: utilisateur } },
      routes: {
        // Premier appel : jeton expiré ; le suivant (rejoué après le rafraîchissement) réussit.
        'GET /biens/favoris': (): MockResponse => (++favorisAppels === 1
          ? { status: 401, body: { message: 'Unauthorized' } }
          : { status: 200, body: { data: [] } }),
      },
    },
  })
  await page.goto('/')
  await expect.poll(() => favorisAppels).toBeGreaterThanOrEqual(2)
  await page.getByRole('button', { name: 'Menu utilisateur' }).click()
}

test('un rafraîchissement du jeton qui ajoute un rôle met à jour le menu des espaces', async ({ page }) => {
  await ouvrirAvecRafraichissement(page, { ...userOf('prospect'), roles_actifs: ['prospect', 'proprietaire'] })
  await expect(page.getByRole('menuitem', { name: /Espace Propriétaire/ })).toBeVisible()
})

test('les rôles d’un autre compte (connexion dans un autre onglet) ne sont pas repris', async ({ page }) => {
  await ouvrirAvecRafraichissement(page, { ...userOf('prospect'), id: 99, roles_actifs: ['prospect', 'proprietaire'] })
  await expect(page.getByRole('menuitem', { name: 'Mon profil' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: /Espace Propriétaire/ })).toHaveCount(0)
})
