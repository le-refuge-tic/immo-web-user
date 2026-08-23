import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationsProvider } from './context/NotificationsContext'
import { ScrollProvider } from './context/ScrollContext'
import MainLayout from './components/MainLayout'
import HomePage from './pages/home/HomePage'
import BienDetailPage from './pages/bien/BienDetailPage'
import FavoritesPage from './pages/favorites/FavoritesPage'
import ConversationsPage from './pages/conversations/ConversationsPage'
import ChatPage from './pages/conversations/ChatPage'
import NotificationsPage from './pages/notifications/NotificationsPage'
import ProfilePage from './pages/profile/ProfilePage'
import MesVisitesPage from './pages/visites/MesVisitesPage'
import SplashPage from './pages/splash/SplashPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import OnboardingPage from './pages/auth/OnboardingPage'
import OnboardingProjetPage from './pages/auth/OnboardingProjetPage'
import OnboardingDestinationPage from './pages/auth/OnboardingDestinationPage'
import ProprietaireDashboard from './pages/proprietaire/ProprietaireDashboard'
import DemarcheurDashboard from './pages/demarcheur/DemarcheurDashboard'
import LocataireDashboard from './pages/locataire/LocataireDashboard'
import NouveauBienPage from './pages/bien/NouveauBienPage'
import ProprietaireBienWrapper from './pages/bien/ProprietaireBienWrapper'
import ReservationPage from './pages/reservation/ReservationPage'
import ContratBailPage from './pages/integration/ContratBailPage'
import PaiementIntegrationPage from './pages/integration/PaiementIntegrationPage'
import GestionViaAppPage from './pages/integration/GestionViaAppPage'
import PortefeuillePage from './pages/wallet/PortefeuillePage'
import RechargementWalletPage from './pages/wallet/RechargementWalletPage'
import RejoindreBienPage from './pages/locataire/RejoindreBienPage'
import ManageRolesPage from './pages/profile/ManageRolesPage'
import RecuPage from './pages/recu/RecuPage'
import SearchPage from './pages/search/SearchPage'

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
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
    <NotificationsProvider>
      <Routes>
        {/* Pages sans layout (standalone) */}
        <Route path="/splash" element={<SplashPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/onboarding/projet" element={<OnboardingProjetPage />} />
        <Route path="/onboarding/destination" element={<OnboardingDestinationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Dashboards rôle : sans MainLayout (ont leur propre nav interne) */}
        <Route path="/proprietaire" element={
          <PrivateRoute><ProprietaireDashboard /></PrivateRoute>
        } />
        <Route path="/proprietaire/biens/:id" element={
          <PrivateRoute><ProprietaireBienWrapper /></PrivateRoute>
        } />
        <Route path="/demarcheur" element={
          <PrivateRoute><DemarcheurDashboard /></PrivateRoute>
        } />
        <Route path="/locataire" element={
          <PrivateRoute><LocataireDashboard /></PrivateRoute>
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
    </NotificationsProvider>
    </ScrollProvider>
    </AuthProvider>
  )
}

export default App
