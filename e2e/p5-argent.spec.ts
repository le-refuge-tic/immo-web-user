import { expect, test, type Page } from '@playwright/test'
import { mockApp, type ApiCall, type Mock, type Mocks } from './support/mockApi'

// P5 — Argent : portefeuille, retrait, recharge, historique des paiements (FE-F-003).

/** Motif d'un montant formaté en fr-FR (l'espace des milliers peut être insécable ou fine). */
const fcfa = (n: number) => new RegExp(`${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '[\\s\\u202f\\u00a0]')}\\s*FCFA`)

const NUMERO = '0197123456'
const posts = (calls: ApiCall[], path: string) => calls.filter(c => c.method === 'POST' && c.path === path)
const gets = (calls: ApiCall[], path: string) => calls.filter(c => c.method === 'GET' && c.path === path)
const cle = (call: ApiCall) => call.headers['idempotency-key']
const bodyOf = (call: ApiCall): Record<string, unknown> => JSON.parse(call.body ?? '{}') as Record<string, unknown>

/** Solde différent selon le wallet demandé (`?type=`). */
const soldes = (parType: Record<string, number>): Mock => req => {
  const type = new URL(req.url()).searchParams.get('type') ?? ''
  return { status: 200, body: { type, balance: parType[type] ?? 0, updated_at: '2026-10-01T10:00:00Z' } }
}

// ─── Portefeuille du client (cotisation / épargne) ───────────────────────────

const clientMocks = (extra: Mocks = {}): Mocks => ({
  solde: soldes({ cotisation: 12000, epargne: 8000 }),
  transactions: req => {
    const type = new URL(req.url()).searchParams.get('type')
    return {
      status: 200,
      body: {
        data:
          type === 'epargne'
            ? [
                { id: 1, type: 'depot', description: 'Dépôt MTN MoMo', amount: 10000, balance_after: 10000, created_at: '2026-09-20T08:00:00Z' },
                { id: 2, type: 'retrait', description: 'Retrait épargne', amount: 2000, balance_after: 8000, created_at: '2026-09-25T08:00:00Z' },
              ]
            : [],
      },
    }
  },
  ...extra,
})

async function ouvrirRetraitEpargne(page: Page) {
  await page.goto('/portefeuille')
  await page.getByRole('button', { name: 'Épargne', exact: true }).click()
  await expect(page.getByText(fcfa(8000)).first()).toBeVisible()
  await page.getByRole('button', { name: 'Retirer' }).click()
  return page.getByRole('dialog', { name: 'Demander un retrait — Épargne' })
}

