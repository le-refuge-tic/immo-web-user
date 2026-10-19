import { useEffect } from 'react'

const BASE = 'REFUGE – Immobilier au Bénin'
const DESCRIPTION_PAR_DEFAUT =
  'Trouvez une maison, un appartement ou un terrain à Cotonou, Abomey-Calavi et partout au Bénin. Annonces vérifiées, visites réservées en ligne, paiement Mobile Money.'

function setMeta(selector: string, content: string) {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', content)
}

/** Titre d'onglet et, si fournie, meta description (+ og:description) propres à la page. */
export function usePageTitle(title: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE}` : BASE
    if (description) {
      setMeta('meta[name="description"]', description)
      setMeta('meta[property="og:description"]', description)
    }
    return () => {
      document.title = BASE
      if (description) {
        setMeta('meta[name="description"]', DESCRIPTION_PAR_DEFAUT)
        setMeta('meta[property="og:description"]', DESCRIPTION_PAR_DEFAUT)
      }
    }
  }, [title, description])
}
