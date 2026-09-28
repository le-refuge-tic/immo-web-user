import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationsProvider } from './context/NotificationsContext'
import { BannerProvider } from './context/BannerContext'
import { ScrollProvider } from './context/ScrollContext'
import MainLayout from './components/MainLayout'
import SplashPage from './pages/splash/SplashPage'
import { AuthSwitch } from './components/ui/auth-switch'
import { ErrorBoundary } from './components/ErrorBoundary'

/* Pages légères chargées immédiatement (premier rendu critique) */
import HomePage from './pages/home/HomePage'
import OnboardingPage from './pages/auth/OnboardingPage'
import OnboardingProjetPage from './pages/auth/OnboardingProjetPage'
import OnboardingDestinationPage from './pages/auth/OnboardingDestinationPage'

/* Pages lourdes — chargées à la demande */
const BienDetailPage         = lazy(() => import('./pages/bien/BienDetailPage'))
const SearchPage             = lazy(() => import('./pages/search/SearchPage'))
const FavoritesPage          = lazy(() => import('./pages/favorites/FavoritesPage'))
const ConversationsPage      = lazy(() => import('./pages/conversations/ConversationsPage'))
const ChatPage               = lazy(() => import('./pages/conversations/ChatPage'))
const NotificationsPage      = lazy(() => import('./pages/notifications/NotificationsPage'))
const ProfilePage            = lazy(() => import('./pages/profile/ProfilePage'))
const MesVisitesPage         = lazy(() => import('./pages/visites/MesVisitesPage'))
const ProprietaireDashboard  = lazy(() => import('./pages/proprietaire/ProprietaireDashboard'))
const DemarcheurDashboard    = lazy(() => import('./pages/demarcheur/DemarcheurDashboard'))
const LocataireDashboard     = lazy(() => import('./pages/locataire/LocataireDashboard'))
const NouveauBienPage        = lazy(() => import('./pages/bien/NouveauBienPage'))
const ProprietaireBienWrapper = lazy(() => import('./pages/bien/ProprietaireBienWrapper'))
const ReservationPage        = lazy(() => import('./pages/reservation/ReservationPage'))
const ContratBailPage        = lazy(() => import('./pages/integration/ContratBailPage'))
const PaiementIntegrationPage = lazy(() => import('./pages/integration/PaiementIntegrationPage'))
const GestionViaAppPage      = lazy(() => import('./pages/integration/GestionViaAppPage'))
const PortefeuillePage       = lazy(() => import('./pages/wallet/PortefeuillePage'))
const RechargementWalletPage = lazy(() => import('./pages/wallet/RechargementWalletPage'))
const RejoindreBienPage      = lazy(() => import('./pages/locataire/RejoindreBienPage'))
const HistoriquePaiementsPage = lazy(() => import('./pages/paiements/HistoriquePaiementsPage'))
const ManageRolesPage        = lazy(() => import('./pages/profile/ManageRolesPage'))
const RecuPage               = lazy(() => import('./pages/recu/RecuPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )
}

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { isLoggedIn } = useAuth()
  const location = useLocation()
  if (!isLoggedIn) {
    sessionStorage.setItem('post_login_redirect', location.pathname + location.search)
    return <Navigate to="/login" replace />
  }
  return children
}

function RoleRoute({ role, children }: { role: string; children: React.ReactElement }) {
  const { isLoggedIn, rolesActifs } = useAuth()
  const location = useLocation()
  if (!isLoggedIn) {
    sessionStorage.setItem('post_login_redirect', location.pathname + location.search)
    return <Navigate to="/login" replace />
  }
  if (!rolesActifs.includes(role)) return <Navigate to="/" replace />
  return children
}

