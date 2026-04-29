import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Button, Offcanvas, Container } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Tableau de bord', icon: '📊' },
  { to: '/users', label: 'Utilisateurs', icon: '👥' },
  { to: '/biens', label: 'Biens', icon: '🏠' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="d-flex flex-column h-100">
      <div className="p-3 border-bottom">
        <h5 className="fw-bold text-primary mb-0">Immo Admin</h5>
        <small className="text-muted">{user?.prenom} {user?.nom}</small>
      </div>
      <Nav className="flex-column p-3 flex-grow-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-link rounded px-3 py-2 mb-1 ${isActive ? 'bg-primary text-white' : 'text-dark'}`
            }
            onClick={() => setShowSidebar(false)}
          >
            <span className="me-2">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </Nav>
      <div className="p-3 border-top">
        <Button variant="outline-danger" size="sm" className="w-100" onClick={handleLogout}>
          Déconnexion
        </Button>
      </div>
    </div>
  );

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar desktop */}
      <div
        className="d-none d-lg-flex flex-column border-end bg-white"
        style={{ width: 240, minHeight: '100vh', position: 'sticky', top: 0 }}
      >
        <SidebarContent />
      </div>

      {/* Sidebar mobile */}
      <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start">
        <Offcanvas.Body className="p-0">
          <SidebarContent />
        </Offcanvas.Body>
      </Offcanvas>

      <div className="flex-grow-1 d-flex flex-column">
        {/* Topbar */}
        <Navbar bg="white" className="border-bottom px-3 py-2 d-lg-none">
          <Button variant="outline-secondary" size="sm" onClick={() => setShowSidebar(true)}>
            ☰
          </Button>
          <Navbar.Brand className="ms-3 fw-bold text-primary">Immo Admin</Navbar.Brand>
        </Navbar>

        {/* Main content */}
        <main className="flex-grow-1 bg-light p-4">
          <Container fluid>
            <Outlet />
          </Container>
        </main>
      </div>
    </div>
  );
}
