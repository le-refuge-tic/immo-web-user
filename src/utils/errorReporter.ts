const DSN = import.meta.env.VITE_SENTRY_DSN

interface ErrorContext {
  componentStack?: string | null
  extra?: Record<string, unknown>
}

function send(error: unknown, ctx?: ErrorContext): void {
  if (import.meta.env.DEV) {
    console.error('[ErrorReporter]', error, ctx)
    return
  }
  if (DSN) {
    // Sentry lazy-loaded when DSN is configured
    // Spécificateur dynamique : @sentry/react est une dépendance optionnelle (non installée par défaut).
    const sentryModule = '@sentry/react'
    import(/* @vite-ignore */ sentryModule)
      .then(({ captureException, withScope }: any) => {
        withScope((scope: any) => {
          if (ctx?.componentStack) scope.setExtra('componentStack', ctx.componentStack)
          if (ctx?.extra) Object.entries(ctx.extra).forEach(([k, v]) => scope.setExtra(k, v))
          captureException(error)
        })
      })
      .catch(() => {/* Sentry not installed — fail silently */})
  }
}

export const errorReporter = { send }
