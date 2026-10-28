import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ErrorBoundary, RenderErrorFallback } from '../ErrorBoundary'

describe('RenderErrorFallback', () => {
  it('n\'affiche jamais le message technique de l\'erreur', () => {
    const html = renderToStaticMarkup(<RenderErrorFallback onRetry={() => {}} />)

    expect(html).toContain('Une erreur est survenue')
    expect(html).toContain('role="alert"')
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>Réessayer<\/button>/)
  })

  it('occupe tout l\'écran en mode page et reste dans la mise en page en mode compact', () => {
    const page = renderToStaticMarkup(<RenderErrorFallback onRetry={() => {}} />)
    const compact = renderToStaticMarkup(<RenderErrorFallback compact onRetry={() => {}} />)

    expect(page).toContain('min-h-dvh')
    expect(compact).not.toContain('min-h-dvh')
  })
})

describe('ErrorBoundary', () => {
  it('passe en erreur quand un enfant plante, sans conserver le message à l\'écran', () => {
    expect(ErrorBoundary.getDerivedStateFromError()).toEqual({ hasError: true })
  })

  it('ne touche pas à l\'état quand aucune erreur n\'est affichée', () => {
    const boundary = new ErrorBoundary({ children: null, resetKey: '/profil' })
    const setState = vi.fn()
    boundary.setState = setState

    Object.assign(boundary, { props: { children: null, resetKey: '/search' } })
    boundary.componentDidUpdate({ children: null, resetKey: '/profil' })

    expect(setState).not.toHaveBeenCalled()
  })

  it('se réarme quand la clé de réinitialisation change (navigation vers une autre page)', () => {
    const boundary = new ErrorBoundary({ children: null, resetKey: '/profil' })
    const setState = vi.fn()
    boundary.setState = setState
    boundary.state = { hasError: true }

    boundary.componentDidUpdate({ children: null, resetKey: '/profil' })
    expect(setState).not.toHaveBeenCalled()

    Object.assign(boundary, { props: { children: null, resetKey: '/search' } })
    boundary.componentDidUpdate({ children: null, resetKey: '/profil' })
    expect(setState).toHaveBeenCalledWith({ hasError: false })
  })
})
