import { expect, test, type Request } from '@playwright/test'
import { BIEN, biensList, mockApp } from './support/mockApi'

// P1 — Découverte : accueil, recherche, fiche d'un bien (FE-B-001, B-009, D-005).

const pageOf = (req: Request) => Number(new URL(req.url()).searchParams.get('page') || 1)

test.describe('P1 découverte', () => {
  test("une panne de l'API sur l'accueil n'est pas présentée comme « aucun bien »", async ({ page }) => {
    await mockApp(page, { mocks: { biens: { status: 500, body: {} } } })
    await page.goto('/')

    await expect(page.getByText('Impossible de charger les annonces').first()).toBeVisible()
    await expect(page.getByText('Aucun bien trouvé')).toHaveCount(0)
  })

  test("la recherche annonce le total, garde les filtres dans l'URL et charge la page 2", async ({ page }) => {
    const pages: number[] = []
    let firstQuery: URLSearchParams | null = null
    await mockApp(page, {
      mocks: {
        biens: req => {
          const pg = pageOf(req)
          pages.push(pg)
          if (pg === 1) firstQuery = new URL(req.url()).searchParams
          return { status: 200, body: { data: pg === 1 ? biensList(100) : biensList(30, 101), total: 130, page: pg, limit: 100 } }
        },
      },
    })
    await page.goto('/search?pieces=3&superficie_min=50&tri=prix_asc&type=maison')

    await expect(page.locator('text=100 annonces affichées sur 130 >> visible=true')).toBeVisible()
    const url = new URL(page.url()).searchParams
    expect(url.get('pieces')).toBe('3')
    expect(url.get('tri')).toBe('prix_asc')
    const query = firstQuery as URLSearchParams | null
    expect(query?.get('pieces')).toBe('3')
    expect(query?.has('chambres_min')).toBe(false)
    expect(query?.get('superficie_min')).toBe('50')
    expect(query?.has('prix_min')).toBe(false)

    await page.locator('button:has-text("Afficher plus"):visible').click()
    await expect(page.locator('text=130 annonces au total >> visible=true')).toBeVisible()
    expect(pages).toContain(2)
  })

  test('le compteur « Nombre de pièces » cherche le nombre exact, puis « 5+ » au maximum', async ({ page }) => {
    const queries: URLSearchParams[] = []
    await mockApp(page, {
      mocks: { biens: req => { queries.push(new URL(req.url()).searchParams); return { status: 200, body: { data: biensList(3), total: 3, page: 1, limit: 100 } } } },
    })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/search')
    const panneau = page.getByRole('complementary')
    const plus = panneau.getByRole('button', { name: 'Une pièce de plus' })
    const moins = panneau.getByRole('button', { name: 'Une pièce de moins' })
    await expect(panneau.getByText('Pièces minimum')).toHaveCount(0)
    await expect(panneau.getByText('Nombre de pièces')).toBeVisible()

    for (let i = 0; i < 3; i++) await plus.click()
    await expect.poll(() => queries.at(-1)?.get('pieces')).toBe('3')
    expect(queries.at(-1)?.has('pieces_min')).toBe(false)
    await expect(page).toHaveURL(/pieces=3/)

    await plus.click(); await plus.click()
    await expect(panneau.getByText('5+', { exact: true })).toBeVisible()
    await expect(plus).toBeDisabled()
    await expect.poll(() => queries.at(-1)?.get('pieces_min')).toBe('5')
    expect(queries.at(-1)?.has('pieces')).toBe(false)

    for (let i = 0; i < 5; i++) await moins.click()
    await expect(moins).toBeDisabled()
    await expect(page).not.toHaveURL(/pieces/)
    // Sans filtre de pièces, la liste chargée à l'ouverture est encore en cache (FE-A-004) :
    // elle est réaffichée sans nouvelle requête, et aucune requête n'a gardé un filtre de pièces.
    const avant = queries.length
    await page.waitForTimeout(800)
    expect(queries.slice(avant).some(q => q.has('pieces') || q.has('pieces_min'))).toBe(false)
    await expect(page.locator('article').locator('visible=true').first()).toBeVisible()
  })

  test('un échec de la page 2 garde la liste déjà chargée et « Réessayer » recharge la même page', async ({ page }) => {
    let failures = 0
    await mockApp(page, {
      mocks: {
        biens: req => {
          if (pageOf(req) === 1) return { status: 200, body: { data: biensList(100), total: 130, page: 1, limit: 100 } }
          return ++failures === 1
            ? { status: 500, body: { message: 'x' } }
            : { status: 200, body: { data: biensList(30, 101), total: 130, page: 2, limit: 100 } }
        },
      },
    })
    await page.goto('/search')
    await page.locator('button:has-text("Afficher plus"):visible').click()

    await expect(page.locator('text=Impossible de charger la suite >> visible=true')).toBeVisible()
    expect(await page.locator('article:visible').count()).toBeGreaterThanOrEqual(100)
    await expect(page.getByText('Impossible de charger les biens')).toHaveCount(0)

    await page.locator('button:has-text("Réessayer"):visible').click()
    await expect(page.locator('text=130 annonces au total >> visible=true')).toBeVisible()
  })

  test('le retour depuis une fiche rétablit la position de défilement', async ({ page }) => {
    await mockApp(page, { mocks: { biens: { status: 200, body: { data: biensList(40), total: 40, page: 1, limit: 100 } } } })
    await page.goto('/search')
    await page.locator('article a:visible').first().waitFor()

    await page.evaluate(() => document.getElementById('main-content')?.scrollTo({ top: 900 }))
    await expect.poll(() => page.evaluate(() => document.getElementById('main-content')?.scrollTop ?? 0)).toBeGreaterThan(800)
    await page.locator('article a:visible').nth(6).click({ force: true })
    await page.waitForURL(/\/biens\/\d+/)
    await page.goBack()
    await page.locator('article a:visible').first().waitFor()

    await expect.poll(() => page.evaluate(() => document.getElementById('main-content')?.scrollTop ?? 0)).toBeGreaterThan(400)
  })

  test('le bouton de partage de la fiche ouvre une vraie modale fermée par Échap', async ({ page }) => {
    await mockApp(page, { mocks: { bienDetail: { status: 200, body: { ...BIEN, proprietaire: { id: 3, prenom: 'K', nom: 'A' } } } } })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/biens/1')
    await page.getByRole('button', { name: /partager/i }).first().click()

    const dialog = page.getByRole('dialog', { name: 'Partager ce bien' })
    await expect(dialog).toBeVisible()
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
  })

  test('la fiche affiche la date de disponibilité seulement quand elle est définie', async ({ page }) => {
    await mockApp(page, { mocks: { bienDetail: { status: 200, body: { ...BIEN, disponible_a: '2030-03-15' } } } })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/biens/1')
    await expect(page.locator('text=Disponible à partir du 15 mars 2030 >> visible=true')).toBeVisible()
  })

  test("sans date de disponibilité, la fiche n'en parle pas", async ({ page }) => {
    await mockApp(page, { mocks: { bienDetail: { status: 200, body: { ...BIEN, disponible_a: null } } } })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/biens/1')
    await expect(page.locator('text=Cotonou >> visible=true').first()).toBeVisible()
    await expect(page.getByText(/Disponible à partir du/)).toHaveCount(0)
  })
})
