import { expect, test } from '@playwright/test'
import { mockApp } from './support/mockApi'

// P2 — Inscription et session : expiration de session en pleine navigation (FE-B-002).

test.describe('P2 session', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`une session expirée renvoie vers /login avec un message et mémorise la page (${theme})`, async ({ page }) => {
      await mockApp(page, {
        theme,
        mocks: {
          visites: { status: 401, body: { message: 'Unauthorized' } },
          refresh: { status: 401, body: { message: 'expired' } },
        },
      })
      await page.goto('/mes-visites')

      await page.waitForURL('**/login')
      await expect(page.getByRole('heading', { name: 'Session expirée' })).toBeVisible()
      expect(await page.evaluate(() => sessionStorage.getItem('post_login_redirect'))).toBe('/mes-visites')
    })
  }

  test('un visiteur non connecté qui veut réserver est renvoyé vers la connexion', async ({ page }) => {
    await mockApp(page, { loggedIn: false })
    await page.goto('/reservation/1')

    await page.waitForURL('**/login')
  })
})
