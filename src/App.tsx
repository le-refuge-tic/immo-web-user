import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
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
import NouveauBienPage from './pages/bien/NouveauBienPage'
import ReservationPage from './pages/reservation/ReservationPage'

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return children
}

// Page d'accueil avec garde first-launch
function HomeGuard() {
  const { isLoggedIn, user } = useAuth()
  const isOnboarded = localStorage.getItem('rg_onboarded') === 'true'

  if (isLoggedIn) {
    if (user?.role === 'proprietaire') return <Navigate to="/proprietaire" replace />
    if (user?.role === 'demarcheur') return <Navigate to="/demarcheur" replace />
  }

  if (!isLoggedIn && !isOnboarded) {
    return <Navigate to="/splash" replace />
  }

  return <HomePage />
}

function App() {
  return (
    <AuthProvider>
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
        <Route path="/demarcheur" element={
          <PrivateRoute><DemarcheurDashboard /></PrivateRoute>
        } />

        {/* Pages client avec MainLayout + BottomNav */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomeGuard />} />
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
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
