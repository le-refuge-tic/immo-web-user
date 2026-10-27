interface ErrorContext {
  componentStack?: string | null
  extra?: Record<string, unknown>
}

type SentryModule = typeof import('@sentry/react')

let sentryLoading: Promise<SentryModule | null> | null = null

/**
 * Charge et initialise Sentry à la demande (FE-F-004) : le paquet n'est
 * téléchargé que si `VITE_SENTRY_DSN` est renseigné, jamais pour les autres
 * visiteurs. Aucune donnée personnelle envoyée (défaut du SDK) ; les traces de performance
 * sont désactivées (la mesure se fait par web-vitals).
 */
function loadSentry(): Promise<SentryModule | null> {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return Promise.resolve(null)
  sentryLoading ??= import('@sentry/react')
    .then(sentry => {
      sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        release: __APP_RELEASE__,
        tracesSampleRate: 0,
        // Les gestionnaires globaux de Sentry captent déjà onerror et unhandledrejection
      })
      return sentry
    })
    .catch(() => null)
  return sentryLoading
}

/** À appeler une fois au démarrage : initialise Sentry pour capter aussi les erreurs globales. */
function init(): void {
  if (import.meta.env.DEV) return
  void loadSentry()
}

function send(error: unknown, ctx?: ErrorContext): void {
  if (import.meta.env.DEV) {
    console.error('[ErrorReporter]', error, ctx)
    return
  }
  void loadSentry().then(sentry => {
    if (!sentry) return
    sentry.withScope(scope => {
      if (ctx?.componentStack) scope.setExtra('componentStack', ctx.componentStack)
      if (ctx?.extra) Object.entries(ctx.extra).forEach(([key, value]) => scope.setExtra(key, value))
      sentry.captureException(error)
    })
  })
}

export const errorReporter = { init, send }
