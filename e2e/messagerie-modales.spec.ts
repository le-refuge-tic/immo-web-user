import { expect, test } from '@playwright/test'
import { BIEN, mockApp } from './support/mockApi'

// Accessibilité des menus et modales de la messagerie et du profil (FE-C-005).

const conv = {
  id: 55,
  bien: BIEN,
  bien_id: 1,
  participants: [
    { id: 42, prenom: 'Awa', nom: 'Test' },
    { id: 3, prenom: 'Koffi', nom: 'A', role: 'proprietaire' },
  ],
  dernier_message: null,
  unread_count: 0,
}
const now = new Date().toISOString()
const messages = [
  { id: 1, sender_id: 3, contenu: 'Bonjour', type: 'text', created_at: now },
  { id: 2, sender_id: 42, contenu: 'Salut', type: 'text', created_at: now },
  { id: 3, sender_id: 3, contenu: 'x', type: 'text', created_at: now, supprime_pour_tous: true },
]

test.describe('messagerie', () => {
  test('menus au clavier, « Répondre » rend le focus au champ, modale de plainte accessible', async ({ page }) => {
    await mockApp(page, {
      mocks: {
        conversations: { status: 200, body: { data: [conv] } },
        messages: { status: 200, body: { data: messages } },
      },
    })
    await page.goto('/conversations/55')
    await page.getByText('Bonjour').first().waitFor()

    const options = page.getByRole('button', { name: 'Options', exact: true }).first()
    await expect(options).toHaveAttribute('aria-haspopup', 'menu')
    await options.click()
    const menu = page.getByRole('menu', { name: 'Options de la conversation' })
    await expect(menu).toBeVisible()
    await expect(options).toHaveAttribute('aria-expanded', 'true')
    expect(await page.evaluate(() => document.activeElement?.textContent)).toBe('Infos du contact')
    await page.keyboard.press('End')
    expect(await page.evaluate(() => document.activeElement?.textContent)).toBe('Signaler')
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
    expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe('Options')

    const own = page.locator('#msg-2 button[aria-label="Options"]:visible').first()
    await own.focus()
    await own.click()
    await page.getByRole('menuitem', { name: 'Répondre' }).click()
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('TEXTAREA')

    await page.getByRole('button', { name: 'En savoir plus' }).click()
    const dialog = page.getByRole('dialog', { name: 'Message supprimé' })
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
  })

  test("le panneau profil du chat s'ouvre comme une modale et se ferme par Échap", async ({ page }) => {
    await mockApp(page, {
      mocks: { conversations: { status: 200, body: { data: [conv] } }, messages: { status: 200, body: { data: [] } } },
    })
    await page.goto('/conversations/55')
    await page.locator('button:has(span.text-white.font-bold)').first().click()

    const profil = page.getByRole('dialog', { name: 'Profil' })
    await expect(profil).toBeVisible()
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(profil).toHaveCount(0)
  })
})

test('la modale de changement de mot de passe se ferme par Échap et par clic sur le fond', async ({ page }) => {
  await mockApp(page)
  await page.goto('/profil')
  const ouvrir = page.getByRole('button', { name: /mot de passe/i }).first()
  await ouvrir.click()

  const dialog = page.getByRole('dialog', { name: 'Changer le mot de passe' })
  await expect(dialog).toHaveAttribute('aria-modal', 'true')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await ouvrir.click()
  await expect(dialog).toBeVisible()
  await page.mouse.click(5, 5)
  await expect(dialog).toHaveCount(0)
})
