import { expect, test, type Page } from '@playwright/test'
import { BIEN, mockApp } from './support/mockApi'

// Créneau de visite expiré : une proposition restée sans réponse après son heure est affichée
// « Expiré » (sans attendre la tâche du serveur) et invite à proposer un nouvel horaire ; la
// notification « creneau_expire » ouvre la conversation.

const J = 86400000
const iso = (d: number) => new Date(Date.now() + d * J).toISOString()
const conv = {
  id: 55, bien: BIEN, bien_id: 1, dernier_message: null, unread_count: 0,
  participants: [{ id: 42, prenom: 'Awa', nom: 'Test' }, { id: 3, prenom: 'Koffi', nom: 'A', role: 'proprietaire' }],
}
// La messagerie rend deux mises en page (téléphone / bureau) dont une est masquée : on ne compte que le visible.
const visibles = (l: ReturnType<Page['getByText']>) => l.locator('visible=true')
const slot = (id: number, proposed_at: string, status = 'pending') =>
  ({ id, sender_id: 3, type: 'slot_proposal', contenu: 'Créneau proposé', metadata: { status, proposed_at }, created_at: iso(-3) })

test('un créneau passé sans réponse est « Expiré » et propose un nouvel horaire', async ({ page }) => {
  await mockApp(page, {
    mocks: {
      conversations: { status: 200, body: { data: [conv] } },
      messages: { status: 200, body: { data: [slot(10, iso(-2))] } },
    },
  })
  await page.goto('/conversations/55')

  await expect(visibles(page.getByText('Expiré — sans réponse à temps'))).toHaveCount(1)
  await expect(visibles(page.getByRole('button', { name: 'Confirmer' }))).toHaveCount(0)
  await visibles(page.getByRole('button', { name: 'Proposer un nouvel horaire' })).click()
  // La saisie d'un nouveau créneau s'ouvre.
  await expect(page.locator('input[type="date"], input[type="datetime-local"]').first()).toBeVisible()
})

test('seule la dernière proposition expirée invite à proposer un nouvel horaire', async ({ page }) => {
  await mockApp(page, {
    mocks: {
      conversations: { status: 200, body: { data: [conv] } },
      messages: { status: 200, body: { data: [slot(10, iso(-4)), slot(11, iso(-2))] } },
    },
  })
  await page.goto('/conversations/55')

  await expect(visibles(page.getByText('Expiré — sans réponse à temps'))).toHaveCount(2)
  await expect(visibles(page.getByRole('button', { name: 'Proposer un nouvel horaire' }))).toHaveCount(1)
})

test('un créneau futur en attente reste proposé, sans mention d’expiration', async ({ page }) => {
  await mockApp(page, {
    mocks: {
      conversations: { status: 200, body: { data: [conv] } },
      messages: { status: 200, body: { data: [slot(10, iso(2))] } },
    },
  })
  await page.goto('/conversations/55')

  await expect(page.getByText('Créneau proposé').first()).toBeVisible()
  await expect(visibles(page.getByText('Expiré — sans réponse à temps'))).toHaveCount(0)
})

test('la notification « créneau expiré » ouvre la conversation', async ({ page }) => {
  await mockApp(page, {
    mocks: {
      conversations: { status: 200, body: { data: [conv] } },
      messages: { status: 200, body: { data: [slot(10, iso(-2))] } },
      alertes: {
        status: 200,
        body: { data: [{ id: 9, type: 'creneau_expire', titre: 'Créneau de visite expiré', message: 'Proposez un nouvel horaire', lu: false, created_at: iso(0), meta: { conversation_id: 55, message_id: 10 } }] },
      },
    },
  })
  await page.goto('/notifications')
  await page.getByText('Créneau de visite expiré').first().click()

  await expect(page).toHaveURL(/\/conversations\/55$/)
})
