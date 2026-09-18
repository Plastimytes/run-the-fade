import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import FighterAvatar from '../components/FighterAvatar.jsx';
import loginHero from '../assets/login-hero.jpg';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      nav('/swipe');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <img src={loginHero} alt="" className="auth-hero-img" />
      <div className="auth-hero-overlay" />
      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'center' }}><FighterAvatar size={64} /></div>
        <h1 className="auth-title">Run<span>The</span>Fade</h1>
        <p className="auth-tagline">Find your next fade</p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <div className="auth-switch">
          New to RunTheFade? <Link to="/signup">Create an account</Link>
        </div>
      </div>
    </div>
  );
}