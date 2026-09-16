import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { api, photoSrc } from '../api.js';
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
  const [fighters, setFighters] = useState([]);
  const [loadingFighters, setLoadingFighters] = useState(true);
  const [fighterError, setFighterError] = useState('');
  const [selectedFighter, setSelectedFighter] = useState(null);
  const [actionMode, setActionMode] = useState(null);
  const [chatDraft, setChatDraft] = useState('');
  const [fadeDate, setFadeDate] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { fighters: rows } = await api.getAllFighters();
        setFighters(rows.filter((fighter) => fighter.user_id !== user?.id));
      } catch (err) {
        setFighterError(err.message);
      } finally {
        setLoadingFighters(false);
      }
    })();
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    nav('/login');
  };

  const openAction = (fighter, mode) => {
    setSelectedFighter(fighter);
    setActionMode(mode);
    setStatusMessage('');
    setChatDraft('');
    setFadeDate('');
  };

  const sendMessage = async () => {
    if (!selectedFighter || !chatDraft.trim()) return;
    setActionBusy(true);
    setStatusMessage('');
    try {
      const { match } = await api.ensureMatch(selectedFighter.user_id);
      await api.sendMessage(match.id, chatDraft.trim());
      setStatusMessage(`Message sent to ${selectedFighter.name}.`);
      setChatDraft('');
      setActionMode(null);
    } catch (err) {
      setStatusMessage(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const askForFade = async () => {
    if (!selectedFighter || !fadeDate) {
      setStatusMessage('Pick a date and time first.');
      return;
    }
    setActionBusy(true);
    setStatusMessage('');
    try {
      const { match } = await api.ensureMatch(selectedFighter.user_id);
      await api.proposeFight({
        match_id: match.id,
        scheduled_at: new Date(fadeDate).toISOString(),
      });
      setStatusMessage(`Fade request sent to ${selectedFighter.name}.`);
      setFadeDate('');
      setActionMode(null);
    } catch (err) {
      setStatusMessage(err.message);
    } finally {
      setActionBusy(false);
    }
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

        <div className="nav-fighters">
          <div className="nav-section-title">All Fighters</div>
          {loadingFighters ? (
            <div className="muted small-copy">Loading…</div>
          ) : fighterError ? (
            <div className="muted small-copy">{fighterError}</div>
          ) : fighters.length === 0 ? (
            <div className="muted small-copy">No fighters signed up yet.</div>
          ) : (
            fighters.map((fighter) => {
              const active = selectedFighter?.user_id === fighter.user_id;
              return (
                <div className="sidebar-fighter-card" key={fighter.user_id}>
                  <div className="sidebar-fighter-header">
                    {fighter.photo_url ? (
                      <img className="list-avatar" src={photoSrc(fighter.photo_url)} alt={fighter.name} />
                    ) : (
                      <div className="list-avatar avatar-placeholder-inline">🥊</div>
                    )}
                    <div>
                      <div className="list-card-name">{fighter.name}</div>
                      <div className="list-card-meta">{fighter.weight_class} · {fighter.fighting_style}</div>
                    </div>
                  </div>

                  <div className="sidebar-fighter-actions">
                    <button className="btn btn-secondary sidebar-button" onClick={() => openAction(fighter, 'chat')}>
                      Chat
                    </button>
                    <button className="btn btn-secondary sidebar-button" onClick={() => openAction(fighter, 'profile')}>
                      See profile
                    </button>
                    <button className="btn btn-secondary sidebar-button" onClick={() => openAction(fighter, 'fade')}>
                      Run a fade
                    </button>
                  </div>

                  {active && actionMode === 'profile' && (
                    <div className="fighter-detail-panel">
                      <div className="tag-row compact-row">
                        {(fighter.strengths || []).slice(0, 4).map((strength) => (
                          <span key={strength} className="tag accent">{strength}</span>
                        ))}
                      </div>
                      <div className="muted small-copy">{fighter.bio || 'No bio yet — they’re still dropping their first line.'}</div>
                      {fighter.city && <div className="muted small-copy">City: {fighter.city}</div>}
                    </div>
                  )}

                  {active && actionMode === 'chat' && (
                    <div className="fighter-detail-panel">
                      <textarea
                        className="sidebar-textarea"
                        value={chatDraft}
                        onChange={(e) => setChatDraft(e.target.value)}
                        placeholder={`Send a message to ${fighter.name}...`}
                      />
                      <button className="btn btn-primary" onClick={sendMessage} disabled={actionBusy || !chatDraft.trim()}>
                        {actionBusy ? 'Sending…' : 'Send message'}
                      </button>
                    </div>
                  )}

                  {active && actionMode === 'fade' && (
                    <div className="fighter-detail-panel">
                      <div className="field" style={{ marginBottom: 8 }}>
                        <label>Date & time</label>
                        <input
                          type="datetime-local"
                          value={fadeDate}
                          onChange={(e) => setFadeDate(e.target.value)}
                        />
                      </div>
                      <button className="btn btn-primary" onClick={askForFade} disabled={actionBusy || !fadeDate}>
                        {actionBusy ? 'Sending…' : 'Ask for a fade'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {statusMessage && <div className="sidebar-status">{statusMessage}</div>}

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
