import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import AnnoncesPage from './pages/annonces/AnnoncesPage';
import ModerationPage from './pages/moderation/ModerationPage';
import UtilisateursPage from './pages/utilisateurs/UtilisateursPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"    element={<DashboardPage />} />
          <Route path="annonces"     element={<AnnoncesPage />} />
          <Route path="moderation"   element={<ModerationPage />} />
          <Route path="utilisateurs" element={<UtilisateursPage />} />
          <Route path="performance"  element={<DashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