test.describe('P5 portefeuille du client', () => {
  test('affiche le solde de la cotisation puis celui de l’épargne avec leur historique', async ({ page }) => {
    await mockApp(page, { role: 'locataire', mocks: clientMocks() })
    await page.goto('/portefeuille')

    await expect(page.getByText(/Solde cotisation/i)).toBeVisible()
    await expect(page.getByText(fcfa(12000)).first()).toBeVisible()
    await expect(page.getByText('Aucune transaction')).toBeVisible()

    await page.getByRole('button', { name: 'Épargne', exact: true }).click()
    await expect(page.getByText(/Solde épargne/i)).toBeVisible()
    await expect(page.getByText(fcfa(8000)).first()).toBeVisible()
    await expect(page.getByText('Dépôt MTN MoMo')).toBeVisible()
    await expect(page.getByText('Retrait épargne')).toBeVisible()
  })

  test('un retrait supérieur au solde garde le bouton « Confirmer » désactivé et n’envoie rien', async ({ page }) => {
    const calls = await mockApp(page, { role: 'locataire', mocks: clientMocks() })
    const dialog = await ouvrirRetraitEpargne(page)

    await dialog.getByLabel('Montant à retirer (FCFA)').fill('9000')

    await expect(dialog.getByRole('button', { name: 'Confirmer' })).toBeDisabled()
    expect(posts(calls, '/retraits/me')).toHaveLength(0)
  })

  // Défaut FE-B-015 : seul l'onglet Portefeuille du propriétaire explique le refus dès la saisie.
  test.fixme('un montant supérieur au solde affiche un message dès la saisie (FE-B-015)', async ({ page }) => {
    // DÉFAUT : src/pages/wallet/PortefeuillePage.tsx:192-199 (vue client) et :343-350 (vue propriétaire)
    // se contentent de désactiver « Confirmer » ; messageMontantRetrait (utils/retrait.ts) n'y est pas utilisé.
    await mockApp(page, { role: 'locataire', mocks: clientMocks() })
    const dialog = await ouvrirRetraitEpargne(page)

    await dialog.getByLabel('Montant à retirer (FCFA)').fill('9000')

    await expect(dialog.getByText(/dépasse votre solde/)).toBeVisible()
  })

  // Défaut : le minimum de 500 FCFA annoncé n'est pas appliqué côté interface.
  test.fixme('un retrait sous le minimum de 500 FCFA est refusé avant l’envoi', async ({ page }) => {
    // DÉFAUT : src/pages/wallet/PortefeuillePage.tsx:96 et :199 ne contrôlent que « montant > 0 » et « <= solde » ;
    // l'attribut min={500} (ligne 192) n'empêche pas l'envoi d'un retrait de 300 FCFA.
    const calls = await mockApp(page, { role: 'locataire', mocks: clientMocks() })
    const dialog = await ouvrirRetraitEpargne(page)

    await dialog.getByLabel('Montant à retirer (FCFA)').fill('300')

    await expect(dialog.getByText(/minimum/i).last()).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Confirmer' })).toBeDisabled()
    expect(posts(calls, '/retraits/me')).toHaveLength(0)
  })

  test('un retrait valide envoie la demande sur le wallet épargne et confirme l’envoi', async ({ page }) => {
    const calls = await mockApp(page, {
      role: 'locataire',
      mocks: clientMocks({ demandeRetrait: { status: 201, body: { id: 5, statut: 'en_attente' } } }),
    })
    const dialog = await ouvrirRetraitEpargne(page)
    await dialog.getByLabel('Montant à retirer (FCFA)').fill('3000')
    await dialog.getByRole('button', { name: 'Confirmer' }).click()

    await expect(page.getByText('Demande de retrait envoyée — en attente de validation.')).toBeVisible()
    await expect(dialog).toHaveCount(0)
    expect(posts(calls, '/retraits/me')).toHaveLength(1)
    expect(bodyOf(posts(calls, '/retraits/me')[0])).toEqual({ montant: 3000, wallet_type: 'epargne' })
  })

  test('un double clic sur « Confirmer » ne crée qu’une seule demande de retrait', async ({ page }) => {
    const calls = await mockApp(page, {
      role: 'locataire',
      mocks: clientMocks({ demandeRetrait: { status: 201, body: { id: 5 }, delayMs: 600 } }),
    })
    const dialog = await ouvrirRetraitEpargne(page)
    await dialog.getByLabel('Montant à retirer (FCFA)').fill('3000')
    await dialog.getByRole('button', { name: 'Confirmer' }).dblclick()

    await expect(page.getByText('Demande de retrait envoyée — en attente de validation.')).toBeVisible()
    expect(posts(calls, '/retraits/me')).toHaveLength(1)
  })

  test('un refus du serveur sur le retrait affiche un message et permet de renvoyer la demande', async ({ page }) => {
    await mockApp(page, {
      role: 'locataire',
      mocks: clientMocks({ demandeRetrait: { status: 400, body: { message: 'Maximum 3 retraits par 24 heures.' } } }),
    })
    const dialog = await ouvrirRetraitEpargne(page)
    await dialog.getByLabel('Montant à retirer (FCFA)').fill('3000')
    await dialog.getByRole('button', { name: 'Confirmer' }).click()

    await expect(dialog.getByText('Maximum 3 retraits par 24 heures.')).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Confirmer' })).toBeEnabled()
  })

  test('une panne de l’API affiche une erreur avec « Réessayer » et non « 0 FCFA / Aucune transaction »', async ({ page }) => {
    let panne = true
    const reponse = (corps: unknown): Mock => () => (panne ? { status: 500, body: { message: 'boom' } } : { status: 200, body: corps })
    await mockApp(page, {
      role: 'locataire',
      mocks: { solde: reponse({ balance: 12000 }), transactions: reponse({ data: [] }) },
    })
    await page.goto('/portefeuille')

    await expect(page.getByText('Impossible de charger votre portefeuille')).toBeVisible()
    await expect(page.getByText('Aucune transaction')).toHaveCount(0)
    await expect(page.getByText(/^0 FCFA$/)).toHaveCount(0)
    panne = false
    await page.getByRole('button', { name: 'Réessayer' }).click()
    await expect(page.getByText(fcfa(12000)).first()).toBeVisible()
  })
})

