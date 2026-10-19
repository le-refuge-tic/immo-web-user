import { Outlet, useLocation } from 'react-router-dom'
import PushPrompt from './PushPrompt'
import { ErrorBoundary } from './ErrorBoundary'

/**
 * Région principale des écrans sans MainLayout (connexion, tableaux de bord,
 * reçus…). `contents` : le conteneur n'ajoute aucune boîte, donc aucune
 * conséquence sur la mise en page, mais les lecteurs d'écran disposent du
 * repère « contenu principal » (WCAG 1.3.1 / 2.4.1).
 */
export default function StandaloneLayout() {
  const { pathname } = useLocation()
  return (
    <main id="main-content" tabIndex={-1} className="contents outline-none">
      <ErrorBoundary resetKey={pathname}>
        <Outlet />
      </ErrorBoundary>
      {/* Les tableaux de bord n'ont pas MainLayout : l'invite aux notifications y est montée aussi */}
      <PushPrompt />
    </main>
  )
}
