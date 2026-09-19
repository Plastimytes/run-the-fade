import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../AdminAuthContext.jsx';

export default function AdminDashboard() {
  const { admin, logout } = useAdminAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav('/admin/login');
  };

  return (
    <div className="admin-shell">
      <div className="admin-placeholder">
        <div className="admin-login-badge">ADMIN</div>
        <h1 className="page-title">Welcome, {admin?.name}</h1>
        <p className="page-subtitle">Logged in as {admin?.email}. The full dashboard is next.</p>
        <button className="btn btn-secondary" onClick={handleLogout}>Log Out</button>
      </div>
    </div>
  );
}