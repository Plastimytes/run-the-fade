import { useEffect, useState } from 'react';
import { adminApi } from '../api.js';
import AdminLayout from './AdminLayout.jsx';

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{status.replace('_', ' ')}</span>;
}

export default function AdminFights() {
  const [fights, setFights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const data = await adminApi.getFights();
        setFights(data.fights);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = filter === 'all' ? fights : fights.filter((f) => f.status === filter);

  const winnerName = (f) => {
    if (f.is_draw) return 'Ended in a draw';
    if (f.winner_id == null) return null;
    return `Winner: ${f.winner_id === f.user_a ? f.fighter_a_name : f.fighter_b_name}`;
  };

  return (
    <AdminLayout>
      <h1 className="page-title">Fights</h1>
      <p className="page-subtitle">Every challenge and fight across the app, from proposal to result.</p>

      {error && <div className="error-banner">{error}</div>}

      <div className="filter-bar">
        {['all', 'awaiting_opponent', 'pending', 'approved', 'completed', 'declined'].map((s) => (
          <button
            key={s}
            className="btn btn-secondary"
            style={filter === s ? { borderColor: 'var(--cyan)', color: 'var(--cyan)' } : undefined}
            onClick={() => setFilter(s)}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="em-title">No fights match that filter</div></div>
      ) : (
        <div className="card-list">
          {filtered.map((f) => (
            <div className="list-card" key={f.id}>
              <div>
                <div className="list-card-name">{f.fighter_a_name} vs {f.fighter_b_name}</div>
                <div className="list-card-meta">
                  {f.location_name} · {new Date(f.scheduled_at).toLocaleString()}
                </div>
                {winnerName(f) && <div className="list-card-meta">{winnerName(f)}</div>}
              </div>
              <StatusBadge status={f.status} />
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}