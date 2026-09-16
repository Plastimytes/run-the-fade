import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import FighterAvatar from './FighterAvatar.jsx';
import NotificationBell from './NotificationBell.jsx';

const LINKS = [
  { to: '/swipe', label: 'Find a Fade' },
  { to: '/matches', label: 'Matches' },
  { to: '/fights', label: 'Fights' },
  { to: '/map', label: 'Map' },
  { to: '/overseer', label: 'Overseer' },
  { to: '/rankings', label: 'Rankings' },
  { to: '/profile', label: 'My Profile' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav('/login');
  };

  return (
    <div className="app-shell">
      <nav className="nav">
        <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FighterAvatar size={32} />
          Run<span>The</span>Fade
        </div>
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            {l.label}
          </NavLink>
        ))}
        <div className="nav-footer">
          <div className="nav-user">{user?.name}</div>
          <button className="nav-logout" onClick={handleLogout}>Log Out</button>
        </div>
      </nav>
      <main className="main">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -8 }}>
          <NotificationBell />
        </div>
        {children}
      </main>
    </div>
  );
}
