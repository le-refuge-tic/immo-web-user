import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import AlerteItem from '../AlerteItem'

const base = { titre: 'Loyer reçu', message: undefined, created_at: '2026-10-01T08:00:00.000Z' }

describe('AlerteItem (alertes du locataire)', () => {
  it('affiche une alerte lue (lu: true) en gris, sans pastille', () => {
    const html = renderToStaticMarkup(<AlerteItem n={{ ...base, lu: true }} />)

    expect(html).toContain('data-lu="true"')
    expect(html).toContain('text-text-grey')
    expect(html).not.toContain('font-semibold')
    expect(html).not.toContain('absolute -top-0.5')
    expect(html).not.toContain('mt-1.5')
  })

  it('affiche une alerte non lue (lu: false) en gras, avec ses pastilles', () => {
    const html = renderToStaticMarkup(<AlerteItem n={{ ...base, lu: false }} />)

    expect(html).toContain('data-lu="false"')
    expect(html).toContain('font-semibold')
    expect(html).toContain('absolute -top-0.5')
    expect(html).toContain('mt-1.5')
  })

  it('retombe sur le message quand le titre est vide', () => {
    const html = renderToStaticMarkup(<AlerteItem n={{ ...base, titre: '', message: 'Texte ancien', lu: true }} />)

    expect(html).toContain('Texte ancien')
  })
})
