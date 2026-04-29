import { NavLink } from 'react-router-dom';
import {
  GridIcon, HomeIcon, ShieldIcon, UsersIcon, BoltIcon, LogoutIcon,
} from '../components/Icons';

const navItems = [
  { to: '/dashboard',    label: 'Tableau de bord',    Icon: GridIcon },
  { to: '/annonces',     label: 'Annonces Immo',       Icon: HomeIcon },
  { to: '/moderation',   label: 'Modération',          Icon: ShieldIcon },
  { to: '/utilisateurs', label: 'Utilisateurs',         Icon: UsersIcon },
  { to: '/performance',  label: 'Performance & Boosts', Icon: BoltIcon },
];

export default function Sidebar() {
  return (
    <aside className="immo-sidebar">
      {/* Logo */}
      <div className="immo-logo">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
            fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.5"/>
          <path d="M9 21v-7h6v7" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="immo-logo-text">HOUÉTCHÉ</span>
      </div>

      {/* Nav */}
      <nav className="immo-nav">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `immo-nav-item${isActive ? ' active' : ''}`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="immo-sidebar-footer">
        <button className="immo-logout-btn">
          <LogoutIcon />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
