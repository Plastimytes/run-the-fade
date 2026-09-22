import { Link } from 'react-router-dom';
import { useState } from 'react';
import FighterAvatar from '../components/FighterAvatar.jsx';
import hero from '../assets/hero.jpg';
import { adminApi, ORIGIN_URL } from '../api.js';

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-hero">
        <img src={hero} alt="Two fighters facing off on a city street at dusk" className="landing-hero-img" />
        <div className="landing-hero-overlay" />
      </div>

      <div className="landing-content">
        <div className="landing-brand">
          <FighterAvatar size={40} />
          <span>
            Run<span className="landing-brand-accent">The</span>Fade
          </span>
        </div>

        <h1 className="landing-title">
          FIND YOUR<br />NEXT FADE
        </h1>
        <p className="landing-tagline">
          Match with fighters near you. Get called to a fade by a verified overseer. Climb the rankings.
        </p>

        <div className="landing-actions">
          <Link to="/signup" className="btn btn-primary landing-btn">Create Account</Link>
          <Link to="/login" className="btn btn-secondary landing-btn">Sign In</Link>
          <Link to="/admin/login" className="btn btn-ghost landing-btn">Admin</Link>
        </div>

        <div className="landing-admin" style={{ marginTop: 28, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
          <h3 className="landing-subtitle">Admin: create account or sign in</h3>
          <p className="muted" style={{ marginBottom: 12 }}>Create a one‑time admin account using your setup token, or sign in if you already have credentials.</p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <AdminCreateForm />
            <AdminSignIn />
          </div>
        </div>

        <div className="landing-features">
          <div className="landing-feature">
            <span className="landing-feature-num">01</span>
            Build your profile — weight class, style, strengths
          </div>
          <div className="landing-feature">
            <span className="landing-feature-num">02</span>
            Swipe on fighters looking for a fade near you
          </div>
          <div className="landing-feature">
            <span className="landing-feature-num">03</span>
            The nearest overseer runs the fight and confirms the result
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminCreateForm() {
  const [email, setEmail] = useState('admin@runthefade.app');
  const [password, setPassword] = useState('ChangeThisAdmin1!');
  const [name, setName] = useState('RunTheFade Admin');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e?.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${ORIGIN_URL}/api/admin-setup/one-time-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-setup-token': token },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed');
      setMessage(data.message || 'Admin account created.');
    } catch (err) {
      setMessage(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ minWidth: 320, maxWidth: 420 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} className="field" />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="ADMIN_SETUP_TOKEN" className="field" />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create Admin'}</button>
        <button type="button" className="btn btn-secondary" onClick={() => { setEmail('admin@runthefade.app'); setPassword('ChangeThisAdmin1!'); setName('RunTheFade Admin'); }}>Defaults</button>
      </div>
      {message && <div className="muted" style={{ marginTop: 8 }}>{message}</div>} 
    </form>
  );
}

function AdminSignIn() {
  const [email, setEmail] = useState('admin@runthefade.app');
  const [password, setPassword] = useState('ChangeThisAdmin1!');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e?.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      await adminApi.login({ email, password });
      setMessage('Signed in — open /admin to continue.');
    } catch (err) {
      setMessage(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ minWidth: 320, maxWidth: 420 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="field" />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Signing…' : 'Sign In'}</button>
      </div>
      {message && <div className="muted" style={{ marginTop: 8 }}>{message}</div>} 
    </form>
  );
}