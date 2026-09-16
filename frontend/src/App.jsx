import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Profile from './pages/Profile.jsx';
import Swipe from './pages/Swipe.jsx';
import Matches from './pages/Matches.jsx';
import Fights from './pages/Fights.jsx';
import OverseerDashboard from './pages/OverseerDashboard.jsx';
import Rankings from './pages/Rankings.jsx';
import MapPage from './pages/Map.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/swipe" /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/swipe" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/swipe" /> : <Signup />} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/swipe" element={<Protected><Swipe /></Protected>} />
      <Route path="/matches" element={<Protected><Matches /></Protected>} />
      <Route path="/fights" element={<Protected><Fights /></Protected>} />
      <Route path="/map" element={<Protected><MapPage /></Protected>} />
      <Route path="/overseer" element={<Protected><OverseerDashboard /></Protected>} />
      <Route path="/rankings" element={<Protected><Rankings /></Protected>} />
      <Route path="*" element={<Navigate to={user ? '/swipe' : '/'} />} />
    </Routes>
  );
}