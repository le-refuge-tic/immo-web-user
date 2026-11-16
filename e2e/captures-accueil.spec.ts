import { expect, test, type Page } from '@playwright/test'
import { mockApp } from './support/mockApi'

// Le service worker de l'application intercepterait les images : elles échapperaient aux routes simulées.
test.use({ serviceWorkers: 'block' })

// Lot 9 — accueil sur téléphone et tablette : captures (jointes aux PR) et vérification qu'aucun
// contenu ne passe sous la barre de navigation du bas.

const FORMATS = [
  { nom: '360x640', width: 360, height: 640 },
  { nom: '390x844', width: 390, height: 844 },
  { nom: '768x1024', width: 768, height: 1024 },
  { nom: '1024x1366', width: 1024, height: 1366 },
] as const

// Images de démonstration servies par une route simulée (dégradés doux).
const image = (teinte: number) => `https://images.refuge.test/bien-${teinte}.svg`
const svg = (teinte: number) => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${teinte},45%,72%)"/><stop offset="1" stop-color="hsl(${teinte + 40},40%,52%)"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/></svg>`

const QUARTIERS = ['Akpakpa', 'Fidjrossè', 'Cadjèhoun', 'Agla', 'Godomey', 'Calavi', 'Haie Vive', 'Gbégamey']
const BIENS = QUARTIERS.map((q, i) => ({
  id: 100 + i,
  type: i % 3 === 0 ? 'maison' : 'appart_vide',
  transaction: i % 4 === 3 ? 'vente' : 'location',
  prix: String(35000 + i * 15000),
  statut: 'disponible',
  statut_moderation: 'approuve',
  created_at: new Date(Date.UTC(2026, 10, 15 - i)).toISOString(),
  description: `Bien lumineux à ${q}`,
  localisation: { ville: i > 4 ? 'Abomey-Calavi' : 'Cotonou', quartier: q },
  amenites: { sous_type: i % 3 === 0 ? 'villa' : 'chambre_salon', chambres: 1 + (i % 3) },
  photos: [{ id: i + 1, url: image(i * 37), is_cover: true }],
}))

async function ouvrirAccueil(page: Page, format: (typeof FORMATS)[number], theme: 'light' | 'dark' = 'light') {
  await page.setViewportSize({ width: format.width, height: format.height })
  await page.route('https://images.refuge.test/**', route => {
    const teinte = Number(/bien-(\d+)/.exec(route.request().url())?.[1] ?? 0)
    return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg(teinte) })
  })
  // L'accueil charge la location et la vente séparément : une liste par transaction, comme l'API.
  await mockApp(page, { role: 'prospect', theme, mocks: { biens: req => {
    const transaction = new URL(req.url()).searchParams.get('transaction')
    const data = BIENS.filter(b => !transaction || b.transaction === transaction)
    return { status: 200, body: { data, total: data.length } }
  } } })
  await page.goto('/')
  await expect(page.getByText('Akpakpa').first()).toBeAttached()
  await page.waitForTimeout(600)
}

for (const format of FORMATS) {
  test(`accueil ${format.nom} : captures haut et bas de page`, async ({ page }) => {
    await ouvrirAccueil(page, format)
    await page.screenshot({ path: `test-results/captures-accueil/accueil-${format.nom}-haut.png` })
    await page.locator('#main-content').evaluate(el => el.scrollTo({ top: el.scrollHeight }))
    await page.waitForTimeout(400)
    await page.screenshot({ path: `test-results/captures-accueil/accueil-${format.nom}-bas.png` })
  })
}

for (const format of FORMATS.filter(f => f.width < 768)) {
  test(`téléphone ${format.nom} : rien ne passe sous la barre du bas`, async ({ page }) => {
    await ouvrirAccueil(page, format)
    const barre = page.getByRole('navigation', { name: 'Navigation principale mobile' })
    const boite = await barre.boundingBox()
    expect(boite).not.toBeNull()
    const variable = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bottom-nav-h').trim())
    expect(Math.abs(parseFloat(variable) - (boite?.height ?? 0))).toBeLessThanOrEqual(1)

    // Tout en bas de la page : le dernier contenu reste au-dessus de la barre.
    await page.locator('#main-content').evaluate(el => el.scrollTo({ top: el.scrollHeight }))
    await page.waitForTimeout(400)
    const basContenu = await page.locator('#main-content > *').last().evaluate(el => {
      const enfants = [...el.querySelectorAll('*')].filter(e => (e as HTMLElement).offsetParent !== null && e.getBoundingClientRect().height > 0)
      return Math.max(...enfants.map(e => e.getBoundingClientRect().bottom))
    })
    expect(basContenu).toBeLessThanOrEqual((boite?.y ?? 0) + 1)
  })
}

test('formulaire de publication : pas de barre du bas, variable à 0', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockApp(page, { role: 'proprietaire' })
  await page.goto('/nouveau-bien/guesthouse')
  await expect(page.getByRole('navigation', { name: 'Navigation principale mobile' })).toHaveCount(0)
  const variable = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bottom-nav-h').trim())
  expect(parseFloat(variable)).toBe(0)
})

test('téléphone 390x844 en thème sombre : capture', async ({ page }) => {
  await ouvrirAccueil(page, FORMATS[1], 'dark')
  await page.screenshot({ path: 'test-results/captures-accueil/accueil-390x844-sombre.png' })
})
