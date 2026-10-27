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

  it('une alerte non lue ouvrable est un vrai bouton, sans élément de bloc ni libellé qui masque la date', () => {
    const html = renderToStaticMarkup(<AlerteItem n={{ ...base, lu: false }} onOpen={() => {}} />)

    expect(html).toMatch(/^<button type="button"/)
    expect(html).not.toContain('role="button"')
    expect(html).not.toContain('aria-label')
    expect(html).toContain('<span class="sr-only">Non lue : </span>')
    expect(html).toContain('01/10/2026')
    expect(html.slice(html.indexOf('>') + 1)).not.toMatch(/<(div|p)[\s>]/)
  })

  it('une alerte lue reste passive, même avec onOpen', () => {
    const html = renderToStaticMarkup(<AlerteItem n={{ ...base, lu: true }} onOpen={() => {}} />)

    expect(html).not.toContain('<button')
  })

  it('retombe sur le message quand le titre est vide', () => {
    const html = renderToStaticMarkup(<AlerteItem n={{ ...base, titre: '', message: 'Texte ancien', lu: true }} />)

    expect(html).toContain('Texte ancien')
  })
})
