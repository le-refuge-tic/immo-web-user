import { defineConfig, devices } from '@playwright/test'

const PORT = 5199
const isCI = !!process.env.CI

// L'API est entièrement simulée par les tests (page.route) : aucun backend n'est lancé.
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Téléphone par défaut : c'est le parcours principal des utilisateurs.
    viewport: { width: 390, height: 844 },
    contextOptions: { reducedMotion: 'reduce' },
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } }],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 60_000,
    env: { VITE_API_URL: 'http://localhost:3000/api/v1' },
  },
})
