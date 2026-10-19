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
    await page.goto('/search?chambres_min=2&salons_min=1&superficie_min=50&tri=prix_asc&type=maison')

    await expect(page.locator('text=100 annonces affichées sur 130 >> visible=true')).toBeVisible()
    const url = new URL(page.url()).searchParams
    expect(url.get('chambres_min')).toBe('2')
    expect(url.get('tri')).toBe('prix_asc')
    const query = firstQuery as URLSearchParams | null
    expect(query?.get('chambres_min')).toBe('2')
    expect(query?.get('superficie_min')).toBe('50')
    expect(query?.has('prix_min')).toBe(false)

    await page.locator('button:has-text("Afficher plus"):visible').click()
    await expect(page.locator('text=130 annonces au total >> visible=true')).toBeVisible()
    expect(pages).toContain(2)
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
    await page.waitForTimeout(500)
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
})
