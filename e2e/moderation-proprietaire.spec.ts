import { expect, test, type Page } from '@playwright/test'
import { mockApp } from './support/mockApi'

// Lot 7 — le propriétaire voit pourquoi son annonce n'est pas publiée, et les décisions motivées.

const bien = (o: Record<string, unknown>) => ({
  id: 21, type: 'appart_vide', transaction: 'location', prix: '45000.00', statut: 'disponible',
  description: 'Chambre-salon', localisation: { ville: 'Cotonou', quartier: 'Akpakpa' },
  amenites: { sous_type: 'chambre_salon' }, photos: [], pieces: [], ...o,
})

async function ouvrirMesBiens(page: Page, biens: unknown[]) {
  await mockApp(page, { role: 'proprietaire', mocks: { routes: { 'GET /biens/mes-biens': { status: 200, body: { data: biens } } } } })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/proprietaire')
  await page.getByRole('button', { name: 'Mes biens', exact: true }).first().click()
}

test('en attente avec trop peu de photos : ce qui manque est dit (photos des pièces comprises)', async ({ page }) => {
  await ouvrirMesBiens(page, [
    bien({ statut_moderation: 'en_attente', photos: [{ id: 1, url: 'https://x/1.jpg' }] }),
    bien({ id: 22, statut_moderation: 'en_attente', pieces: [{ id: 1, photos: [{ id: 2, url: 'https://x/2.jpg' }, { id: 3, url: 'https://x/3.jpg' }] }] }),
  ])
  await expect(page.getByText('À compléter pour être publié : au moins 2 photos (1 actuellement).')).toHaveCount(1)
})

test('publication retirée et publication sous conditions : le motif est affiché', async ({ page }) => {
  await ouvrirMesBiens(page, [
    bien({ statut_moderation: 'en_attente', motif_refus: 'Bien déjà loué.', photos: [{ id: 1, url: 'https://x/1.jpg' }, { id: 2, url: 'https://x/2.jpg' }] }),
    bien({ id: 22, statut_moderation: 'conditionnel', conditions_speciales: 'Fournir le titre foncier', photos: [{ id: 3, url: 'https://x/3.jpg' }, { id: 4, url: 'https://x/4.jpg' }] }),
  ])
  await expect(page.getByText('Publication retirée : Bien déjà loué.')).toBeVisible()
  await expect(page.getByText('Publié sous conditions : Fournir le titre foncier')).toBeVisible()
})
