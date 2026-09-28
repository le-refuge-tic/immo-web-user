import { Component, type ErrorInfo, type ReactNode } from 'react'
import { errorReporter } from '../utils/errorReporter'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    errorReporter.send(error, { componentStack: info.componentStack })
  }

  handleReset = () => this.setState({ hasError: false, error: null })

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
          <p className="text-2xl mb-2">😕</p>
          <h1 className="font-bold text-lg text-text-dark mb-1">Une erreur est survenue</h1>
          <p className="text-sm text-text-grey mb-6">
            {this.state.error?.message ?? 'Veuillez réessayer.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#3A5AEE' }}
          >
            Réessayer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
