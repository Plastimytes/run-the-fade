import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../AdminAuthContext.jsx';

export default function AdminLayout({ children }) {
  const { admin, logout } = useAdminAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav('/admin/login');
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-login-badge">ADMIN</div>
        <h2 className="page-title" style={{ fontSize: 22, marginTop: 10 }}>{admin?.name || 'Admin'}</h2>
        <nav className="admin-nav" style={{ display: 'grid', gap: 8, marginTop: 16 }}>
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'btn btn-primary' : 'btn btn-secondary'}>Overview</NavLink>
          <NavLink to="/admin/fighters" className={({ isActive }) => isActive ? 'btn btn-primary' : 'btn btn-secondary'}>Fighters</NavLink>
          <NavLink to="/admin/fights" className={({ isActive }) => isActive ? 'btn btn-primary' : 'btn btn-secondary'}>Fights</NavLink>
          <NavLink to="/admin/locations" className={({ isActive }) => isActive ? 'btn btn-primary' : 'btn btn-secondary'}>Locations</NavLink>
        </nav>
        <button className="btn btn-secondary" onClick={handleLogout} style={{ marginTop: 20 }}>Log Out</button>
      </aside>

      <main className="admin-content" style={{ flex: 1, padding: 24 }}>
        {children}
      </main>
    </div>
  );
}
