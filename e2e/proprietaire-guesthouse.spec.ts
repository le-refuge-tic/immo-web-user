import { expect, test, type Page } from '@playwright/test'
import { mockApp, userOf } from './support/mockApi'

// Lot 4 — le propriétaire publie une guesthouse avec les mêmes étapes et règles que le commercial.

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
const photos = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `p${i + 1}.png`, mimeType: 'image/png', buffer: PNG }))

async function ouvrirGuesthouse(page: Page) {
  await page.goto('/nouveau-bien')
  await page.getByRole('radio', { name: 'Court séjour' }).click()
  const dialogue = page.getByRole('alertdialog')
  await expect(dialogue).toContainText('Publier une guesthouse ?')
  await dialogue.getByRole('button', { name: 'Ouvrir le formulaire' }).click()
  await expect(page).toHaveURL(/\/nouveau-bien\/guesthouse$/)
}

test('sans téléphone dans le profil : la publication est bloquée, avec un lien vers le profil', async ({ page }) => {
  await mockApp(page, { role: 'proprietaire' })
  await ouvrirGuesthouse(page)
  await page.getByLabel('Nom de la guesthouse').fill('Villa Awa')
  await page.getByLabel('Description').fill('Calme')
  await expect(page.getByText(/Ajoutez votre téléphone dans/)).toBeVisible()
  await expect(page.getByText(/Il manque : .*Téléphone du propriétaire/)).toBeVisible()
})

test('guesthouse publiée : payload complet, propriétaire = compte, retour à « Mes biens »', async ({ page }) => {
  const calls = await mockApp(page, {
    role: 'proprietaire',
    mocks: { routes: {
      'GET /equipements': { status: 200, body: [{ categorie: 'confort', libelle: 'Confort', equipements: [{ code: 'wifi', libelle: 'Wi-Fi' }] }] },
      'GET /configuration/frais-visite': { status: 200, body: { montant: 1000 } },
      'POST /biens': { status: 201, body: { id: 9 } },
    } },
  })
  await page.addInitScript(u => localStorage.setItem('rg_user', JSON.stringify(u)), { ...userOf('proprietaire'), telephone: '+2290197000000', email: 'awa@test.bj' })
  await ouvrirGuesthouse(page)
  const suivant = page.getByRole('button', { name: 'Suivant' })

  // Identité : propriétaire repris du compte, en lecture seule
  await expect(page.getByText('+2290197000000')).toBeVisible()
  await page.getByLabel('Nom de la guesthouse').fill('Villa Awa')
  await page.getByLabel('Description').fill('Calme, à 5 min de la plage.')
  await suivant.click()

  // Localisation
  await page.getByLabel('Quartier').fill('Fidjrossè')
  await page.getByLabel('Ville').fill('Cotonou')
  await suivant.click()

  // Tarif : totaux en direct
  await page.getByPlaceholder('25000').fill('25000')
  await page.getByPlaceholder('150000').fill('150000')
  const totaux = page.getByRole('region', { name: 'Totaux' })
  await expect(totaux).toContainText(/Total à l’arrivée/)
  await expect(totaux).toContainText(/14 % de réduction/)
  await suivant.click()

  // Règles : garage obligatoire, équipements du référentiel
  await expect(suivant).toHaveAttribute('aria-disabled', 'true')
  await page.getByRole('radiogroup', { name: 'Garage' }).getByRole('radio', { name: 'Non' }).click()
  await page.getByRole('button', { name: 'Wi-Fi' }).click()
  await page.getByRole('radiogroup', { name: 'Politique d’annulation' }).getByRole('radio', { name: /Modérée/ }).click()
  await suivant.click()

  // Photos : 4 au minimum (référentiel), puis récapitulatif
  await page.locator('input[type="file"][accept^="image"]').setInputFiles(photos(3))
  await expect(page.getByText(/il en faut au moins 4/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Publier la guesthouse' })).toHaveAttribute('aria-disabled', 'true')
  await page.locator('input[type="file"][accept^="image"]').setInputFiles(photos(1))
  await expect(page.getByRole('region', { name: 'Tarif et capacité' })).toContainText('25 000 FCFA / nuit')
  await page.getByRole('button', { name: 'Publier la guesthouse' }).click()

  await expect(page).toHaveURL(/\/proprietaire$/)
  const creation = calls.find(c => c.method === 'POST' && c.path === '/biens')
  const corps = JSON.parse(creation?.body ?? '{}')
  expect(corps).toMatchObject({
    type: 'guesthouse', transaction: 'location', prix: 25000, frais_visite: 1000,
    amenites: { proprietaire_info: { prenom: 'Awa', nom: 'Test', telephone: '+2290197000000' } },
    details_guesthouse: { prix_nuitee: 25000, prix_semaine: 150000, garage: false, politique_annulation: 'moderee' },
    equipements: ['wifi'],
  })
  expect(JSON.stringify(corps)).not.toMatch(/prime|commission_agence/)
})

test('salle de fêtes : ouverte depuis « Événementiel », totaux en direct à l’étape Tarif', async ({ page }) => {
  await mockApp(page, { role: 'proprietaire' })
  await page.addInitScript(u => localStorage.setItem('rg_user', JSON.stringify(u)), { ...userOf('proprietaire'), telephone: '+2290197000000' })
  await page.goto('/nouveau-bien')
  await page.getByRole('radio', { name: 'Événementiel' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Ouvrir le formulaire' }).click()
  await expect(page).toHaveURL(/\/nouveau-bien\/salle-fete$/)
  const suivant = page.getByRole('button', { name: 'Suivant' })
  await page.getByLabel('Nom de la salle').fill('Salle Awa')
  await page.getByLabel('Description').fill('Grande salle')
  await suivant.click()
  await page.getByLabel('Quartier').fill('Fidjrossè')
  await page.getByLabel('Ville').fill('Cotonou')
  await suivant.click()
  await page.getByPlaceholder('45000', { exact: true }).fill('45000')
  await page.getByLabel('Heures couvertes par ce prix').selectOption('8')
  const totaux = page.getByRole('region', { name: 'Totaux' })
  // 4 h minimum par défaut : 45 000 / 8 × 4 = 22 500 F
  await expect(totaux).toContainText(/22\s500\sFCFA/)
  await expect(totaux).toContainText(/Total minimum à verser/)
})
