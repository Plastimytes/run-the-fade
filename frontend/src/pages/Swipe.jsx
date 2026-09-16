import { useEffect, useState } from 'react';
import { api, photoSrc } from '../api.js';
import Layout from '../components/Layout.jsx';
import { WEIGHT_CLASSES, FIGHTING_STYLES } from '../constants.js';

export default function Swipe() {
  const [fighters, setFighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchBanner, setMatchBanner] = useState(null);
  const [filters, setFilters] = useState({ weight_class: '', fighting_style: '' });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.weight_class) params.weight_class = filters.weight_class;
      if (filters.fighting_style) params.fighting_style = filters.fighting_style;
      const data = await api.getNearby(params);
      setFighters(data.fighters);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters.weight_class, filters.fighting_style]);

  const current = fighters[0];

  const swipe = async (direction) => {
    if (!current) return;
    try {
      const res = await api.swipe(current.user_id, direction);
      setFighters((f) => f.slice(1));
      if (res.matched) {
        setMatchBanner(current.name);
        setTimeout(() => setMatchBanner(null), 2500);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Layout>
      <h1 className="page-title">Find a Fade</h1>
      <p className="page-subtitle">Fighters near you who are looking. Swipe to call them out.</p>

      <div className="filter-bar">
        <select
          value={filters.weight_class}
          onChange={(e) => setFilters((f) => ({ ...f, weight_class: e.target.value }))}
        >
          <option value="">All weight classes</option>
          {WEIGHT_CLASSES.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
        <select
          value={filters.fighting_style}
          onChange={(e) => setFilters((f) => ({ ...f, fighting_style: e.target.value }))}
        >
          <option value="">All styles</option>
          {FIGHTING_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {matchBanner && (
        <div className="error-banner" style={{ background: 'rgba(61,220,132,0.12)', borderColor: 'var(--win)', color: 'var(--win)' }}>
          It's a match! You and {matchBanner} are both hot for a fade.
        </div>
      )}

      <div className="deck-wrap">
        {loading ? (
          <p className="muted">Loading fighters…</p>
        ) : current ? (
          <>
            <div className="fight-card">
              <div className="fight-card-banner" style={{ position: 'relative' }}>
                {current.photo_url && <img className="fight-card-photo" src={photoSrc(current.photo_url)} alt={current.name} />}
                <div className="fight-card-name" style={{ position: 'relative' }}>{current.name}</div>
              </div>
              <div className="fight-card-body">
                <div className="tag-row">
                  <span className="tag accent">{current.weight_class}</span>
                  <span className="tag accent">{current.fighting_style}</span>
                  <span className="tag">{current.height_class}</span>
                </div>
                <div className="stat-grid">
                  <div className="stat-box">
                    <div className="stat-label">Rating</div>
                    <div className="stat-value">{current.rating}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Record</div>
                    <div className="stat-value">{current.wins}-{current.losses}-{current.draws}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">City</div>
                    <div className="stat-value" style={{ fontSize: 13 }}>{current.city || '—'}</div>
                  </div>
                </div>
                {current.strengths?.length > 0 && (
                  <div className="tag-row">
                    {current.strengths.map((s) => <span className="tag" key={s}>{s}</span>)}
                  </div>
                )}
                {current.bio && <p className="fight-card-bio">{current.bio}</p>}
                {current.distance_km != null && (
                  <div className="fight-card-distance">{current.distance_km.toFixed(1)} km away</div>
                )}
              </div>
            </div>
            <div className="deck-actions">
              <button className="deck-btn pass" onClick={() => swipe('pass')} title="Not feeling it">✕</button>
              <button className="deck-btn like" onClick={() => swipe('like')} title="Hot for a fade">🔥</button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="em-title">No more fighters nearby</div>
            <p>Try widening your filters, or check back once more fighters go "looking."</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
