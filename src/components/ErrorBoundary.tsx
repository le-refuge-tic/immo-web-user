import { Component, type ErrorInfo, type ReactNode } from 'react'
import { errorReporter } from '../utils/errorReporter'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  /** Quand cette clé change (ex. le chemin de la page), l'erreur est effacée et les enfants sont rendus de nouveau. */
  resetKey?: string
  /** Reste dans la mise en page (barres de navigation conservées) au lieu d'occuper tout l'écran. */
  compact?: boolean
}

interface State {
  hasError: boolean
}

interface FallbackProps {
  onRetry: () => void
  compact?: boolean
}

/**
 * Écran de repli d'une erreur de rendu (FE-A-005). Le message technique de
 * l'exception n'est jamais montré à l'utilisateur : il part dans Sentry.
 */
export function RenderErrorFallback({ onRetry, compact = false }: FallbackProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center px-6 text-center ${compact ? 'py-24' : 'min-h-dvh'}`}
    >
      <p className="text-2xl mb-2" aria-hidden="true">😕</p>
      <h1 className="font-bold text-lg text-text-dark mb-1">Une erreur est survenue</h1>
      <p className="text-sm text-text-grey mb-6">Cet écran n'a pas pu s'afficher. Réessayez ou revenez à l'accueil.</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
        style={{ background: '#3A5AEE' }}
      >
        Réessayer
      </button>
      <a href="/" className="mt-4 text-sm font-semibold underline" style={{ color: 'var(--tx-blue)' }}>Retour à l'accueil</a>
    </div>
  )
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    errorReporter.send(error, { componentStack: info.componentStack })
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) this.handleReset()
  }

  handleReset = () => this.setState({ hasError: false })

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback
    return <RenderErrorFallback onRetry={this.handleReset} compact={this.props.compact} />
  }
}
