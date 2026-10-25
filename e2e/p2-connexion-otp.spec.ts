import { expect, test, type Locator, type Page } from '@playwright/test'
import { mockApp, userOf, type ApiCall, type Mocks, type Role } from './support/mockApi'

// P2 — Connexion, inscription propriétaire, OTP et mot de passe oublié (FE-F-003).

const NUMERO = '0197123456'
const NUMERO_INTERNATIONAL = '+2290197123456'
const MOT_DE_PASSE = 'MotDePasse1'
const posts = (calls: ApiCall[], path: string) => calls.filter(c => c.method === 'POST' && c.path === path)
const bodyOf = (call: ApiCall): Record<string, unknown> => JSON.parse(call.body ?? '{}') as Record<string, unknown>

const session = (role: Role = 'locataire', extra: Record<string, unknown> = {}) => ({
  status: 200,
  body: { access_token: 'a.e30.b', refresh_token: 'refresh-2', user: userOf(role), ...extra },
})
const exigeOtp = { status: 200, body: { requires_otp: true, session_token: 'sess-1' } }

async function ouvrir(page: Page, chemin: '/login' | '/register' | '/mot-de-passe-oublie', mocks: Mocks = {}) {
  const calls = await mockApp(page, { loggedIn: false, mocks })
  await page.goto(chemin)
  return calls
}

async function seConnecter(page: Page, motDePasse = MOT_DE_PASSE) {
  await page.getByLabel('Numéro de téléphone').fill(NUMERO)
  await page.getByLabel('Mot de passe', { exact: true }).fill(motDePasse)
  await page.getByRole('button', { name: 'Se connecter' }).click()
}

const casesOtp = (page: Page) => page.getByRole('textbox', { name: /^Chiffre \d$/ })

/** Simule le collage (SMS, presse-papiers) dans une case : événement `paste` avec un vrai DataTransfer. */
async function coller(champ: Locator, texte: string) {
  await champ.evaluate((el, t) => {
    const dataTransfer = new DataTransfer()
    dataTransfer.setData('text', t)
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dataTransfer, bubbles: true, cancelable: true }))
  }, texte)
}

// ─── Connexion ───────────────────────────────────────────────────────────────

