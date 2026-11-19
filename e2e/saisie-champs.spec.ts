import { expect, test } from '@playwright/test'
import { mockApp } from './support/mockApi'

// Lot 15 — un champ de montant n'accepte que des chiffres, à la frappe comme au collage.

test.describe('Champs numériques', () => {
  test('lettres et signes refusés, collage nettoyé, milliers affichés', async ({ page }) => {
    await mockApp(page, { role: 'proprietaire' })
    await page.goto('/nouveau-bien')
    const prix = page.locator('input[inputmode="numeric"]').first()

    await prix.pressSequentially('-1e5a0')
    await expect(prix).toHaveValue('150')

    await prix.fill('')
    await page.evaluate(() => navigator.clipboard?.writeText?.('150 000 FCFA').catch(() => {}))
    await prix.focus()
    // Collage simulé : l'évènement `input` reçoit le texte brut, le champ le nettoie.
    await prix.evaluate((el: HTMLInputElement) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      setter.call(el, '150 000 FCFA')
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await expect(prix).toHaveValue('150 000')
    expect(await prix.getAttribute('type')).toBe('text')
  })
})
