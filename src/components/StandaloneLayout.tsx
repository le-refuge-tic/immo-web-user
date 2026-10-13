import { Outlet } from 'react-router-dom'

/**
 * Région principale des écrans sans MainLayout (connexion, tableaux de bord,
 * reçus…). `contents` : le conteneur n'ajoute aucune boîte, donc aucune
 * conséquence sur la mise en page, mais les lecteurs d'écran disposent du
 * repère « contenu principal » (WCAG 1.3.1 / 2.4.1).
 */
export default function StandaloneLayout() {
  return (
    <main id="main-content" tabIndex={-1} className="contents outline-none">
      <Outlet />
    </main>
  )
}