test.describe('P2 connexion par téléphone', () => {
  test('une connexion réussie envoie le numéro international et mène à l’accueil, jeton enregistré', async ({ page }) => {
    const calls = await ouvrir(page, '/login', { loginPhone: session('locataire') })
    await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible()
    await seConnecter(page)

    await page.waitForURL(url => url.pathname === '/')
    const envoi = bodyOf(posts(calls, '/auth/login/phone')[0])
    expect(envoi).toMatchObject({ telephone: NUMERO_INTERNATIONAL, password: MOT_DE_PASSE })
    expect(await page.evaluate(() => localStorage.getItem('rg_token'))).toBe('a.e30.b')
  })

  test('un propriétaire est dirigé vers son tableau de bord', async ({ page }) => {
    await ouvrir(page, '/login', { loginPhone: session('proprietaire') })
    await seConnecter(page)

    await page.waitForURL('**/proprietaire')
  })

  test('un mot de passe incorrect affiche un message lisible et laisse le formulaire utilisable', async ({ page }) => {
    await ouvrir(page, '/login', { loginPhone: { status: 401, body: { message: 'Unauthorized', statusCode: 401 } } })
    await seConnecter(page, 'mauvais')

    await expect(page.getByRole('alert')).toContainText('Identifiants incorrects')
    await expect(page.getByRole('alert')).not.toContainText('Unauthorized')
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeEnabled()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('un message métier du serveur (compte suspendu) est affiché tel quel', async ({ page }) => {
    await ouvrir(page, '/login', { loginPhone: { status: 403, body: { message: 'Votre compte est suspendu.' } } })
    await seConnecter(page)

    await expect(page.getByRole('alert')).toContainText('Votre compte est suspendu.')
  })

  test('trop de tentatives (429) indique le délai d’attente', async ({ page }) => {
    await ouvrir(page, '/login', { loginPhone: { status: 429, body: { message: 'ThrottlerException: Too Many Requests' } } })
    await seConnecter(page)

    await expect(page.getByRole('alert')).toContainText('Trop de tentatives')
  })

  test('des champs vides sont signalés sans appel au serveur', async ({ page }) => {
    const calls = await ouvrir(page, '/login')
    await page.getByRole('button', { name: 'Se connecter' }).click()

    await expect(page.getByRole('alert')).toContainText('Remplissez tous les champs')
    expect(posts(calls, '/auth/login/phone')).toHaveLength(0)
  })

  test('après connexion, l’utilisateur retrouve la page où il se trouvait', async ({ page }) => {
    await mockApp(page, { loggedIn: false, mocks: { loginPhone: session('locataire') } })
    await page.addInitScript(() => sessionStorage.setItem('post_login_redirect', '/mes-visites'))
    await page.goto('/login')
    await seConnecter(page)

    await page.waitForURL('**/mes-visites')
    expect(await page.evaluate(() => sessionStorage.getItem('post_login_redirect'))).toBeNull()
  })

  test('une destination externe mémorisée est ignorée après connexion', async ({ page }) => {
    await mockApp(page, { loggedIn: false, mocks: { loginPhone: session('locataire') } })
    await page.addInitScript(() => sessionStorage.setItem('post_login_redirect', '//exemple.invalid/piege'))
    await page.goto('/login')
    await seConnecter(page)

    await page.waitForURL(url => url.pathname === '/')
    expect(new URL(page.url()).hostname).toBe('localhost')
  })

  test('« Mot de passe oublié ? » mène à la réinitialisation', async ({ page }) => {
    await ouvrir(page, '/login')
    await page.getByRole('button', { name: 'Mot de passe oublié ?' }).click()

    await page.waitForURL('**/mot-de-passe-oublie')
    await expect(page.getByRole('heading', { name: 'Mot de passe oublié' })).toBeVisible()
  })

  test('le bouton œil affiche puis masque le mot de passe', async ({ page }) => {
    await ouvrir(page, '/login')
    const champ = page.getByLabel('Mot de passe', { exact: true })
    await champ.fill(MOT_DE_PASSE)
    await expect(champ).toHaveAttribute('type', 'password')

    await page.getByRole('button', { name: 'Afficher le mot de passe' }).click()
    await expect(champ).toHaveAttribute('type', 'text')
    await expect(page.getByRole('button', { name: 'Masquer le mot de passe' })).toHaveAttribute('aria-pressed', 'true')
  })
})

// ─── OTP à la connexion ──────────────────────────────────────────────────────

test.describe('P2 code de vérification (OTP) à la connexion', () => {
  test('une connexion qui exige un code affiche six cases et le numéro masqué', async ({ page }) => {
    await ouvrir(page, '/login', { loginPhone: exigeOtp })
    await seConnecter(page)

    await expect(page.getByRole('heading', { name: 'Vérification' })).toBeVisible()
    await expect(page.getByText('3456', { exact: false }).first()).toBeVisible()
    await expect(casesOtp(page)).toHaveCount(6)
    await expect(page.getByRole('button', { name: 'Confirmer' })).toBeDisabled()
    await expect(page.getByText(/Renvoyer dans/)).toBeVisible()
  })

  test('la saisie des six chiffres valide le code, mémorise l’appareil et ouvre la session', async ({ page }) => {
    const calls = await ouvrir(page, '/login', {
      loginPhone: exigeOtp,
      otpVerify: session('locataire', { device_token: 'appareil-xyz' }),
    })
    await seConnecter(page)
    await casesOtp(page).first().click()
    await page.keyboard.type('123456')

    await page.waitForURL(url => url.pathname === '/')
    expect(bodyOf(posts(calls, '/auth/otp/verify')[0])).toEqual({ session_token: 'sess-1', code: '123456' })
    expect(await page.evaluate(() => localStorage.getItem('rg_device_token'))).toBe('appareil-xyz')
    expect(await page.evaluate(() => localStorage.getItem('rg_token'))).toBe('a.e30.b')
  })

  test('le collage du code reçu par SMS remplit les six cases et valide', async ({ page }) => {
    const calls = await ouvrir(page, '/login', { loginPhone: exigeOtp, otpVerify: session('locataire') })
    await seConnecter(page)
    await coller(casesOtp(page).first(), '654 321')

    await page.waitForURL(url => url.pathname === '/')
    expect(bodyOf(posts(calls, '/auth/otp/verify')[0])).toMatchObject({ code: '654321' })
  })

  test('un code erroné affiche le message, vide les cases et redonne le focus à la première', async ({ page }) => {
    await ouvrir(page, '/login', { loginPhone: exigeOtp, otpVerify: { status: 400, body: { message: 'Code incorrect ou expiré.' } } })
    await seConnecter(page)
    await casesOtp(page).first().click()
    await page.keyboard.type('000000')

    await expect(page.getByRole('alert')).toContainText('Code incorrect ou expiré.')
    for (const valeur of await casesOtp(page).evaluateAll(cases => cases.map(c => (c as HTMLInputElement).value))) expect(valeur).toBe('')
    await expect(casesOtp(page).first()).toBeFocused()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('un appareil déjà mémorisé renvoie son jeton à la connexion', async ({ page }) => {
    const calls = await mockApp(page, { loggedIn: false, mocks: { loginPhone: session('locataire') } })
    await page.addInitScript(() => localStorage.setItem('rg_device_token', 'appareil-connu'))
    await page.goto('/login')
    await seConnecter(page)

    await page.waitForURL(url => url.pathname === '/')
    expect(bodyOf(posts(calls, '/auth/login/phone')[0])).toMatchObject({ device_token: 'appareil-connu' })
  })

  test('« Retour » ramène aux identifiants', async ({ page }) => {
    await ouvrir(page, '/login', { loginPhone: exigeOtp })
    await seConnecter(page)
    await page.getByRole('button', { name: 'Retour' }).click()

    await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible()
  })
})

// ─── Mot de passe oublié ─────────────────────────────────────────────────────

async function saisirCode(page: Page, code: string) {
  await casesOtp(page).first().click()
  await page.keyboard.type(code)
}

test.describe('P2 mot de passe oublié', () => {
  test('les trois étapes (téléphone, code, nouveau mot de passe) aboutissent à la connexion', async ({ page }) => {
    const calls = await ouvrir(page, '/mot-de-passe-oublie')
    await page.getByLabel('Numéro de téléphone').fill(NUMERO)
    await page.getByRole('button', { name: 'Recevoir le code' }).click()

    await expect(page.getByRole('heading', { name: 'Vérification' })).toBeVisible()
    expect(bodyOf(posts(calls, '/auth/forgot-password')[0])).toEqual({ telephone: NUMERO_INTERNATIONAL })
    await saisirCode(page, '246810')

    await expect(page.getByRole('heading', { name: 'Nouveau mot de passe' })).toBeVisible()
    expect(bodyOf(posts(calls, '/auth/reset-password/verify')[0])).toEqual({ telephone: NUMERO_INTERNATIONAL, code: '246810' })
    await page.getByLabel('Nouveau mot de passe', { exact: true }).fill('NouveauMdp1')
    await page.getByLabel('Confirmer le mot de passe').fill('NouveauMdp1')
    await page.getByRole('button', { name: 'Réinitialiser le mot de passe' }).click()

    await expect(page.getByRole('heading', { name: 'Mot de passe réinitialisé' })).toBeVisible()
    expect(bodyOf(posts(calls, '/auth/reset-password')[0])).toEqual({ telephone: NUMERO_INTERNATIONAL, code: '246810', nouveau_mot_de_passe: 'NouveauMdp1' })
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await page.waitForURL('**/login')
  })

  test('un numéro vide est refusé sans appel au serveur', async ({ page }) => {
    const calls = await ouvrir(page, '/mot-de-passe-oublie')
    await page.getByRole('button', { name: 'Recevoir le code' }).click()

    await expect(page.getByRole('alert')).toContainText('Entrez votre numéro de téléphone')
    expect(posts(calls, '/auth/forgot-password')).toHaveLength(0)
  })

  test('un code refusé garde l’utilisateur à l’étape du code avec un message', async ({ page }) => {
    await ouvrir(page, '/mot-de-passe-oublie', { resetVerify: { status: 400, body: { message: 'Code invalide ou expiré' } } })
    await page.getByLabel('Numéro de téléphone').fill(NUMERO)
    await page.getByRole('button', { name: 'Recevoir le code' }).click()
    await saisirCode(page, '111111')

    await expect(page.getByRole('alert')).toContainText('Code invalide ou expiré')
    await expect(page.getByRole('heading', { name: 'Vérification' })).toBeVisible()
  })

  test('un nouveau mot de passe trop court ou non confirmé est refusé avant l’envoi', async ({ page }) => {
    const calls = await ouvrir(page, '/mot-de-passe-oublie')
    await page.getByLabel('Numéro de téléphone').fill(NUMERO)
    await page.getByRole('button', { name: 'Recevoir le code' }).click()
    await saisirCode(page, '246810')
    await expect(page.getByRole('heading', { name: 'Nouveau mot de passe' })).toBeVisible()

    await page.getByLabel('Nouveau mot de passe', { exact: true }).fill('court')
    await page.getByLabel('Confirmer le mot de passe').fill('court')
    await page.getByRole('button', { name: 'Réinitialiser le mot de passe' }).click()
    await expect(page.getByRole('alert')).toContainText('au moins 8 caractères')

    await page.getByLabel('Nouveau mot de passe', { exact: true }).fill('LongMotDePasse1')
    await page.getByLabel('Confirmer le mot de passe').fill('Different123')
    await page.getByRole('button', { name: 'Réinitialiser le mot de passe' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'ne correspondent pas' })).toBeVisible()
    expect(posts(calls, '/auth/reset-password')).toHaveLength(0)
  })
})

test.describe('P2 annulation d’un changement de numéro', () => {
  test('ouvrir le lien n’annule rien : l’annulation n’a lieu qu’au clic', async ({ page }) => {
    const calls = await mockApp(page, { loggedIn: false, mocks: { annulerChangement: { status: 201, body: { ok: true } } } })
    await page.goto('/annuler-changement?token=tok-123')
    await expect(page.getByRole('heading', { name: 'Annuler le changement de numéro' })).toBeVisible()
    expect(posts(calls, '/auth/changes/cancel')).toHaveLength(0)

    await page.getByRole('button', { name: 'Annuler ce changement' }).click()

    await expect(page.getByRole('heading', { name: 'Changement annulé' })).toBeVisible()
    expect(bodyOf(posts(calls, '/auth/changes/cancel')[0])).toEqual({ token: 'tok-123' })
  })

  test('un lien sans jeton explique qu’il est incomplet et ne propose pas d’annuler', async ({ page }) => {
    await mockApp(page, { loggedIn: false })
    await page.goto('/annuler-changement')

    await expect(page.getByRole('alert')).toContainText('Ce lien est incomplet')
    await expect(page.getByRole('button', { name: 'Annuler ce changement' })).toHaveCount(0)
  })
})

// ─── Inscription propriétaire ────────────────────────────────────────────────

interface Saisie { nom: string; prenom: string; telephone: string; motDePasse: string; confirmation: string; conditions: boolean }
const VALIDE: Saisie = { nom: 'Dupont', prenom: 'Jean', telephone: NUMERO, motDePasse: MOT_DE_PASSE, confirmation: MOT_DE_PASSE, conditions: true }

/** Ouvre l'inscription (restriction « propriétaires uniquement » active par défaut). */
async function ouvrirInscription(page: Page, mocks: Mocks = {}) {
  const calls = await ouvrir(page, '/register', mocks)
  await expect(page.getByRole('heading', { name: 'Vous êtes propriétaire ?' })).toBeVisible()
  return calls
}

async function remplir(page: Page, saisie: Saisie) {
  await page.getByLabel('Nom', { exact: true }).fill(saisie.nom)
  await page.getByLabel('Prénom', { exact: true }).fill(saisie.prenom)
  await page.getByLabel('Téléphone', { exact: true }).fill(saisie.telephone)
  await page.getByLabel('Mot de passe', { exact: true }).fill(saisie.motDePasse)
  await page.getByLabel('Confirmer', { exact: true }).fill(saisie.confirmation)
  await page.getByLabel(/J'accepte les conditions/).setChecked(saisie.conditions, { force: true })
}

/** L'envoi est refusé durant les 3 premières secondes d'affichage (anti-robot) : on attend ce délai sans pause arbitraire. */
async function attendreDelaiAntiRobot(page: Page) {
  const depuis = await page.evaluate(() => performance.now())
  await page.waitForFunction(debut => performance.now() > debut + 3100, depuis)
}

async function sInscrire(page: Page, saisie: Saisie = VALIDE) {
  await remplir(page, saisie)
  await attendreDelaiAntiRobot(page)
  await page.getByRole('button', { name: "S'inscrire" }).click()
}

test.describe('P2 inscription propriétaire', () => {
  test('affiche le formulaire propriétaire, sans choix de profil, avec des champs reliés à leur libellé', async ({ page }) => {
    await ouvrirInscription(page)

    await expect(page.getByText('Créez votre compte propriétaire')).toBeVisible()
    await expect(page.getByText('Je cherche un bien')).toHaveCount(0)
    for (const libelle of ['Nom', 'Prénom', 'Téléphone', 'Mot de passe', 'Confirmer']) {
      await expect(page.getByLabel(libelle, { exact: true })).toBeVisible()
    }
    await expect(page.getByLabel(/Email/)).toBeVisible()
  })

  test('une inscription réussie envoie le rôle propriétaire et ouvre le tableau de bord', async ({ page }) => {
    const calls = await ouvrirInscription(page, { register: { status: 201, body: { access_token: 'a.e30.b', refresh_token: 'r-3', user: userOf('proprietaire') } } })
    await sInscrire(page)

    await page.waitForURL('**/proprietaire')
    expect(bodyOf(posts(calls, '/auth/register')[0])).toEqual({
      role: 'proprietaire', nom: 'Dupont', prenom: 'Jean', password: MOT_DE_PASSE, site_web: '', telephone: NUMERO_INTERNATIONAL,
    })
  })

  test('sans jeton à l’inscription, le code reçu par SMS est demandé puis valide la session', async ({ page }) => {
    const calls = await ouvrirInscription(page, {
      register: { status: 201, body: { id: 77 } },
      loginPhone: exigeOtp,
      otpVerify: session('proprietaire', { device_token: 'appareil-inscription' }),
    })
    await sInscrire(page)

    await expect(page.getByRole('heading', { name: 'Vérification' })).toBeVisible()
    expect(posts(calls, '/auth/login/phone')).toHaveLength(1)
    await casesOtp(page).first().click()
    await page.keyboard.type('135790')

    await page.waitForURL('**/proprietaire')
    expect(bodyOf(posts(calls, '/auth/otp/verify')[0])).toEqual({ session_token: 'sess-1', code: '135790' })
    expect(await page.evaluate(() => localStorage.getItem('rg_device_token'))).toBe('appareil-inscription')
  })

  test('un numéro déjà utilisé affiche le message du serveur et conserve la saisie', async ({ page }) => {
    await ouvrirInscription(page, { register: { status: 409, body: { message: 'Ce numéro de téléphone est déjà utilisé.' } } })
    await sInscrire(page)

    await expect(page.getByRole('alert')).toContainText('Ce numéro de téléphone est déjà utilisé.')
    await expect(page.getByLabel('Téléphone', { exact: true })).toHaveValue(NUMERO)
    await expect(page.getByLabel('Nom', { exact: true })).toHaveValue('Dupont')
  })

  test('une panne du serveur à l’inscription affiche un message de service indisponible', async ({ page }) => {
    // 500 : pas de nouvelle tentative automatique (réservée aux 502/503/504 et coupures réseau).
    await ouvrirInscription(page, { register: { status: 500, body: { message: 'Internal server error' } } })
    await sInscrire(page)

    await expect(page.getByRole('alert')).toContainText('momentanément indisponible')
  })

  test('un envoi dans les trois premières secondes est refusé (anti-robot)', async ({ page }) => {
    const calls = await ouvrirInscription(page)
    await remplir(page, VALIDE)
    // Soumission immédiate depuis le clavier, avant la fin du délai minimal.
    await page.getByLabel('Confirmer', { exact: true }).press('Enter')

    await expect(page.getByRole('alert')).toContainText('Vérifiez vos informations puis validez à nouveau.')
    expect(posts(calls, '/auth/register')).toHaveLength(0)
  })

  const refus: { titre: string; saisie: Partial<Saisie>; message: string }[] = [
    { titre: 'un prénom d’un seul caractère', saisie: { prenom: 'J' }, message: 'Votre prénom doit comporter au moins 2 caractères.' },
    { titre: 'un nom d’un seul caractère', saisie: { nom: 'D' }, message: 'Votre nom doit comporter au moins 2 caractères.' },
    { titre: 'un prénom fait uniquement d’espaces', saisie: { prenom: '   ' }, message: 'Renseignez votre prénom.' },
    { titre: 'un téléphone de 9 chiffres', saisie: { telephone: '019712345' }, message: 'saisissez 10 chiffres commençant par 01' },
    { titre: 'un téléphone sans le préfixe 01', saisie: { telephone: '0697123456' }, message: 'saisissez 10 chiffres commençant par 01' },
    { titre: 'un mot de passe de moins de 8 caractères', saisie: { motDePasse: 'Court1', confirmation: 'Court1' }, message: 'Mot de passe trop court (8 caractères min.)' },
    { titre: 'une confirmation différente du mot de passe', saisie: { confirmation: 'AutreMotDePasse2' }, message: 'Les mots de passe ne correspondent pas' },
    { titre: 'des conditions non acceptées', saisie: { conditions: false }, message: "Veuillez accepter les conditions d'utilisation" },
  ]
  for (const cas of refus) {
    test(`refuse ${cas.titre} sans appeler le serveur (FE-B-004)`, async ({ page }) => {
      const calls = await ouvrirInscription(page)
      await sInscrire(page, { ...VALIDE, ...cas.saisie })

      await expect(page.getByRole('alert')).toContainText(cas.message)
      expect(posts(calls, '/auth/register')).toHaveLength(0)
    })
  }

  test('le message d’un prénom invalide apparaît dès la sortie du champ et disparaît à la correction', async ({ page }) => {
    await ouvrirInscription(page)
    const prenom = page.getByLabel('Prénom', { exact: true })
    await prenom.fill('J')
    await prenom.blur()

    await expect(page.getByText('Votre prénom doit comporter au moins 2 caractères.')).toBeVisible()
    await expect(prenom).toHaveAttribute('aria-invalid', 'true')
    await prenom.fill('Jean')
    await expect(page.getByText('Votre prénom doit comporter au moins 2 caractères.')).toHaveCount(0)
  })

  test('la case des conditions se coche au clavier et renvoie vers la politique de confidentialité', async ({ page }) => {
    await ouvrirInscription(page)
    const case_ = page.getByLabel(/J'accepte les conditions/)
    await case_.focus()
    await page.keyboard.press('Space')
    await expect(case_).toBeChecked()

    const lien = page.getByRole('link', { name: 'politique de confidentialité' })
    await expect(lien).toHaveAttribute('href', '/confidentialite')
    await expect(lien).toHaveAttribute('target', '_blank')
    await expect(lien).toHaveAttribute('rel', /noreferrer|noopener/)
  })

  test('la politique de confidentialité liée est consultable', async ({ page }) => {
    await mockApp(page, { loggedIn: false })
    await page.goto('/confidentialite')

    await expect(page.getByRole('heading', { level: 1, name: 'Politique de confidentialité' })).toBeVisible()
  })

  // En attente des CGU (audit FE-B-003) : le texte juridique doit être fourni par l'équipe avant de lier la case.
  test.fixme('la case des conditions renvoie aussi vers les mentions légales', async ({ page }) => {
    // À FAIRE quand les CGU seront rédigées : src/components/ui/auth-switch.tsx (case des conditions) affiche
    // « conditions d'utilisation » en texte brut ; seul /confidentialite est lié, aucun lien vers /mentions-legales.
    await ouvrirInscription(page)

    await expect(page.getByRole('link', { name: /mentions légales|conditions d'utilisation/i })).toHaveAttribute('href', '/mentions-legales')
  })

  // L'inscription applique la page d'origine mémorisée, comme la connexion.
  test('après inscription, l’utilisateur retrouve la page d’origine mémorisée', async ({ page }) => {
    await mockApp(page, { loggedIn: false, mocks: { register: { status: 201, body: { access_token: 'a.e30.b', refresh_token: 'r-3', user: userOf('proprietaire') } } } })
    await page.addInitScript(() => sessionStorage.setItem('post_login_redirect', '/nouveau-bien'))
    await page.goto('/register')
    await sInscrire(page)

    await page.waitForURL('**/nouveau-bien')
    expect(await page.evaluate(() => sessionStorage.getItem('post_login_redirect'))).toBeNull()
  })

  test('après inscription, une destination externe mémorisée est ignorée', async ({ page }) => {
    await mockApp(page, { loggedIn: false, mocks: { register: { status: 201, body: { access_token: 'a.e30.b', refresh_token: 'r-3', user: userOf('proprietaire') } } } })
    await page.addInitScript(() => sessionStorage.setItem('post_login_redirect', 'https://exemple.test/piege'))
    await page.goto('/register')
    await sInscrire(page)

    await page.waitForURL('**/proprietaire')
    expect(new URL(page.url()).origin).toBe(new URL(await page.evaluate(() => location.origin)).origin)
  })

  test('« Se connecter » bascule vers le formulaire de connexion', async ({ page }) => {
    await ouvrirInscription(page)
    await page.getByRole('button', { name: 'Se connecter' }).click()

    await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible()
  })
})

// ─── Accessibilité de base au clavier ────────────────────────────────────────

/** Indicateur de focus visible : contour ou ombre portée sur l'élément, ou sur son conteneur de champ. */
async function aUnIndicateurDeFocus(element: Locator): Promise<boolean> {
  return element.evaluate(el => {
    const porteurs = [el, el.closest('.auth-phone')].filter((n): n is Element => n !== null)
    return porteurs.some(n => {
      const style = getComputedStyle(n)
      return style.boxShadow !== 'none' || (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0)
    })
  })
}

test.describe('P2 accessibilité au clavier des formulaires', () => {
  test('la connexion se fait entièrement au clavier, dans l’ordre des champs, avec un focus visible', async ({ page }) => {
    const calls = await ouvrir(page, '/login', { loginPhone: session('locataire') })
    const telephone = page.getByLabel('Numéro de téléphone')
    const motDePasse = page.getByLabel('Mot de passe', { exact: true })
    const soumettre = page.getByRole('button', { name: 'Se connecter' })

    await telephone.focus()
    await expect(telephone).toBeFocused()
    expect(await aUnIndicateurDeFocus(telephone)).toBe(true)
    await page.keyboard.type(NUMERO)
    await page.keyboard.press('Tab')
    await expect(motDePasse).toBeFocused()
    expect(await aUnIndicateurDeFocus(motDePasse)).toBe(true)
    await page.keyboard.type(MOT_DE_PASSE)
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Afficher le mot de passe' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Mot de passe oublié ?' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(soumettre).toBeFocused()
    expect(await aUnIndicateurDeFocus(soumettre)).toBe(true)
    await page.keyboard.press('Enter')

    await page.waitForURL(url => url.pathname === '/')
    expect(posts(calls, '/auth/login/phone')).toHaveLength(1)
  })

  test('l’erreur de connexion est annoncée (role=alert) et reliée au formulaire', async ({ page }) => {
    await ouvrir(page, '/login', { loginPhone: { status: 401, body: { message: 'Unauthorized' } } })
    await seConnecter(page)

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByLabel('Numéro de téléphone')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('form')).toHaveAttribute('aria-describedby', 'login-error')
  })

  test('l’indicatif pays du téléphone est atteignable au clavier avec un nom accessible', async ({ page }) => {
    await ouvrir(page, '/login')
    const indicatif = page.getByLabel('Indicatif pays')

    await indicatif.focus()
    await expect(indicatif).toBeFocused()
    await indicatif.selectOption('+228')
    await expect(indicatif).toHaveValue('+228')
  })

  test('chaque case du code OTP a un nom accessible et le focus avance de case en case', async ({ page }) => {
    await ouvrir(page, '/login', { loginPhone: exigeOtp })
    await seConnecter(page)
    const cases = casesOtp(page)

    await expect(cases).toHaveCount(6)
    await cases.first().click()
    await page.keyboard.type('12')
    await expect(cases.nth(2)).toBeFocused()
    await page.keyboard.press('Backspace')
    await expect(cases.nth(1)).toBeFocused()
  })

  test('les champs du formulaire d’inscription s’enchaînent au clavier dans l’ordre de lecture', async ({ page }) => {
    await ouvrirInscription(page)
    const ordre = [
      page.getByLabel('Nom', { exact: true }),
      page.getByLabel('Prénom', { exact: true }),
      page.getByLabel('Indicatif pays'),
      page.getByLabel('Téléphone', { exact: true }),
      page.getByLabel(/Email/),
      page.getByLabel('Mot de passe', { exact: true }),
    ]
    await ordre[0].focus()
    for (const champ of ordre) {
      await expect(champ).toBeFocused()
      await page.keyboard.press('Tab')
    }
  })
})
