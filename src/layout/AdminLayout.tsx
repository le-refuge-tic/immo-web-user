import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AdminLayout() {
  return (
    <div className="immo-shell">
      <Sidebar />
      <div className="immo-main">
        <Outlet />
      </div>
    </div>
  );
}
