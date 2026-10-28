import { expect, test } from '@playwright/test'
import { BIEN, mockApp, userOf } from './support/mockApi'

// Correctifs de la branche recette/integration (Godpeace Ks) repris dans la version découpée :
// C1 (documents en lecture seule tant qu'ils sont en attente ou validés) et B9 (libellé de
// suppression par l'administrateur).

test('C1 : documents validés, la modale est en lecture seule (aucun renvoi possible)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await mockApp(page, {
    role: 'proprietaire',
    mocks: {
      routes: {
        'GET /users/me': {
          status: 200,
          body: { ...userOf('proprietaire'), statut_verification_documents: 'valide', cip_url: 'cip/x.webp', ifu_url: null },
        },
      },
    },
  })
  await page.goto('/proprietaire', { waitUntil: 'load' })
  await page.evaluate(() => history.replaceState({ usr: { tab: 'profil' }, key: 'e2e', idx: 0 }, '', location.pathname))
  await page.reload()
  await page.getByRole('button', { name: /Vérification CIP \/ IFU/ }).first().click()

  const dialog = page.getByRole('dialog', { name: "Vérification d'identité" })
  await expect(dialog.getByRole('status')).toContainText('Identité vérifiée')
  await expect(dialog.getByText("CIP (Carte d'Identité Personnelle)", { exact: true })).toBeVisible()
  await expect(dialog.getByText('IFU (Identifiant Fiscal Unique)', { exact: true })).toHaveCount(0)
  await expect(dialog.locator('input[type="file"]')).toHaveCount(0)
})

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
