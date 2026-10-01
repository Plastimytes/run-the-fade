import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { adminApi, photoSrc } from '../api.js';
import { useAdminAuth } from '../AdminAuthContext.jsx';
import AdminLayout from './AdminLayout.jsx';

const PIE_COLORS = ['#f2e600', '#23f1e0', '#ff8a3d', '#8a6bff', '#ff4d9e', '#4dff88', '#ffffff', '#f2e600', '#23f1e0', '#ff8a3d'];

// Static sample data — renders with no API call, no dependency on real data
// existing yet. Useful to confirm charts work at all in this environment,
// separate from whatever the real-data panels above are doing.
const SAMPLE_WEEKLY = [
  { day: 'Mon', fights: 3 }, { day: 'Tue', fights: 5 }, { day: 'Wed', fights: 2 },
  { day: 'Thu', fights: 7 }, { day: 'Fri', fights: 6 }, { day: 'Sat', fights: 9 }, { day: 'Sun', fights: 4 },
];
const SAMPLE_RATING = [
  { band: 'Under 1200', count: 4 }, { band: '1200–1300', count: 9 },
  { band: '1300–1400', count: 5 }, { band: '1400+', count: 2 },
];

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso + (iso.includes('Z') ? '' : 'Z')).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StatCard({ label, value, accent }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-bar" style={{ background: accent }} />
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [series, setSeries] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activity, setActivity] = useState([]);
  const [fighters, setFighters] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, sr, br, al, ac, fi] = await Promise.all([
          adminApi.getStats(),
          adminApi.getSignupsSeries(14),
          adminApi.getStyleBreakdown(),
          adminApi.getAlerts(),
          adminApi.getActivity(),
          adminApi.getFighters(),
        ]);
        setStats(s);
        setSeries(sr.series.map((d) => ({ ...d, label: d.day.slice(5) })));
        setBreakdown(br.breakdown);
        setAlerts(al.alerts);
        setActivity(ac.activity);
        setFighters(fi.fighters.slice(0, 6));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <AdminLayout><p className="muted">Loading dashboard…</p></AdminLayout>;
  }

  return (
    <AdminLayout>
      <h1 className="page-title">Overview</h1>
      <p className="page-subtitle">Welcome back, {admin?.name}.</p>
      {error && <div className="error-banner">{error}</div>}

      <div className="admin-stat-grid">
        <StatCard label="Total Fighters" value={stats.totalFighters} accent="var(--accent)" />
        <StatCard label="Looking for a Fade" value={stats.looking} accent="var(--cyan)" />
        <StatCard label="Completed Fights" value={stats.completedFights} accent="var(--accent)" />
        <StatCard label="New This Week" value={stats.newSignups7d} accent="var(--cyan)" />
      </div>

      <div className="admin-row">
        <div className="admin-panel admin-panel-wide">
          <div className="admin-panel-title">Signups — Last 14 Days</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={series}>
              <defs>
                <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#23f1e0" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#23f1e0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b2b2e" vertical={false} />
              <XAxis dataKey="label" stroke="#8f8f95" fontSize={11} tickLine={false} />
              <YAxis stroke="#8f8f95" fontSize={11} tickLine={false} allowDecimals={false} width={24} />
              <Tooltip contentStyle={{ background: '#19191b', border: '1px solid #2b2b2e', fontSize: 12 }} labelStyle={{ color: '#f2f2ee' }} />
              <Area type="monotone" dataKey="count" stroke="#23f1e0" strokeWidth={2} fill="url(#signupFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-title">Alerts</div>
          {alerts.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>Nothing needs attention.</p>
          ) : (
            <div className="admin-alert-list">
              {alerts.map((a, i) => <div className="admin-alert-item" key={i}>{a.text}</div>)}
            </div>
          )}
        </div>
      </div>

      <div className="admin-row">
        <div className="admin-panel">
          <div className="admin-panel-title">Fighting Styles</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={breakdown} dataKey="count" nameKey="fighting_style" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {breakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#19191b', border: '1px solid #2b2b2e', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="admin-legend">
            {breakdown.map((b, i) => (
              <span key={b.fighting_style}>
                <span className="legend-dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {b.fighting_style} ({b.count})
              </span>
            ))}
          </div>
        </div>

        <div className="admin-panel admin-panel-wide">
          <div className="admin-panel-title">Activity</div>
          <div className="admin-activity-list">
            {activity.length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>Nothing yet.</p>
            ) : (
              activity.map((a, i) => (
                <div className="admin-activity-item" key={i}>
                  <span className={`admin-activity-dot type-${a.type}`} />
                  <span>{a.text}</span>
                  <span className="admin-activity-time">{timeAgo(a.at)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="admin-section-label">Sample Charts (demo data)</div>
      <div className="admin-row">
        <div className="admin-panel">
          <div className="admin-panel-title">Sample: Weekly Fight Volume</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={SAMPLE_WEEKLY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b2b2e" vertical={false} />
              <XAxis dataKey="day" stroke="#8f8f95" fontSize={11} tickLine={false} />
              <YAxis stroke="#8f8f95" fontSize={11} tickLine={false} allowDecimals={false} width={24} />
              <Tooltip contentStyle={{ background: '#19191b', border: '1px solid #2b2b2e', fontSize: 12 }} />
              <Bar dataKey="fights" fill="#f2e600" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-title">Sample: Rating Distribution</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={SAMPLE_RATING} dataKey="count" nameKey="band" innerRadius={40} outerRadius={70} paddingAngle={2}>
                {SAMPLE_RATING.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#19191b', border: '1px solid #2b2b2e', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="admin-legend">
            {SAMPLE_RATING.map((b, i) => (
              <span key={b.band}>
                <span className="legend-dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {b.band} ({b.count})
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Recent Fighters
          <Link to="/admin/fighters" className="admin-link">View all →</Link>
        </div>
        <table className="rank-table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Style</th>
              <th>City</th>
              <th>Rating</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fighters.map((f) => (
              <tr key={f.id}>
                <td>
                  {f.photo_url ? (
                    <img className="list-avatar" style={{ width: 30, height: 30 }} src={photoSrc(f.photo_url)} alt={f.name} />
                  ) : (
                    <div className="list-avatar" style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🥊</div>
                  )}
                </td>
                <td>{f.name}</td>
                <td>{f.fighting_style}</td>
                <td>{f.city || '—'}</td>
                <td className="rank-rating">{f.rating}</td>
                <td>
                  {f.is_banned ? (
                    <span className="status-badge status-declined">banned</span>
                  ) : (
                    <span className="status-badge status-approved">active</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}