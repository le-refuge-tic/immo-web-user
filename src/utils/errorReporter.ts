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
    import('@sentry/react')
      .then(({ captureException, withScope }) => {
        withScope(scope => {
          if (ctx?.componentStack) scope.setExtra('componentStack', ctx.componentStack)
          if (ctx?.extra) Object.entries(ctx.extra).forEach(([k, v]) => scope.setExtra(k, v))
          captureException(error)
        })
      })
      .catch(() => {/* Sentry not installed — fail silently */})
  }
}

export const errorReporter = { send }
