import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import MainLayout from './components/MainLayout'
import HomePage from './pages/home/HomePage'
import BienDetailPage from './pages/bien/BienDetailPage'
import SearchPage from './pages/search/SearchPage'
import FavoritesPage from './pages/favorites/FavoritesPage'
import ConversationsPage from './pages/conversations/ConversationsPage'
import ChatPage from './pages/conversations/ChatPage'
import NotificationsPage from './pages/notifications/NotificationsPage'
import ProfilePage from './pages/profile/ProfilePage'
import EditProfilePage from './pages/profile/EditProfilePage'
import ChangePasswordPage from './pages/profile/ChangePasswordPage'
import MesVisitesPage from './pages/visites/MesVisitesPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import OnboardingPage from './pages/auth/OnboardingPage'
import ProprietaireDashboard from './pages/proprietaire/ProprietaireDashboard'
import DemarcheurDashboard from './pages/demarcheur/DemarcheurDashboard'
import NouveauBienPage from './pages/bien/NouveauBienPage'
import ReservationPage from './pages/reservation/ReservationPage'

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="biens/:id" element={<BienDetailPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="favoris" element={<FavoritesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="conversations" element={
            <PrivateRoute><ConversationsPage /></PrivateRoute>
          } />
          <Route path="conversations/:id" element={
            <PrivateRoute><ChatPage /></PrivateRoute>
          } />
          <Route path="profil" element={
            <PrivateRoute><ProfilePage /></PrivateRoute>
          } />
          <Route path="profil/edit" element={
            <PrivateRoute><EditProfilePage /></PrivateRoute>
          } />
          <Route path="profil/password" element={
            <PrivateRoute><ChangePasswordPage /></PrivateRoute>
          } />
          <Route path="mes-visites" element={
            <PrivateRoute><MesVisitesPage /></PrivateRoute>
          } />
          <Route path="reservation/:bienId" element={
            <PrivateRoute><ReservationPage /></PrivateRoute>
          } />
          <Route path="proprietaire" element={
            <PrivateRoute><ProprietaireDashboard /></PrivateRoute>
          } />
          <Route path="demarcheur" element={
            <PrivateRoute><DemarcheurDashboard /></PrivateRoute>
          } />
          <Route path="nouveau-bien" element={
            <PrivateRoute><NouveauBienPage /></PrivateRoute>
          } />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
