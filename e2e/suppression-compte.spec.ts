import { expect, test, type Page } from '@playwright/test'
import { mockApp, userOf, type ApiCall, type Mocks } from './support/mockApi'

// Compte en suppression (délai de 7 jours) : réactivation à la connexion, inscription refusée,
// session d'un compte inactif fermée sans tentative de rafraîchissement.

const NUMERO = '0197123456'
const NUMERO_INTERNATIONAL = '+2290197123456'
const MOT_DE_PASSE = 'MotDePasse1'
const CODE = '246810'
const DATE_SUPPRESSION = '2026-12-02T12:00:00.000Z'
const posts = (calls: ApiCall[], path: string) => calls.filter(c => c.method === 'POST' && c.path === path)
const bodyOf = (call: ApiCall): Record<string, unknown> => JSON.parse(call.body ?? '{}') as Record<string, unknown>

const exigeOtp = { status: 200, body: { requires_otp: true, session_token: 'sess-1' } }
const suppressionProgrammee = {
  status: 403,
  body: { code: 'SUPPRESSION_PROGRAMMEE', message: 'Votre compte sera supprimé le 02/12/2026.', suppression_effective_le: DATE_SUPPRESSION, annulation_possible: true },
}
const session = { status: 201, body: { access_token: 'a.e30.b', refresh_token: 'refresh-2', user: userOf('locataire') } }

async function jusquAuCode(page: Page, mocks: Mocks) {
  const calls = await mockApp(page, { loggedIn: false, mocks: { loginPhone: exigeOtp, otpVerify: suppressionProgrammee, ...mocks } })
  await page.goto('/login')
  await page.getByLabel('Numéro de téléphone').fill(NUMERO)
  await page.getByLabel('Mot de passe', { exact: true }).fill(MOT_DE_PASSE)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.getByRole('textbox', { name: 'Chiffre 1' }).click()
  await page.keyboard.type(CODE)
  const dialogue = page.getByRole('alertdialog', { name: 'Suppression programmée' })
  await expect(dialogue).toContainText('La suppression de votre compte est prévue le 02/12/2026.')
  await expect(dialogue).toContainText("Voulez-vous l'annuler et retrouver votre compte ?")
  return { calls, dialogue }
}

test.describe('Connexion d’un compte en suppression', () => {
  test('« Annuler la suppression » réactive le compte avec le même code et ouvre la session', async ({ page }) => {
    const { calls, dialogue } = await jusquAuCode(page, { routes: { 'POST /auth/annuler-suppression': session } })
    await dialogue.getByRole('button', { name: 'Annuler la suppression' }).click()

    await page.waitForURL(url => url.pathname === '/')
    expect(bodyOf(posts(calls, '/auth/annuler-suppression')[0])).toEqual({ telephone: NUMERO_INTERNATIONAL, code: CODE })
    await expect(page.getByText('Votre compte a été réactivé.')).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('rg_token'))).toBe('a.e30.b')
  })

  test('code expiré (401) : retour à la saisie du numéro avec un message', async ({ page }) => {
    const { dialogue } = await jusquAuCode(page, {
      routes: { 'POST /auth/annuler-suppression': { status: 401, body: { message: 'Code invalide ou expiré' } } },
    })
    await dialogue.getByRole('button', { name: 'Annuler la suppression' }).click()

    await expect(page.getByRole('alert')).toContainText('Le code a expiré. Reconnectez-vous pour recevoir un nouveau code.')
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('« Non » efface le numéro et revient à la connexion sans rien envoyer', async ({ page }) => {
    const { calls, dialogue } = await jusquAuCode(page, {})
    await dialogue.getByRole('button', { name: 'Non' }).click()

    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible()
    await expect(page.getByLabel('Numéro de téléphone')).toHaveValue('')
    expect(posts(calls, '/auth/annuler-suppression')).toHaveLength(0)
    expect(await page.evaluate(() => sessionStorage.length + localStorage.length)).toBeGreaterThan(0)
    expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain(CODE)
  })
})

test('inscription avec le numéro d’un compte en suppression : message du serveur dans une boîte de dialogue', async ({ page }) => {
  await mockApp(page, {
    loggedIn: false,
    mocks: { register: { status: 409, body: { code: 'SUPPRESSION_EN_COURS', message: 'Ce numéro appartient à un compte en cours de suppression. Connectez-vous pour le réactiver.', suppression_effective_le: DATE_SUPPRESSION } } },
  })
  await page.goto('/register')
  await page.getByRole('button', { name: /Je suis propriétaire/ }).click()
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByLabel('Nom', { exact: true }).fill('Dupont')
  await page.getByLabel('Prénom', { exact: true }).fill('Jean')
  await page.getByLabel('Téléphone', { exact: true }).fill(NUMERO)
  await page.getByLabel('Mot de passe', { exact: true }).fill(MOT_DE_PASSE)
  await page.getByLabel('Confirmer', { exact: true }).fill(MOT_DE_PASSE)
  await page.getByLabel(/J'accepte les conditions/).setChecked(true, { force: true })
  const depuis = await page.evaluate(() => performance.now())
  await page.waitForFunction(debut => performance.now() > debut + 3100, depuis)
  await page.getByRole('button', { name: "S'inscrire" }).click()

  const dialogue = page.getByRole('alertdialog', { name: 'Compte en cours de suppression' })
  await expect(dialogue).toContainText('Ce numéro appartient à un compte en cours de suppression. Connectez-vous pour le réactiver.')
  await dialogue.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible()
})

for (const code of ['SUPPRESSION_PROGRAMMEE', 'COMPTE_SUPPRIME']) {
  test(`401 ${code} sur une route authentifiée : session vidée, sans rafraîchissement, message à la connexion`, async ({ page }) => {
    const calls = await mockApp(page, {
      role: 'locataire',
      mocks: { routes: { 'GET /users/me': { status: 401, body: { code, message: "Votre compte n'est plus actif." } } } },
    })
    await page.goto('/profil')

    await page.waitForURL('**/login')
    await expect(page.getByRole('heading', { name: 'Compte inactif' })).toBeVisible()
    await expect(page.getByText("Votre compte n'est plus actif.")).toBeVisible()
    expect(posts(calls, '/auth/refresh')).toHaveLength(0)
    expect(await page.evaluate(() => localStorage.getItem('rg_token'))).toBeNull()
  })
}