// ─── Portefeuille commissions (/portefeuille avec le rôle propriétaire) ──────

const commissions: Mocks = {
  solde: { status: 200, body: { balance: 90000, updated_at: '2026-10-01T10:00:00Z' } },
  transactions: {
    status: 200,
    body: {
      data: [
        { id: 11, type: 'paiement_loyer', libelle: 'Loyer octobre', amount: 45000, statut: 'confirme', created_at: '2026-10-02T09:00:00Z', reference: 'LOY-1' },
        { id: 12, type: 'frais_visite', libelle: 'Frais de visite', amount: 500, statut: 'confirme', created_at: '2026-10-03T09:00:00Z', reference: 'VIS-1' },
        { id: 13, type: 'paiement_loyer', libelle: 'Loyer septembre', amount: 30000, statut: 'en_attente', created_at: '2026-09-02T09:00:00Z', reference: 'LOY-0' },
      ],
    },
  },
}

test.describe('P5 portefeuille des commissions', () => {
  test('le filtre « Loyers » recalcule le total et le détail s’ouvre dans une fenêtre', async ({ page }) => {
    await mockApp(page, { role: 'proprietaire', mocks: commissions })
    await page.goto('/portefeuille')

    await expect(page.getByText('Solde disponible')).toBeVisible()
    await expect(page.getByText(fcfa(90000)).first()).toBeVisible()
    await expect(page.getByText('3 transactions')).toBeVisible()

    await page.getByRole('button', { name: 'Loyers', exact: true }).click()
    await expect(page.getByText('2 transactions')).toBeVisible()
    await expect(page.getByText(fcfa(75000)).first()).toBeVisible()

    await page.getByRole('button', { name: /Loyer mensuel — .*LOY-1/ }).click()
    const detail = page.getByRole('dialog', { name: 'Détail de la transaction' })
    await expect(detail).toBeVisible()
    await expect(detail.getByText(fcfa(45000))).toBeVisible()
    await expect(detail.getByText('LOY-1')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(detail).toHaveCount(0)
  })
})

// ─── Onglet Portefeuille du tableau de bord propriétaire ────────────────────

const proprioMocks = (extra: Mocks = {}): Mocks => ({
  solde: { status: 200, body: { balance: 90000, updated_at: '2026-10-01T10:00:00Z' } },
  numeroRetrait: { status: 200, body: { numero_retrait: '+2290197123456', masque: '+229 01 •• •• 56', source: 'compte' } },
  ...extra,
})

async function ouvrirRetraitProprietaire(page: Page) {
  await page.goto('/proprietaire')
  await page.getByRole('button', { name: /Portefeuille/ }).first().click()
  await expect(page.getByText('Solde disponible').first()).toBeVisible()
  await page.getByRole('button', { name: 'Demander un retrait' }).click()
  return page.getByRole('dialog', { name: 'Demander un retrait' })
}

test.describe('P5 onglet Portefeuille du propriétaire', () => {
  test('affiche un message dès la saisie quand le montant dépasse le solde (FE-B-015)', async ({ page }) => {
    const calls = await mockApp(page, { role: 'proprietaire', mocks: proprioMocks() })
    const dialog = await ouvrirRetraitProprietaire(page)

    await dialog.getByLabel('Montant à retirer').fill('100000')
    await expect(dialog.getByText(/dépasse votre solde disponible/)).toBeVisible()
    await expect(dialog.getByLabel('Montant à retirer')).toHaveAttribute('aria-invalid', 'true')

    await dialog.getByLabel('Montant à retirer').fill('300')
    await expect(dialog.getByText(/minimum de retrait est de 500/)).toBeVisible()

    await dialog.getByRole('button', { name: 'Confirmer le retrait' }).click()
    await expect(dialog.getByRole('alert')).toContainText('Montant minimum : 500 FCFA.')
    expect(posts(calls, '/retraits/me')).toHaveLength(0)
  })

  test('un retrait valide affiche le récapitulatif puis la confirmation, sur le wallet des revenus locatifs', async ({ page }) => {
    const calls = await mockApp(page, { role: 'proprietaire', mocks: proprioMocks({ demandeRetrait: { status: 201, body: { id: 9 } } }) })
    const dialog = await ouvrirRetraitProprietaire(page)

    await dialog.getByLabel('Montant à retirer').fill('5000')
    await expect(dialog.getByLabel('Récapitulatif du retrait')).toContainText('85')
    await dialog.getByRole('button', { name: 'Confirmer le retrait' }).click()

    await expect(page.getByRole('dialog', { name: 'Demande de retrait envoyée' })).toBeVisible()
    expect(bodyOf(posts(calls, '/retraits/me')[0])).toEqual({ montant: 5000, wallet_type: 'revenus_locatifs' })
  })

  test('un refus du serveur reste affiché dans la fenêtre de retrait', async ({ page }) => {
    await mockApp(page, { role: 'proprietaire', mocks: proprioMocks({ demandeRetrait: { status: 400, body: { message: 'Maximum 3 retraits par 24 heures.' } } }) })
    const dialog = await ouvrirRetraitProprietaire(page)
    await dialog.getByLabel('Montant à retirer').fill('5000')
    await dialog.getByRole('button', { name: 'Confirmer le retrait' }).click()

    await expect(dialog.getByRole('alert')).toContainText('Maximum 3 retraits par 24 heures.')
  })

  test('le numéro de retrait se change avec le mot de passe puis le code reçu par SMS', async ({ page }) => {
    const calls = await mockApp(page, {
      role: 'proprietaire',
      mocks: proprioMocks({
        numeroRetraitInitier: { status: 201, body: { session_token: 'sess-nr', expires_in: 300, nouveau_numero: '0198765432' } },
        numeroRetraitConfirmer: { status: 201, body: { ok: true } },
      }),
    })
    const dialog = await ouvrirRetraitProprietaire(page)
    await expect(dialog.getByText('+229 01 •• •• 56')).toBeVisible()
    await dialog.getByRole('button', { name: 'Changer' }).click()

    const modale = page.getByRole('dialog', { name: 'Numéro de retrait' })
    await modale.getByRole('button', { name: 'Recevoir le code' }).click()
    await expect(modale.getByText(/commençant par 01/)).toBeVisible()

    await modale.getByLabel('Nouveau numéro Mobile Money').fill('0198765432')
    await modale.getByLabel('Mot de passe (confirmation)').fill('Secret123')
    await modale.getByRole('button', { name: 'Recevoir le code' }).click()
    await expect(modale.getByText(/Entrez le code reçu par SMS/)).toBeVisible()

    await modale.getByPlaceholder('Code à 6 chiffres').fill('123456')
    await modale.getByRole('button', { name: 'Confirmer' }).click()

    await expect(modale).toHaveCount(0)
    expect(bodyOf(posts(calls, '/wallets/me/numero-retrait/initier')[0])).toEqual({ nouveau_numero: '0198765432', mot_de_passe: 'Secret123' })
    expect(bodyOf(posts(calls, '/wallets/me/numero-retrait/confirmer')[0])).toEqual({ session_token: 'sess-nr', code_otp: '123456', nouveau_numero: '0198765432' })
    await expect.poll(() => gets(calls, '/wallets/me/numero-retrait').length).toBeGreaterThanOrEqual(2)
  })

  test('un code SMS erroné laisse la fenêtre ouverte avec un message', async ({ page }) => {
    await mockApp(page, {
      role: 'proprietaire',
      mocks: proprioMocks({
        numeroRetraitInitier: { status: 201, body: { session_token: 'sess-nr', expires_in: 300, nouveau_numero: '0198765432' } },
        numeroRetraitConfirmer: { status: 400, body: { message: 'Code incorrect ou expiré.' } },
      }),
    })
    const dialog = await ouvrirRetraitProprietaire(page)
    await dialog.getByRole('button', { name: 'Changer' }).click()
    const modale = page.getByRole('dialog', { name: 'Numéro de retrait' })
    await modale.getByLabel('Nouveau numéro Mobile Money').fill('0198765432')
    await modale.getByLabel('Mot de passe (confirmation)').fill('Secret123')
    await modale.getByRole('button', { name: 'Recevoir le code' }).click()
    await modale.getByPlaceholder('Code à 6 chiffres').fill('000000')
    await modale.getByRole('button', { name: 'Confirmer' }).click()

    await expect(modale.getByText('Code incorrect ou expiré.')).toBeVisible()
  })
})

// ─── Recharge d'un wallet ────────────────────────────────────────────────────

const recharger = (page: Page) => page.getByRole('button', { name: /^Recharger via/ })

async function ouvrirRecharge(page: Page, mocks: Mocks, saisie = { montant: '5000', numero: NUMERO }) {
  const calls = await mockApp(page, { role: 'locataire', mocks })
  await page.goto('/portefeuille/recharger/epargne')
  await page.getByPlaceholder('Ex. 5 000').fill(saisie.montant)
  await page.getByLabel('Numéro Mobile Money').fill(saisie.numero)
  return calls
}

test.describe('P5 recharge du wallet', () => {
  test('le bouton reste désactivé sous 100 FCFA et l’aide rappelle le minimum', async ({ page }) => {
    await mockApp(page, { role: 'locataire' })
    await page.goto('/portefeuille/recharger/cotisation')

    await expect(page.getByRole('heading', { name: 'Recharger — cotisation' })).toBeVisible()
    await expect(recharger(page)).toBeDisabled()
    await expect(page.getByText('Saisissez un montant (100 FCFA minimum)')).toBeVisible()
    await page.getByPlaceholder('Ex. 5 000').fill('50')
    await expect(recharger(page)).toBeDisabled()
    await page.getByRole('button', { name: '5k', exact: true }).click()
    await expect(recharger(page)).toBeEnabled()
  })

  test('un numéro de moins de 10 chiffres est refusé avec le format attendu, sans appel réseau', async ({ page }) => {
    const calls = await ouvrirRecharge(page, {}, { montant: '5000', numero: '019712345' })
    await recharger(page).click()

    await expect(page.getByRole('alert')).toContainText('saisissez 10 chiffres commençant par 01')
    expect(posts(calls, '/paiements/depot')).toHaveLength(0)
  })

  test('la saisie du numéro est limitée à 10 chiffres', async ({ page }) => {
    await mockApp(page, { role: 'locataire' })
    await page.goto('/portefeuille/recharger/epargne')
    const champ = page.getByLabel('Numéro Mobile Money')
    await champ.pressSequentially('01971234567890')

    await expect(champ).toHaveValue('0197123456')
  })

  test('la recharge est initiée avec le montant, le numéro international et une clé d’idempotence, puis suivie jusqu’au succès', async ({ page }) => {
    const calls = await ouvrirRecharge(page, {
      depot: { status: 201, body: { reference: 'dep-1', statut: 'en_attente' } },
      depotStatut: () => ({ status: 200, body: { statut: 'reussi' } }),
    })
    await recharger(page).click()

    await expect(page.getByText('En attente de confirmation…')).toBeVisible()
    await expect(page.getByText('Wallet épargne rechargé !')).toBeVisible()
    const depots = posts(calls, '/paiements/depot')
    expect(depots).toHaveLength(1)
    expect(bodyOf(depots[0])).toEqual({ wallet_type: 'epargne', montant: 5000, methode_paiement: 'momo', telephone: '+2290197123456' })
    expect(cle(depots[0])).toBeTruthy()
    expect(gets(calls, '/paiements/depot/dep-1/statut').length).toBeGreaterThan(0)
  })

  test('un refus de l’opérateur pendant le suivi affiche un message et permet de réessayer', async ({ page }) => {
    await ouvrirRecharge(page, {
      depot: { status: 201, body: { reference: 'dep-2', statut: 'en_attente' } },
      depotStatut: () => ({ status: 200, body: { statut: 'echoue' } }),
    })
    await recharger(page).click()

    await expect(page.getByRole('alert')).toContainText("Paiement refusé par l'opérateur.")
    await expect(recharger(page)).toBeEnabled()
  })

  test('une recharge confirmée immédiatement affiche le succès sans suivi', async ({ page }) => {
    const calls = await ouvrirRecharge(page, { depot: { status: 201, body: { statut: 'confirme' } } })
    await recharger(page).click()

    await expect(page.getByText('Wallet épargne rechargé !')).toBeVisible()
    expect(gets(calls, '/paiements/depot/undefined/statut')).toHaveLength(0)
  })

  test('un double clic ne lance qu’une seule initiation', async ({ page }) => {
    const calls = await ouvrirRecharge(page, { depot: { status: 201, body: { reference: 'dep-3', statut: 'en_attente' }, delayMs: 600 } })
    await recharger(page).dblclick()

    await expect(page.getByText('En attente de confirmation…')).toBeVisible()
    expect(posts(calls, '/paiements/depot')).toHaveLength(1)
  })

  test('409 « déjà en cours » : le suivi de la recharge existante est repris sans doubler la demande', async ({ page }) => {
    const calls = await ouvrirRecharge(page, {
      depot: { status: 409, body: { code: 'PAIEMENT_EN_ATTENTE', referenceId: 'dep-existante', message: 'Un paiement est déjà en cours.' } },
      depotStatut: () => ({ status: 200, body: { statut: 'reussi' } }),
    })
    await recharger(page).click()

    await expect(page.getByText('En attente de confirmation…')).toBeVisible()
    await expect(page.getByText('Wallet épargne rechargé !')).toBeVisible()
    expect(posts(calls, '/paiements/depot')).toHaveLength(1)
    expect(gets(calls, '/paiements/depot/dep-existante/statut').length).toBeGreaterThan(0)
  })

  test('réponse perdue (502) : la relance réutilise la même clé d’idempotence', async ({ page }) => {
    let essais = 0
    const calls = await ouvrirRecharge(page, {
      depot: () => (++essais === 1 ? { status: 502, body: { message: 'bad gateway' } } : { status: 201, body: { reference: 'dep-4', statut: 'en_attente' } }),
    })
    await recharger(page).click()
    await expect(page.getByRole('alert')).toContainText('momentanément indisponible')
    await recharger(page).click()

    await expect(page.getByText('En attente de confirmation…')).toBeVisible()
    const depots = posts(calls, '/paiements/depot')
    expect(depots).toHaveLength(2)
    expect(cle(depots[0])).toBe(cle(depots[1]))
  })

  test('refus clair (400) : la nouvelle tentative utilise une nouvelle clé et le message du serveur est affiché', async ({ page }) => {
    let essais = 0
    const calls = await ouvrirRecharge(page, {
      depot: () => (++essais === 1 ? { status: 400, body: { message: 'Plafond de recharge dépassé.' } } : { status: 201, body: { reference: 'dep-5', statut: 'en_attente' } }),
    })
    await recharger(page).click()
    await expect(page.getByRole('alert')).toContainText('Plafond de recharge dépassé.')
    await recharger(page).click()

    await expect(page.getByText('En attente de confirmation…')).toBeVisible()
    const depots = posts(calls, '/paiements/depot')
    expect(depots).toHaveLength(2)
    expect(cle(depots[0])).not.toBe(cle(depots[1]))
  })

  test('« Annuler » pendant l’attente revient au formulaire et arrête le suivi', async ({ page }) => {
    const calls = await ouvrirRecharge(page, {
      depot: { status: 201, body: { reference: 'dep-6', statut: 'en_attente' } },
      depotStatut: () => ({ status: 200, body: { statut: 'en_attente' } }),
    })
    await recharger(page).click()
    await page.getByRole('button', { name: 'Annuler' }).click()

    await expect(recharger(page)).toBeVisible()
    const avant = gets(calls, '/paiements/depot/dep-6/statut').length
    await expect.poll(async () => gets(calls, '/paiements/depot/dep-6/statut').length, { timeout: 4000 }).toBe(avant)
  })

  // Défaut d'accessibilité : le champ du montant n'a ni étiquette ni nom accessible.
  test.fixme('le champ « Montant à recharger » est relié à son étiquette', async ({ page }) => {
    // DÉFAUT : src/pages/wallet/RechargementWalletPage.tsx:166-168 : le texte « Montant à recharger » est un <p>,
    // l'<input> n'a ni <label htmlFor> ni aria-label ; getByLabel ne le trouve pas.
    await mockApp(page, { role: 'locataire' })
    await page.goto('/portefeuille/recharger/epargne')

    await expect(page.getByLabel('Montant à recharger')).toBeVisible()
  })
})

// ─── Historique des paiements ────────────────────────────────────────────────

const HISTORIQUE = [
  { id: 1, type: 'frais_visite', statut: 'confirme', sens: 'paye', montant: 500, reference: 'VIS-100', methode_paiement: 'momo', telephone_paiement: '0197000001', visite_id: 7, created_at: '2026-10-01T09:00:00Z', bien: { quartier: 'Akpakpa', ville: 'Cotonou' } },
  { id: 2, type: 'loyer', statut: 'confirme', sens: 'recu', montant: 45000, reference: 'LOY-200', methode_paiement: 'flooz', created_at: '2026-10-02T09:00:00Z' },
  { id: 3, type: 'loyer', statut: 'confirme', sens: 'paye', montant: 30000, reference: 'LOY-201', methode_paiement: 'celtiis', created_at: '2026-10-03T09:00:00Z' },
  { id: 4, type: 'integration', statut: 'en_attente', sens: 'paye', montant: 100000, reference: 'INT-300', created_at: '2026-10-04T09:00:00Z' },
  { id: 5, type: 'depot_wallet', statut: 'echoue', sens: 'paye', montant: 5000, wallet_label: 'épargne', reference: 'DEP-400', created_at: '2026-10-05T09:00:00Z' },
  { id: 6, type: 'loyer', statut: 'rembourse', sens: 'paye', montant: 20000, reference: 'LOY-202', created_at: '2026-10-06T09:00:00Z' },
]

test.describe('P5 historique des paiements', () => {
  test('affiche chaque type avec son statut, « payé » ou « reçu » selon le sens (FE-B-007)', async ({ page }) => {
    await mockApp(page, { role: 'locataire', mocks: { historique: { status: 200, body: { data: HISTORIQUE } } } })
    await page.goto('/mes-paiements')

    const ligne = (nom: RegExp) => page.getByRole('button', { name: nom })
    await expect(ligne(/Frais de visite — Akpakpa, Cotonou/)).toContainText('Payé')
    await expect(ligne(/Loyer reçu/)).toContainText('Reçu')
    await expect(ligne(/Loyer mensuel — .*30000/)).toContainText('Payé')
    await expect(ligne(/Paiement d'intégration/)).toContainText('En attente')
    await expect(ligne(/Rechargement épargne/)).toContainText('Échoué')
    await expect(ligne(/Loyer mensuel — .*20000/)).toContainText('Remboursé')
  })

  test('« Total payé » ne compte que les paiements confirmés payés par l’utilisateur (FE-B-007)', async ({ page }) => {
    await mockApp(page, { role: 'locataire', mocks: { historique: { status: 200, body: { data: HISTORIQUE } } } })
    await page.goto('/mes-paiements')

    // 500 (visite) + 30 000 (loyer payé) ; ni l'en-attente, ni l'échoué, ni le remboursé, ni le loyer reçu.
    await expect(page.getByText('Total payé (confirmé)')).toBeVisible()
    await expect(page.getByText(fcfa(30500)).first()).toBeVisible()
    await expect(page.getByText(/Reçu :/)).toContainText('45')
    await expect(page.getByText('6 transactions')).toBeVisible()
  })

  test('le filtre « Visites » ne garde que les frais de visite', async ({ page }) => {
    await mockApp(page, { role: 'locataire', mocks: { historique: { status: 200, body: { data: HISTORIQUE } } } })
    await page.goto('/mes-paiements')
    await page.getByRole('button', { name: 'Visites', exact: true }).click()

    await expect(page.getByRole('button', { name: /Frais de visite/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Loyer (mensuel|reçu)/ })).toHaveCount(0)
  })

  test('le détail d’un paiement s’ouvre en modale avec référence, méthode et visite', async ({ page }) => {
    await mockApp(page, { role: 'locataire', mocks: { historique: { status: 200, body: { data: HISTORIQUE } } } })
    await page.goto('/mes-paiements')
    await page.getByRole('button', { name: /Frais de visite — Akpakpa/ }).click()

    const detail = page.getByRole('dialog', { name: 'Détail du paiement' })
    await expect(detail).toBeVisible()
    await expect(detail.getByText('VIS-100')).toBeVisible()
    await expect(detail.getByText('MTN MoMo')).toBeVisible()
    await expect(detail.getByText('#7')).toBeVisible()
    await expect(detail.getByText('Akpakpa')).toBeVisible()
    await expect(detail.getByRole('button', { name: 'Télécharger le reçu' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(detail).toHaveCount(0)
  })

  test('un paiement en attente n’offre pas de reçu à télécharger', async ({ page }) => {
    await mockApp(page, { role: 'locataire', mocks: { historique: { status: 200, body: { data: HISTORIQUE } } } })
    await page.goto('/mes-paiements')
    await page.getByRole('button', { name: /Paiement d'intégration/ }).click()

    const detail = page.getByRole('dialog', { name: 'Détail du paiement' })
    await expect(detail.getByText('INT-300')).toBeVisible()
    await expect(detail.getByRole('button', { name: 'Télécharger le reçu' })).toHaveCount(0)
  })

  test('sans paiement, la page affiche l’état vide et un total à zéro', async ({ page }) => {
    await mockApp(page, { role: 'locataire', mocks: { historique: { status: 200, body: { data: [] } } } })
    await page.goto('/mes-paiements')

    await expect(page.getByText('Aucune transaction')).toBeVisible()
    await expect(page.getByText('0 FCFA').first()).toBeVisible()
  })

  test('une panne affiche l’erreur avec « Réessayer », jamais un historique vide', async ({ page }) => {
    let panne = true
    await mockApp(page, {
      role: 'locataire',
      mocks: { historique: () => (panne ? { status: 500, body: { message: 'boom' } } : { status: 200, body: { data: HISTORIQUE } }) },
    })
    await page.goto('/mes-paiements')

    await expect(page.getByText('Erreur de chargement')).toBeVisible()
    await expect(page.getByText('Aucune transaction')).toHaveCount(0)
    panne = false
    await page.getByRole('button', { name: 'Réessayer' }).click()
    await expect(page.getByRole('button', { name: /Frais de visite/ })).toBeVisible()
  })
})
