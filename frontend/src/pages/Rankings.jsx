import { useEffect, useState } from 'react';
import { api, photoSrc } from '../api.js';
import Layout from '../components/Layout.jsx';
import { WEIGHT_CLASSES, FIGHTING_STYLES } from '../constants.js';

export default function Rankings() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ weight_class: '', fighting_style: '' });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = {};
        if (filters.weight_class) params.weight_class = filters.weight_class;
        if (filters.fighting_style) params.fighting_style = filters.fighting_style;
        const data = await api.getRankings(params);
        setRows(data.rankings);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters.weight_class, filters.fighting_style]);

  return (
    <Layout>
      <h1 className="page-title">Rankings</h1>
      <p className="page-subtitle">Ratings update after every overseer-confirmed result.</p>

      <div className="filter-bar">
        <select value={filters.weight_class} onChange={(e) => setFilters((f) => ({ ...f, weight_class: e.target.value }))}>
          <option value="">All weight classes</option>
          {WEIGHT_CLASSES.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
        <select value={filters.fighting_style} onChange={(e) => setFilters((f) => ({ ...f, fighting_style: e.target.value }))}>
          <option value="">All styles</option>
          {FIGHTING_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="empty-state">
          <div className="em-title">No ranked fighters yet</div>
          <p>Rankings appear once fighters have at least one confirmed result.</p>
        </div>
      ) : (
        <table className="rank-table">
          <thead>
            <tr>
              <th>#</th>
              <th></th>
              <th>Fighter</th>
              <th>Weight Class</th>
              <th>Style</th>
              <th>Record</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id}>
                <td className="rank-num">{r.rank}</td>
                <td>
                  {r.photo_url ? (
                    <img className="list-avatar" style={{ width: 30, height: 30 }} src={photoSrc(r.photo_url)} alt={r.name} />
                  ) : (
                    <div className="list-avatar" style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🥊</div>
                  )}
                </td>
                <td>{r.name}</td>
                <td>{r.weight_class}</td>
                <td>{r.fighting_style}</td>
                <td>{r.wins}-{r.losses}-{r.draws}</td>
                <td className="rank-rating">{r.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}
