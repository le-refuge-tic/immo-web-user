import { expect, test, type Page } from '@playwright/test'
import { mockApp } from './support/mockApi'

// Lot 14 — déconnexion confirmée, et bas des onglets du tableau de bord propriétaire visible
// au-dessus de la barre du bas (360 px, et iPhone 390 × 844).

const FORMATS = [{ nom: '360 px', width: 360, height: 640 }, { nom: 'iPhone', width: 390, height: 844 }]

/** Hauteur de la barre du bas publiée dans --bottom-nav-h, et hauteur visible de la fenêtre. */
const mesures = (page: Page) => page.evaluate(() => ({
  barre: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bottom-nav-h')) || 0,
  fenetre: window.innerHeight,
}))

const ouvrirProfil = async (page: Page) => {
  await page.goto('/proprietaire')
  await page.getByRole('button', { name: /^Plus/ }).click()
  await page.getByRole('button', { name: 'Profil', exact: true }).click()
}

for (const f of FORMATS) {
  test.describe(`tableau de bord propriétaire — ${f.nom}`, () => {
    test.use({ viewport: { width: f.width, height: f.height } })

    test('Profil : « Déconnexion » est entièrement visible au-dessus de la barre du bas', async ({ page }) => {
      await mockApp(page, { role: 'proprietaire' })
      await ouvrirProfil(page)
      const bouton = page.getByRole('button', { name: 'Déconnexion' }).last()
      await bouton.scrollIntoViewIfNeeded()
      const { barre, fenetre } = await mesures(page)
      expect(barre).toBeGreaterThan(40)
      const boite = (await bouton.boundingBox())!
      expect(boite.y + boite.height).toBeLessThanOrEqual(fenetre - barre + 1)
    })

    test('le bouton « Publier un bien » flotte au-dessus de la barre', async ({ page }) => {
      await mockApp(page, { role: 'proprietaire' })
      await page.goto('/proprietaire')
      const fab = page.locator('div.fixed').getByRole('button', { name: 'Publier un bien' })
      await expect(fab).toBeVisible()
      const { barre, fenetre } = await mesures(page)
      expect(barre).toBeGreaterThan(40)
      const boite = (await fab.boundingBox())!
      expect(boite.y + boite.height).toBeLessThanOrEqual(fenetre - barre)
    })
  })
}

test.describe('déconnexion confirmée', () => {
  test('annuler garde la session ; confirmer déconnecte', async ({ page }) => {
    await mockApp(page, { role: 'proprietaire' })
    await ouvrirProfil(page)
    const bouton = page.getByRole('button', { name: 'Déconnexion' }).last()

    await bouton.click()
    const dialogue = page.getByRole('alertdialog', { name: 'Se déconnecter ?' })
    await expect(dialogue).toBeVisible()
    await dialogue.getByRole('button', { name: 'Annuler' }).click()
    await expect(dialogue).toHaveCount(0)
    await expect(page).toHaveURL(/\/proprietaire/)
    expect(await page.evaluate(() => localStorage.getItem('rg_user'))).not.toBeNull()

    await bouton.click()
    await page.getByRole('alertdialog', { name: 'Se déconnecter ?' }).getByRole('button', { name: 'Se déconnecter' }).click()
    await expect(page).toHaveURL(/\/login/)
    expect(await page.evaluate(() => localStorage.getItem('rg_user'))).toBeNull()
  })

  test('la déconnexion du menu de l’en-tête demande aussi confirmation', async ({ page }) => {
    await mockApp(page)
    await page.goto('/profil')
    await page.getByRole('button', { name: /Se déconnecter|Déconnexion/ }).last().click()
    const dialogue = page.getByRole('alertdialog', { name: 'Se déconnecter ?' })
    await expect(dialogue).toBeVisible()
    await dialogue.getByRole('button', { name: 'Annuler' }).click()
    await expect(page).toHaveURL(/\/profil/)
  })
})
