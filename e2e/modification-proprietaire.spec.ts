import { expect, test } from '@playwright/test'
import { mockApp } from './support/mockApi'

// Lot 5 — le propriétaire modifie sa guesthouse publiée avec le formulaire de création :
// Enregistrer inactif sans changement, sortie confirmée, envoi en validation, photos gérées.

const guesthouse = {
  id: 12, type: 'guesthouse', transaction: 'location', prix: '25000.00', statut: 'disponible',
  statut_moderation: 'approuve', modification_en_attente: null,
  description: 'Villa Awa\n\nCalme, à 5 min de la plage.',
  localisation: { ville: 'Cotonou', quartier: 'Fidjrossè', adresse: 'Rue des Cocotiers' },
  amenites: { proprietaire_info: { prenom: 'Awa', nom: 'Test', telephone: '+2290197000000' } },
  details_guesthouse: {
    prix_nuitee: 25000, caution: 10000, nuitees_min: 1, capacite: 4, nb_chambres: 2,
    lits: [{ type: 'double', nombre: 1 }], nb_salles_bain: 1, garage: false, type_acces_garage: null,
    heure_arrivee: '14:00:00', heure_depart: '11:00:00',
    animaux_autorises: false, fetes_autorisees: false, fumeur_autorise: false,
  },
  equipements_liste: [{ code: 'wifi' }],
  photos: [1, 2, 3, 4, 5].map(i => ({ id: i, url: `https://x/p${i}.webp`, is_cover: i === 1 })),
}

const routes = (extra: Record<string, { status: number; body: unknown }> = {}) => ({
  'GET /biens/12': { status: 200, body: guesthouse },
  'GET /equipements': { status: 200, body: [{ categorie: 'confort', libelle: 'Confort', equipements: [{ code: 'wifi', libelle: 'Wi-Fi' }, { code: 'climatisation', libelle: 'Climatisation' }] }] },
  ...extra,
})

test('guesthouse publiée : rien à enregistrer sans changement, puis envoi en validation', async ({ page }) => {
  const calls = await mockApp(page, {
    role: 'proprietaire',
    mocks: { routes: routes({
      'PATCH /biens/12': { status: 200, body: { ...guesthouse, modification_en_attente: { source: 'proprietaire', soumise_le: '2026-11-16T10:00:00Z' } } },
    }) },
  })
  await page.goto('/proprietaire/biens/12/modifier')
  await expect(page.getByLabel('Nom de la guesthouse')).toHaveValue('Villa Awa')
  await expect(page.getByRole('note').filter({ hasText: 'Ce bien est publié' })).toBeVisible()
  const envoyer = page.getByRole('button', { name: 'Envoyer en validation' })
  await expect(envoyer).toHaveAttribute('aria-disabled', 'true')

  await page.getByRole('button', { name: 'Climatisation' }).click()
  await expect(envoyer).not.toHaveAttribute('aria-disabled', 'true')
  await envoyer.click()

  await expect(page.getByText(/Modification envoyée en validation/)).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'attend la validation' })).toBeVisible()
  const patch = calls.find(c => c.method === 'PATCH' && c.path === '/biens/12')
  expect(JSON.parse(patch?.body ?? '{}')).toMatchObject({
    description: 'Villa Awa\n\nCalme, à 5 min de la plage.',
    details_guesthouse: { prix_nuitee: 25000, capacite: 4 },
    equipements: ['wifi', 'climatisation'],
  })
  // Plus rien à enregistrer après l'envoi.
  await expect(envoyer).toHaveAttribute('aria-disabled', 'true')
})

test('changement non enregistré : « Quitter sans enregistrer ? » avant de partir', async ({ page }) => {
  await mockApp(page, { role: 'proprietaire', mocks: { routes: routes() } })
  await page.goto('/proprietaire/biens/12/modifier')
  await page.getByLabel('Nom de la guesthouse').fill('Villa Awa Plage')
  await page.getByRole('button', { name: 'Retour' }).click()
  const dialogue = page.getByRole('alertdialog')
  await expect(dialogue).toContainText('Quitter sans enregistrer ?')
  await dialogue.getByRole('button', { name: 'Annuler' }).click()
  await expect(page).toHaveURL(/\/proprietaire\/biens\/12\/modifier$/)
  await expect(page.getByLabel('Nom de la guesthouse')).toHaveValue('Villa Awa Plage')
})

test('photos : principale changée, suppression confirmée, refus de l’API affiché', async ({ page }) => {
  const calls = await mockApp(page, {
    role: 'proprietaire',
    mocks: { routes: routes({
      'PATCH /biens/12/photos/3/cover': { status: 200, body: { message: 'Photo principale définie' } },
      'DELETE /biens/12/photos/2': { status: 200, body: { message: 'Photo supprimée' } },
      'DELETE /biens/12/photos/4': { status: 400, body: { message: 'Un bien publié doit garder au moins 4 photos : ajoutez-en une avant de supprimer celle-ci.' } },
    }) },
  })
  await page.goto('/proprietaire/biens/12/modifier')
  const photos = page.getByRole('region', { name: 'Photos' }).getByRole('listitem')
  await expect(photos).toHaveCount(5)

  await photos.nth(2).getByRole('button', { name: 'Mettre en principale' }).click()
  await expect(photos.nth(2)).toContainText('Principale')
  expect(calls.some(c => c.method === 'PATCH' && c.path === '/biens/12/photos/3/cover')).toBe(true)

  await photos.nth(1).getByRole('button', { name: 'Supprimer la photo' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Supprimer' }).click()
  await expect(photos).toHaveCount(4)

  await photos.nth(2).getByRole('button', { name: 'Supprimer la photo' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Supprimer' }).click()
  await expect(page.getByText(/doit garder au moins 4 photos/)).toBeVisible()
  await expect(photos).toHaveCount(4)
})
