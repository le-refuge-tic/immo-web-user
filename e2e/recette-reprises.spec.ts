import { expect, test } from '@playwright/test'
import { BIEN, mockApp } from './support/mockApi'

// Correctif de la branche recette/integration (Godpeace Ks) repris dans la version découpée :
// B9 (libellé de suppression par l'administrateur). C1 (documents CIP/IFU) a disparu avec la vérification d'identité.

test('B9 : un message supprimé par l’administrateur est signalé comme tel', async ({ page }) => {
  const now = new Date().toISOString()
  await mockApp(page, {
    mocks: {
      conversations: {
        status: 200,
        body: {
          data: [{
            id: 55, bien: BIEN, bien_id: 1, dernier_message: null, unread_count: 0,
            participants: [{ id: 42, prenom: 'Awa', nom: 'Test' }, { id: 3, prenom: 'Koffi', nom: 'A', role: 'proprietaire' }],
          }],
        },
      },
      messages: {
        status: 200,
        body: {
          data: [
            { id: 1, sender_id: 3, contenu: 'x', type: 'text', created_at: now, supprime_pour_tous: true, supprime_par_admin: true },
            { id: 2, sender_id: 3, contenu: 'y', type: 'text', created_at: now, supprime_pour_tous: true, supprime_par_admin: false },
          ],
        },
      },
    },
  })
  await page.goto('/conversations/55')

  await expect(page.getByText("Ce message a été supprimé par l'administrateur").locator('visible=true').first()).toBeVisible()
  await expect(page.getByText('Ce message a été supprimé', { exact: true }).locator('visible=true').first()).toBeVisible()
})
