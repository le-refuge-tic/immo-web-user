import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const sentryMock = {
  init: vi.fn(),
  captureException: vi.fn(),
  withScope: vi.fn((callback: (scope: { setExtra: typeof setExtra }) => void) => callback({ setExtra })),
}
const setExtra = vi.fn()

vi.mock('@sentry/react', () => sentryMock)

describe('errorReporter (FE-F-004)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.stubEnv('DEV', false)
  })
  afterEach(() => vi.unstubAllEnvs())

  it('sans DSN : Sentry n\'est jamais chargé', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '')
    const { errorReporter } = await import('../errorReporter')

    errorReporter.init()
    errorReporter.send(new Error('boom'))
    await Promise.resolve()

    expect(sentryMock.init).not.toHaveBeenCalled()
    expect(sentryMock.captureException).not.toHaveBeenCalled()
  })

  it('avec DSN : initialise une seule fois et remonte l\'erreur avec son contexte', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://cle@exemple.invalid/1')
    const { errorReporter } = await import('../errorReporter')
    const erreur = new Error('boom')

    errorReporter.send(erreur, { componentStack: 'in Page', extra: { type: 'test' } })
    errorReporter.send(erreur)
    await vi.waitFor(() => expect(sentryMock.captureException).toHaveBeenCalledTimes(2))

    expect(sentryMock.init).toHaveBeenCalledTimes(1)
    expect(sentryMock.init).toHaveBeenCalledWith(expect.objectContaining({ dsn: 'https://cle@exemple.invalid/1', tracesSampleRate: 0 }))
    expect(setExtra).toHaveBeenCalledWith('componentStack', 'in Page')
    expect(setExtra).toHaveBeenCalledWith('type', 'test')
  })
})
