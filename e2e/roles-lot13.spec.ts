import { expect, test } from '@playwright/test'
import { mockApp } from './support/mockApi'

// Lot 13 — rôles : le démarcheur est abandonné, le propriétaire peut activer Prospect.

test.describe('Rôles', () => {
  test('un ancien lien /demarcheur ramène à l’accueil ; le rôle n’apparaît nulle part', async ({ page }) => {
    // Compte démarcheur existant (rien n'est modifié en base) : il retombe sur l'espace client.
    await mockApp(page, { role: 'demarcheur' })
    await page.goto('/demarcheur')
    await expect(page).toHaveURL(/\/$/)
    await page.goto('/mes-roles')
    await expect(page.getByText('Prospect', { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/démarcheur/i)).toHaveCount(0)
  })

  test('propriétaire : Prospect activable, Locataire via un code d’invitation, désactivation confirmée par un dialogue', async ({ page }) => {
    const calls = await mockApp(page, {
      role: 'proprietaire',
      mocks: { routes: { 'POST /users/me/roles/activate': { status: 200, body: { id: 42, roles_actifs: ['proprietaire', 'prospect'] } } } },
    })
    await page.goto('/mes-roles')
    await expect(page.getByText(/démarcheur/i)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Rejoindre un bien' })).toBeVisible()

    await page.getByRole('button', { name: 'Activer ce rôle' }).click()
    await page.getByRole('button', { name: 'Confirmer' }).click()
    await expect(page.getByText(/Rôle "Prospect" activé/)).toBeVisible()
    expect(calls.some(c => c.method === 'POST' && c.path === '/users/me/roles/activate' && JSON.parse(c.body ?? '{}').role === 'prospect')).toBe(true)

    await page.getByRole('button', { name: 'Désactiver' }).click()
    const dialogue = page.getByRole('alertdialog').or(page.getByRole('dialog'))
    await expect(dialogue.getByText('Désactiver l’espace Prospect ?')).toBeVisible()
    await dialogue.getByRole('button', { name: 'Annuler' }).click()
    expect(calls.some(c => c.method === 'DELETE')).toBe(false)
  })
})
