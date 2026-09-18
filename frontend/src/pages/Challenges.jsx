import { useEffect, useState } from 'react';
import { api, photoSrc } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Layout from '../components/Layout.jsx';

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{status.replace('_', ' ')}</span>;
}

export default function Challenges() {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [fighters, setFighters] = useState({}); // user_id -> fighter profile
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responding, setResponding] = useState(null);

  const load = async () => {
    setError('');
    try {
      const data = await api.getChallenges();
      setIncoming(data.incoming);
      setSent(data.sent);

      const otherIds = new Set();
      [...data.incoming, ...data.sent].forEach((f) => {
        const otherId = f.match.user_a === user.id ? f.match.user_b : f.match.user_a;
        otherIds.add(otherId);
      });
      const missing = [...otherIds].filter((id) => !fighters[id]);
      if (missing.length) {
        const entries = await Promise.all(missing.map(async (id) => [id, (await api.getFighter(id)).fighter]));
        setFighters((f) => ({ ...f, ...Object.fromEntries(entries) }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const respond = async (id, accept) => {
    setResponding(id);
    setError('');
    try {
      await api.respondToChallenge(id, accept);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setResponding(null);
    }
  };

  const otherFighter = (fight) => {
    const otherId = fight.match.user_a === user.id ? fight.match.user_b : fight.match.user_a;
    return fighters[otherId];
  };

  return (
    <Layout>
      <h1 className="page-title">Challenges</h1>
      <p className="page-subtitle">Fades other fighters have called you out for, and ones you've sent.</p>

      {error && <div className="error-banner">{error}</div>}

      <div className="section">
        <div className="section-title">Incoming</div>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : incoming.length === 0 ? (
          <p className="muted">No challenges waiting on you.</p>
        ) : (
          <div className="card-list">
            {incoming.map((f) => {
              const other = otherFighter(f);
              return (
                <div className="list-card" key={f.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {other?.photo_url ? (
                      <img className="list-avatar" src={photoSrc(other.photo_url)} alt={other.name} />
                    ) : (
                      <div className="list-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🥊</div>
                    )}
                    <div>
                      <div className="list-card-name">{other?.name || '…'}</div>
                      <div className="list-card-meta">
                        {f.location?.name} · {new Date(f.scheduled_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" disabled={responding === f.id} onClick={() => respond(f.id, false)}>
                      Decline
                    </button>
                    <button className="btn btn-primary" disabled={responding === f.id} onClick={() => respond(f.id, true)}>
                      Accept
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-title">Sent</div>
        {!loading && sent.length === 0 ? (
          <p className="muted">No challenges awaiting a response.</p>
        ) : (
          <div className="card-list">
            {sent.map((f) => {
              const other = otherFighter(f);
              return (
                <div className="list-card" key={f.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {other?.photo_url ? (
                      <img className="list-avatar" src={photoSrc(other.photo_url)} alt={other.name} />
                    ) : (
                      <div className="list-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🥊</div>
                    )}
                    <div>
                      <div className="list-card-name">{other?.name || '…'}</div>
                      <div className="list-card-meta">
                        {f.location?.name} · {new Date(f.scheduled_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={f.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}