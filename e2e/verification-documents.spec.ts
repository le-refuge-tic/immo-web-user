import { expect, test } from '@playwright/test'
import { mockApp, userOf } from './support/mockApi'

// Vérification des pièces d'identité (CIP/IFU) : l'écran affiche le statut renvoyé par
// GET /users/me (refus avec son motif), puis « en cours de vérification » après un nouvel envoi.

test('propriétaire : refus avec motif, puis « en cours de vérification » après un nouvel envoi', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await mockApp(page, {
    role: 'proprietaire',
    mocks: {
      routes: {
        'GET /users/me': {
          status: 200,
          body: { ...userOf('proprietaire'), statut_verification_documents: 'rejete', motif_rejet_documents: 'photo floue' },
        },
        'POST /users/me/cip': { status: 201, body: { message: 'ok' } },
      },
    },
  })
  await page.goto('/proprietaire', { waitUntil: 'load' })
  await page.evaluate(() => history.replaceState({ usr: { tab: 'profil' }, key: 'e2e', idx: 0 }, '', location.pathname))
  await page.reload()
  await page.getByRole('button', { name: /Vérification CIP \/ IFU/ }).first().click()

  const dialog = page.getByRole('dialog', { name: "Vérification d'identité" })
  await expect(dialog.getByRole('status')).toContainText('Documents refusés')
  await expect(dialog.getByRole('status')).toContainText('Motif : photo floue.')

  await dialog.locator('input[type="file"]').first().setInputFiles({ name: 'cip.png', mimeType: 'image/png', buffer: Buffer.from('x') })
  await dialog.getByRole('button', { name: 'Envoyer' }).click()
  await expect(dialog.getByRole('status')).toContainText('Documents reçus, en cours de vérification')
})