// Page d'accueil avec garde first-launch
function HomeGuard() {
  const { isLoggedIn, activeRole } = useAuth()
  const isOnboarded = localStorage.getItem('rg_onboarded') === 'true'

  // activeRole reflète l'espace choisi par l'utilisateur (voir "Gérer mes
  // rôles") — un propriétaire/démarcheur qui a activé le rôle prospect et
  // cliqué "Accéder" doit voir l'accueil client, pas être renvoyé de force
  // vers son tableau de bord.
  if (isLoggedIn) {
    if (activeRole === 'proprietaire') return <Navigate to="/proprietaire" replace />
    if (activeRole === 'demarcheur')   return <Navigate to="/demarcheur" replace />
    if (activeRole === 'locataire')    return <Navigate to="/locataire" replace />
  }

  if (!isLoggedIn && !isOnboarded) {
    return <Navigate to="/splash" replace />
  }

  return <HomePage />
}

function App() {
  return (
    <AuthProvider>
    <ScrollProvider>
    <BannerProvider>
    <NotificationsProvider>
      <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Pages sans layout (standalone) */}
        <Route path="/splash" element={<SplashPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/onboarding/projet" element={<OnboardingProjetPage />} />
        <Route path="/onboarding/destination" element={<OnboardingDestinationPage />} />
        <Route path="/login" element={<AuthSwitch defaultMode="login" />} />
        <Route path="/register" element={<AuthSwitch defaultMode="register" />} />

        {/* Dashboards rôle : sans MainLayout (ont leur propre nav interne) */}
        <Route path="/proprietaire" element={
          <RoleRoute role="proprietaire"><ProprietaireDashboard /></RoleRoute>
        } />
        <Route path="/proprietaire/biens/:id" element={
          <RoleRoute role="proprietaire"><ProprietaireBienWrapper /></RoleRoute>
        } />
        <Route path="/demarcheur" element={
          <RoleRoute role="demarcheur"><DemarcheurDashboard /></RoleRoute>
        } />
        <Route path="/locataire" element={
          <RoleRoute role="locataire"><LocataireDashboard /></RoleRoute>
        } />

        {/* Flow intégration locataire */}
        <Route path="/contrat-bail/:bienId" element={
          <PrivateRoute><ContratBailPage /></PrivateRoute>
        } />
        <Route path="/paiement-integration/:bienId" element={
          <PrivateRoute><PaiementIntegrationPage /></PrivateRoute>
        } />
        <Route path="/gestion-via-app/:contratId?" element={
          <PrivateRoute><GestionViaAppPage /></PrivateRoute>
        } />
        <Route path="/recu/:type/:refId" element={
          <PrivateRoute><RecuPage /></PrivateRoute>
        } />
        <Route path="/rejoindre-bien" element={
          <PrivateRoute><RejoindreBienPage /></PrivateRoute>
        } />
        <Route path="/portefeuille/recharger/:walletType" element={
          <PrivateRoute><RechargementWalletPage /></PrivateRoute>
        } />
        <Route path="/mes-paiements" element={
          <PrivateRoute><HistoriquePaiementsPage /></PrivateRoute>
        } />

        {/* Pages client avec MainLayout + BottomNav */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomeGuard />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="biens/:id" element={<BienDetailPage />} />
          <Route path="favoris" element={<FavoritesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="conversations" element={
            <PrivateRoute><ConversationsPage /></PrivateRoute>
          }>
            <Route path=":id" element={<ChatPage />} />
          </Route>
          <Route path="profil" element={
            <PrivateRoute><ProfilePage /></PrivateRoute>
          } />
          <Route path="mes-visites" element={
            <PrivateRoute><MesVisitesPage /></PrivateRoute>
          } />
          <Route path="reservation/:bienId" element={
            <PrivateRoute><ReservationPage /></PrivateRoute>
          } />
          <Route path="nouveau-bien" element={
            <PrivateRoute><NouveauBienPage /></PrivateRoute>
          } />
          <Route path="portefeuille" element={
            <PrivateRoute><PortefeuillePage /></PrivateRoute>
          } />
          <Route path="mes-roles" element={
            <PrivateRoute><ManageRolesPage /></PrivateRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
      </ErrorBoundary>
    </NotificationsProvider>
    </BannerProvider>
    </ScrollProvider>
    </AuthProvider>
  )
}

export default App
