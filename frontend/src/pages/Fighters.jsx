import { useEffect, useMemo, useState } from 'react';
import { api, photoSrc } from '../api.js';
import Layout from '../components/Layout.jsx';

export default function FightersPage() {
  const [fighters, setFighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [action, setAction] = useState(null);
  const [chatDraft, setChatDraft] = useState('');
  const [fadeDate, setFadeDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { fighters: rows } = await api.getAllFighters();
        setFighters(rows);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selected = useMemo(
    () => fighters.find((fighter) => fighter.user_id === selectedId) || null,
    [fighters, selectedId]
  );

  const openAction = (fighter, mode) => {
    setSelectedId(fighter.user_id);
    setAction(mode);
    setChatDraft('');
    setFadeDate('');
    setStatus('');
  };

  const sendMessage = async () => {
    if (!selected || !chatDraft.trim()) {
      setStatus('Write a message first.');
      return;
    }

    setBusy(true);
    setStatus('');
    try {
      const { match } = await api.ensureMatch(selected.user_id);
      await api.sendMessage(match.id, chatDraft.trim());
      setStatus(`Message sent to ${selected.name}.`);
      setChatDraft('');
      setAction(null);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
  };

  const askForFade = async () => {
    if (!selected || !fadeDate) {
      setStatus('Pick a date and time first.');
      return;
    }

    setBusy(true);
    setStatus('');
    try {
      const { match } = await api.ensureMatch(selected.user_id);
      await api.proposeFight({
        match_id: match.id,
        scheduled_at: new Date(fadeDate).toISOString(),
      });
      setStatus(`Fade request sent to ${selected.name}.`);
      setFadeDate('');
      setAction(null);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <h1 className="page-title">All Fighters</h1>
      <p className="page-subtitle">Browse the whole app and reach out to anyone on the circuit.</p>

      {error && <div className="error-banner">{error}</div>}
      {status && <div className="sidebar-status">{status}</div>}

      {loading ? (
        <p className="muted">Loading fighters…</p>
      ) : fighters.length === 0 ? (
        <div className="empty-state">
          <div className="em-title">No fighters signed up yet</div>
          <p>Check back once more fighters join the app.</p>
        </div>
      ) : (
        <div className="fighter-page-grid">
          {fighters.map((fighter) => (
            <div className="fighter-card" key={fighter.user_id}>
              <div className="fighter-card-header">
                {fighter.photo_url ? (
                  <img className="fighter-card-photo" src={photoSrc(fighter.photo_url)} alt={fighter.name} />
                ) : (
                  <div className="fighter-card-photo placeholder-fighter-photo">🥊</div>
                )}
                <div className="fighter-card-main">
                  <div className="fighter-card-name">{fighter.name}</div>
                  <div className="fighter-card-meta">{fighter.weight_class} · {fighter.fighting_style}</div>
                </div>
              </div>

              <div className="tag-row">
                {(fighter.strengths || []).slice(0, 4).map((strength) => (
                  <span className="tag accent" key={`${fighter.user_id}-${strength}`}>{strength}</span>
                ))}
              </div>

              <p className="fighter-card-bio">
                {fighter.bio || 'No bio yet — still building the rep.'}
              </p>

              <div className="fighter-card-actions">
                <button className="btn btn-secondary" onClick={() => openAction(fighter, 'chat')}>
                  Chat
                </button>
                <button className="btn btn-secondary" onClick={() => openAction(fighter, 'profile')}>
                  See profile
                </button>
                <button className="btn btn-secondary" onClick={() => openAction(fighter, 'fade')}>
                  Run a fade
                </button>
              </div>

              {selected && selected.user_id === fighter.user_id && action === 'profile' && (
                <div className="fighter-inline-panel">
                  <div className="muted small-copy">{fighter.city ? `City: ${fighter.city}` : 'City not added yet'}</div>
                  <div className="muted small-copy">{fighter.bio || 'No bio yet — they’re still dropping their first line.'}</div>
                </div>
              )}

              {selected && selected.user_id === fighter.user_id && action === 'chat' && (
                <div className="fighter-inline-panel">
                  <textarea
                    className="sidebar-textarea"
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.target.value)}
                    placeholder={`Say something to ${fighter.name}...`}
                  />
                  <button className="btn btn-primary" onClick={sendMessage} disabled={busy || !chatDraft.trim()}>
                    {busy ? 'Sending…' : 'Send message'}
                  </button>
                </div>
              )}

              {selected && selected.user_id === fighter.user_id && action === 'fade' && (
                <div className="fighter-inline-panel">
                  <div className="field" style={{ marginBottom: 8 }}>
                    <label>Date & time</label>
                    <input type="datetime-local" value={fadeDate} onChange={(e) => setFadeDate(e.target.value)} />
                  </div>
                  <button className="btn btn-primary" onClick={askForFade} disabled={busy || !fadeDate}>
                    {busy ? 'Sending…' : 'Ask for a fade'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
