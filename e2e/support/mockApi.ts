import type { Page, Request, Route } from '@playwright/test'

const API = 'http://localhost:3000'

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
  'access-control-expose-headers': 'Retry-After',
}

export type MockResponse = { status: number; body: unknown }
export type Mock = MockResponse | ((req: Request, calls: ApiCall[]) => MockResponse)
export type Role = 'prospect' | 'locataire' | 'proprietaire' | 'demarcheur'

export interface ApiCall {
  method: string
  path: string
  headers: Record<string, string>
  body: string | null
}

/** Réponses simulées, par point d'accès. Un point d'accès absent répond par une liste vide. */
export interface Mocks {
  visites?: Mock
  biens?: Mock
  bienDetail?: Mock
  conversations?: Mock
  messages?: Mock
  payer?: Mock
  statut?: Mock
  refresh?: Mock
  reserver?: Mock
  creerConv?: Mock
  numeroRetrait?: Mock
}

const FUTURE = new Date(Date.now() + 3 * 86_400_000).toISOString()

export const BIEN = {
  id: 1,
  type: 'chambre_salon',
  transaction: 'location',
  prix: 45000,
  frais_visite: 500,
  photos: [],
  localisation: { ville: 'Cotonou', quartier: 'Akpakpa' },
  amenites: {},
  statut: 'publie',
}

export const visite = (over: Record<string, unknown> = {}) => ({
  id: 7,
  bien_id: 1,
  bien: BIEN,
  statut: 'confirmee',
  date_souhaitee: FUTURE,
  frais_visite: 500,
  paiement_effectue: false,
  gestionnaire: { prenom: 'Koffi', nom: 'A' },
  ...over,
})

export const biensList = (count: number, start = 1) =>
  Array.from({ length: count }, (_, i) => ({ ...BIEN, id: start + i, prix: 30000 + (start + i) * 10 }))

const userOf = (role: Role) => ({
  id: 42,
  prenom: 'Awa',
  nom: 'Test',
  role,
  role_principal: role,
  roles_actifs: [role],
  photo_profil: null,
})

interface OpenOptions {
  role?: Role
  mocks?: Mocks
  loggedIn?: boolean
  theme?: 'light' | 'dark'
}

/** Prépare la page : session et préférences en localStorage, API simulée. Renvoie le journal des appels. */
export async function mockApp(page: Page, { role = 'prospect', mocks = {}, loggedIn = true, theme = 'light' }: OpenOptions = {}) {
  await page.emulateMedia({ colorScheme: theme })
  await page.addInitScript(
    ({ theme, user, loggedIn }) => {
      try {
        localStorage.setItem('theme', theme)
        localStorage.setItem('rg_theme', theme)
        localStorage.setItem('rg_theme_pref', theme)
        localStorage.setItem('rg_onboarding_done', '1')
        localStorage.setItem('rg_seen_onboarding', '1')
        localStorage.setItem('onboarding_done', '1')
        localStorage.setItem('rg_consent', JSON.stringify({ analytics: false, date: Date.now() }))
        localStorage.setItem('cookie_consent', 'refused')
        if (loggedIn) {
          localStorage.setItem('rg_token', 'a.e30.b')
          localStorage.setItem('rg_refresh', 'refresh-1')
          localStorage.setItem('rg_user', JSON.stringify(user))
          localStorage.setItem('rg_active_role', user.role)
        }
      } catch {
        /* stockage indisponible : le test échouera de lui-même */
      }
    },
    { theme, user: userOf(role), loggedIn },
  )

  const calls: ApiCall[] = []
  await page.route(`${API}/**`, async (route: Route) => {
    const req = route.request()
    const path = new URL(req.url()).pathname.replace('/api/v1', '')
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    calls.push({ method: req.method(), path, headers: req.headers(), body: req.postData() })

    const pick = (key: keyof Mocks): MockResponse | undefined => {
      const mock = mocks[key]
      return typeof mock === 'function' ? mock(req, calls) : mock
    }
    const method = req.method()
    let result: MockResponse | undefined
    if (method === 'GET' && path === '/visites') result = pick('visites')
    else if (method === 'GET' && path === '/biens') result = pick('biens')
    else if (method === 'GET' && path === '/chat/conversations') result = pick('conversations')
    else if (method === 'GET' && /^\/chat\/conversations\/\d+\/messages$/.test(path)) result = pick('messages')
    else if (method === 'POST' && path === '/paiements/visite') result = pick('payer')
    else if (method === 'GET' && /^\/paiements\/visite\/.+\/statut$/.test(path)) result = pick('statut')
    else if (method === 'POST' && path === '/auth/refresh') result = pick('refresh')
    else if (method === 'POST' && path === '/visites') result = pick('reserver')
    else if (method === 'POST' && path === '/chat/conversations') result = pick('creerConv')
    else if (method === 'GET' && /^\/biens\/\d+$/.test(path)) result = pick('bienDetail')
    else if (method === 'GET' && path === '/wallets/numero-retrait') result = pick('numeroRetrait')

    const fallback = path === '/visites' || path === '/biens' ? { data: [] } : {}
    return route.fulfill({
      status: result?.status ?? 200,
      headers: { ...CORS, 'content-type': 'application/json' },
      body: JSON.stringify(result ? result.body : fallback),
    })
  })
  return calls
}
