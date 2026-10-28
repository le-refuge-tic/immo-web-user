import { createRequire } from 'node:module'
import { expect, test, type Page } from '@playwright/test'
import { BIEN, mockApp, type Mocks, type Role } from './support/mockApi'

// Contrastes (FE-C-004, FE-B-024) : en clair, axe-core color-contrast ne relève aucun nœud (hors
// logotype « REFUGE », exempté par WCAG 1.4.3) ; en sombre, aucun nœud de plus qu'en clair (critère
// de l'audit pour FE-B-024). Écrans corrigés le 27/10/2026 (espaces locataire, démarcheur,
// propriétaire, recharge, contrat de bail, messagerie). Mesure complète des 62 écrans et onglets :
// banc hors dépôt, voir le CHANGELOG.

const AXE = createRequire(import.meta.url).resolve('axe-core/axe.min.js')
const J = 86400000
const iso = (d: number) => new Date(Date.now() + d * J).toISOString()
const GEST = { id: 7, prenom: 'Koffi', nom: 'Adjovi', role: 'proprietaire' }
const LOYER = { id: 11, mois: iso(-30), date_echeance: iso(5), montant: 45000, statut: 'en_attente' }
const DONNEES: Mocks = {
  biens: { status: 200, body: { data: [BIEN, { ...BIEN, id: 2, statut_moderation: 'en_attente' }], total: 2 } },
  alertes: { status: 200, body: { data: [{ id: 2, type: 'info', titre: 'Visite confirmée', lu: false, created_at: iso(-1) }] } },
  routes: {
    'GET /loyers/mon-logement': {
      status: 200,
      body: {
        contrat: { loyer_mensuel: 45000, loyer_prepaye_mois: 2, prochain_paiement: iso(5) }, bien: BIEN, gestionnaire: GEST,
        loyers_en_attente: [LOYER], prochain_loyer: LOYER, mois_payes: 3, mois_dus: 1,
        historique_loyers: [{ mois: iso(-60), created_at: iso(-55), date_paiement: iso(-55), montant: 45000, transaction_id: 3 }],
      },
    },
    'GET /biens/mes-biens': { status: 200, body: { data: [BIEN, { ...BIEN, id: 2, statut_moderation: 'en_attente' }] } },
    'GET /biens/1': { status: 200, body: { ...BIEN, gestionnaire: GEST } },
  },
}

/** Cibles des nœuds color-contrast de la page affichée (le logotype « REFUGE » est exempté). */
async function noeudsContraste(page: Page): Promise<string[]> {
  await page.addScriptTag({ path: AXE })
  return page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (ctx: Document, opts: object) => Promise<unknown> } }).axe
    const r = await axe.run(document, { runOnly: { type: 'rule', values: ['color-contrast'] }, resultTypes: ['violations'] }) as { violations: { nodes: { target: string[]; html: string }[] }[] }
    return (r.violations[0]?.nodes ?? []).filter(n => !/>REFUGE<\/span>$/.test(n.html)).map(n => n.target.join(' '))
  })
}

async function mesurer(page: Page, theme: 'light' | 'dark', route: string, role: Role, onglet?: string) {
  await mockApp(page, { role, theme, mocks: DONNEES })
  await page.goto(route)
  if (onglet) await page.locator('aside').getByRole('button', { name: onglet, exact: true }).first().click()
  await page.waitForTimeout(1500)
  return noeudsContraste(page)
}

const ECRANS: { nom: string; route: string; role: Role; onglet?: string; bureau?: boolean }[] = [
  { nom: 'recharge', route: '/portefeuille/recharger/principal', role: 'prospect' },
  { nom: 'contrat de bail', route: '/contrat-bail/1', role: 'prospect' },
  { nom: 'espaces et rôles', route: '/mes-roles', role: 'prospect' },
  { nom: 'locataire : logement', route: '/locataire', role: 'locataire', onglet: 'Logement', bureau: true },
  { nom: 'locataire : activité', route: '/locataire', role: 'locataire', onglet: 'Activité', bureau: true },
  { nom: 'démarcheur : tableau', route: '/demarcheur', role: 'demarcheur', onglet: 'Tableau', bureau: true },
  { nom: 'démarcheur : mes biens', route: '/demarcheur', role: 'demarcheur', onglet: 'Mes biens', bureau: true },
  { nom: 'propriétaire', route: '/proprietaire', role: 'proprietaire', bureau: true },
]

for (const e of ECRANS) {
  test(`${e.nom} : aucun contraste insuffisant en clair, ni en plus en sombre`, async ({ browser }) => {
    const viewport = e.bureau ? { width: 1440, height: 900 } : { width: 390, height: 844 }
    const resultats: Record<string, string[]> = {}
    for (const theme of ['light', 'dark'] as const) {
      const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' })
      const page = await ctx.newPage()
      resultats[theme] = await mesurer(page, theme, e.route, e.role, e.onglet)
      await ctx.close()
    }
    expect(resultats.light).toEqual([])
    const clairs = new Set(resultats.light)
    expect(resultats.dark.filter(cible => !clairs.has(cible))).toEqual([])
  })
}
