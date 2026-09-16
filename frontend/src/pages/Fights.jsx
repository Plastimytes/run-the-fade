import { useEffect, useState } from 'react';
import { api, photoSrc } from '../api.js';
import Layout from '../components/Layout.jsx';

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}

export default function Fights() {
  const [fights, setFights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMyFights();
        setFights(data.fights);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Layout>
      <h1 className="page-title">My Fights</h1>
      <p className="page-subtitle">Proposed, approved, and completed fades.</p>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : fights.length === 0 ? (
        <div className="empty-state">
          <div className="em-title">No fights yet</div>
          <p>Match with someone and schedule a fight from the Matches tab.</p>
        </div>
      ) : (
        <div className="card-list">
          {fights.map((f) => (
            <div className="list-card" key={f.id}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {f.result?.photo_url && (
                  <img
                    src={photoSrc(f.result.photo_url)}
                    alt="Result proof"
                    style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }}
                  />
                )}
                <div>
                  <div className="list-card-name">{f.location?.name}</div>
                  <div className="list-card-meta">
                    {new Date(f.scheduled_at).toLocaleString()} · {f.location?.address}
                  </div>
                  {f.overseer_name && <div className="list-card-meta">Overseer: {f.overseer_name}</div>}
                  {f.result && (
                    <div className="list-card-meta">
                      {f.result.is_draw
                        ? 'Ended in a draw'
                        : `Winner: fighter #${f.result.winner_id}`}
                    </div>
                  )}
                </div>
              </div>
              <StatusBadge status={f.status} />
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
