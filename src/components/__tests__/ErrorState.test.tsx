import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import ErrorState from '../ErrorState'

describe('ErrorState', () => {
  it('annonce la panne aux lecteurs d\'écran avec un bouton Réessayer', () => {
    const html = renderToStaticMarkup(<ErrorState title="Impossible de charger vos visites" onRetry={() => {}} />)

    expect(html).toContain('role="alert"')
    expect(html).toContain('Impossible de charger vos visites')
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>Réessayer<\/button>/)
  })

  it('affiche la consigne par défaut quand aucune n\'est fournie', () => {
    const html = renderToStaticMarkup(<ErrorState title="Panne" onRetry={() => {}} />)

    expect(html).toContain('Vérifiez votre connexion et réessayez.')
  })

  it('accepte un libellé et une consigne personnalisés', () => {
    const html = renderToStaticMarkup(
      <ErrorState title="Panne" hint="Revenez plus tard." retryLabel="Recharger" onRetry={() => {}} />,
    )

    expect(html).toContain('Revenez plus tard.')
    expect(html).toContain('>Recharger</button>')
  })

  it('masque l\'icône décorative aux lecteurs d\'écran', () => {
    const html = renderToStaticMarkup(<ErrorState title="Panne" onRetry={() => {}} />)

    expect(html).toContain('<svg')
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/)
  })
})
