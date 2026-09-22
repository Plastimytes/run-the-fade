import { useEffect, useState } from 'react';
import { adminApi } from '../api.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminFighters() {
  const [fighters, setFighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await adminApi.getFighters();
        setFighters(data.fighters || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = fighters.filter((fighter) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      fighter.name?.toLowerCase().includes(q) ||
      fighter.email?.toLowerCase().includes(q) ||
      fighter.city?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <h1 className="page-title">Fighters</h1>
      <p className="page-subtitle">Review fighter profiles, status, ratings, and recent signups.</p>

      {error && <div className="error-banner">{error}</div>}

      <div className="search-box" style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search fighters"
          style={{ width: '100%', maxWidth: 420 }}
        />
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="em-title">No fighters found</div></div>
      ) : (
        <div className="card-list">
          {filtered.map((fighter) => (
            <div className="list-card" key={fighter.id}>
              <div>
                <div className="list-card-name">{fighter.name}</div>
                <div className="list-card-meta">{fighter.email}</div>
                <div className="list-card-meta">
                  {fighter.city || 'Unknown city'} · {fighter.fighting_style || 'Style unassigned'} · Rating {fighter.rating ?? 0}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className={`tag ${fighter.is_banned ? 'danger' : ''}`}>{fighter.is_banned ? 'Banned' : 'Active'}</span>
                <span className="tag">{fighter.status || 'unknown'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
