import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import type { ComponentType } from 'react'
import CguPage from '../CguPage'
import ConfidentialitePage from '../ConfidentialitePage'
import CookiesPage from '../CookiesPage'
import MentionsLegalesPage from '../MentionsLegalesPage'

const rendre = (Page: ComponentType) => renderToStaticMarkup(<MemoryRouter><Page /></MemoryRouter>)

describe('pages légales (textes officiels)', () => {
  it.each([
    ['CGU', CguPage, ['Conditions générales d’utilisation', '25 novembre 2026', 'Tribunal de commerce de Cotonou', 'Montant minimum de retrait : 500 FCFA', 'exclusivement par FedaPay', '7 jours après la demande']],
    ['confidentialité', ConfidentialitePage, ['Politique de confidentialité', '25 novembre 2026', 'quenumconfort@gmail.com', 'UEMOA/BCEAO', 'Wirepick', 'Retraits du portefeuille', '7 jours après la demande']],
    ['cookies', CookiesPage, ['13 octobre 2026', 'rg_device_token', 'Umami Cloud']],
    ['mentions légales', MentionsLegalesPage, ['Mentions légales', 'RB/ABC/22 A 48057', '0202271165781', 'Directeur de la publication']],
  ] as const)('affiche la page %s avec son contenu', (_nom, Page, attendus) => {
    const html = rendre(Page)
    for (const texte of attendus) expect(html).toContain(texte)
  })

  it('n’affiche plus le bandeau « projet » ni de champ « à compléter »', () => {
    for (const Page of [CguPage, ConfidentialitePage, CookiesPage, MentionsLegalesPage]) {
      const html = rendre(Page)
      expect(html).not.toContain('à compléter')
      expect(html).not.toContain('Projet en cours de validation')
    }
  })

  it('ne mentionne plus la vérification d’identité (CIP/IFU) ni d’autre moyen de paiement que FedaPay', () => {
    for (const Page of [CguPage, ConfidentialitePage]) {
      const html = rendre(Page)
      expect(html).not.toMatch(/\bCIP\b|carte d’identité|Celtiis|validation préalable/)
    }
  })

  it('relie chaque page aux trois autres documents', () => {
    const html = rendre(CguPage)
    for (const lien of ['/confidentialite', '/cookies', '/mentions-legales']) expect(html).toContain(`href="${lien}"`)
  })
})
