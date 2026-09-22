import { useEffect, useState } from 'react';
import { adminApi } from '../api.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await adminApi.getLocations();
        setLocations(data.locations);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AdminLayout>
      <h1 className="page-title">Locations</h1>
      <p className="page-subtitle">Every fade location and the overseer running it.</p>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : locations.length === 0 ? (
        <div className="empty-state"><div className="em-title">No locations yet</div></div>
      ) : (
        <div className="card-list">
          {locations.map((l) => (
            <div className="list-card" key={l.id} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="list-card-name">{l.name}</div>
                  <div className="list-card-meta">{l.address}</div>
                  <div className="list-card-meta">Overseer: {l.owner_name} · {l.fight_count} fight{l.fight_count === 1 ? '' : 's'} hosted</div>
                </div>
                <span className="tag">{new Date(l.created_at).toLocaleDateString()}</span>
              </div>
              {l.overseer_experience && (
                <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>"{l.overseer_experience}"</p>
              )}
              {l.rules && (
                <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>Rules: {l.rules}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}