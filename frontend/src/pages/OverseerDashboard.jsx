import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Layout from '../components/Layout.jsx';

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}

export default function OverseerDashboard() {
  const [locations, setLocations] = useState([]);
  const [pending, setPending] = useState([]);
  const [names, setNames] = useState({}); // user_id -> name
  const [error, setError] = useState('');
  const [locForm, setLocForm] = useState({ name: '', address: '', rules: '' });
  const [creating, setCreating] = useState(false);
  const [resultChoice, setResultChoice] = useState({}); // fight_id -> winner_id | 'draw'
  const [resultPhoto, setResultPhoto] = useState({}); // fight_id -> File

  const loadAll = async () => {
    try {
      const [loc, pend] = await Promise.all([api.getMyLocations(), api.getPendingApprovals()]);
      setLocations(loc.locations);
      setPending(pend.fights);

      const ids = new Set();
      pend.fights.forEach((f) => { ids.add(f.match.user_a); ids.add(f.match.user_b); });
      const entries = await Promise.all(
        [...ids].map(async (id) => [id, (await api.getFighter(id)).fighter.name])
      );
      setNames(Object.fromEntries(entries));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const createLocation = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const payload = { ...locForm };
      if (navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => { payload.lat = pos.coords.latitude; payload.lng = pos.coords.longitude; resolve(); },
            () => resolve(),
            { timeout: 2000 }
          );
        });
      }
      await api.createLocation(payload);
      setLocForm({ name: '', address: '', rules: '' });
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const approve = async (id) => {
    try { await api.approveFight(id); await loadAll(); } catch (err) { setError(err.message); }
  };
  const decline = async (id) => {
    try { await api.declineFight(id); await loadAll(); } catch (err) { setError(err.message); }
  };

  const confirmResult = async (fight) => {
    const choice = resultChoice[fight.id];
    if (!choice) { setError('Pick a winner or draw first'); return; }
    const photo = resultPhoto[fight.id];
    try {
      if (choice === 'draw') {
        await api.confirmResult(fight.id, { is_draw: true, photo });
      } else {
        const loser = choice === fight.match.user_a ? fight.match.user_b : fight.match.user_a;
        await api.confirmResult(fight.id, { winner_id: Number(choice), loser_id: loser, is_draw: false, photo });
      }
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const approved = pending.filter((f) => f.status === 'approved');
  const awaitingApproval = pending.filter((f) => f.status === 'pending');

  return (
    <Layout>
      <h1 className="page-title">Overseer</h1>
      <p className="page-subtitle">Manage your locations and run the fights held there.</p>

      {error && <div className="error-banner">{error}</div>}

      <div className="section">
        <div className="section-title">Add a Location</div>
        <form onSubmit={createLocation} className="grid-2">
          <div className="field">
            <label>Name</label>
            <input value={locForm.name} onChange={(e) => setLocForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Address</label>
            <input value={locForm.address} onChange={(e) => setLocForm((f) => ({ ...f, address: e.target.value }))} required />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>Your fighting background</label>
            <textarea
              value={locForm.overseer_experience}
              onChange={(e) => setLocForm((f) => ({ ...f, overseer_experience: e.target.value }))}
              placeholder="Styles trained, years of experience, coaching background, etc. — required so fighters know you understand what you're overseeing."
              required
            />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>Rules</label>
            <textarea value={locForm.rules} onChange={(e) => setLocForm((f) => ({ ...f, rules: e.target.value }))} placeholder="Gloves required, 3 rounds, no weight-class mixing…" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button className="btn btn-primary" disabled={creating}>{creating ? 'Adding…' : 'Add Location'}</button>
          </div>
        </form>
      </div>

      <div className="section">
        <div className="section-title">My Locations</div>
        {locations.length === 0 ? (
          <p className="muted">You don't oversee any locations yet.</p>
        ) : (
          <div className="card-list">
            {locations.map((l) => (
              <div className="list-card" key={l.id}>
                <div>
                  <div className="list-card-name">{l.name}</div>
                  <div className="list-card-meta">{l.address}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-title">Awaiting Approval</div>
        {awaitingApproval.length === 0 ? (
          <p className="muted">Nothing pending.</p>
        ) : (
          <div className="card-list">
            {awaitingApproval.map((f) => (
              <div className="list-card" key={f.id}>
                <div>
                  <div className="list-card-name">
                    {names[f.match.user_a] || '…'} vs {names[f.match.user_b] || '…'}
                  </div>
                  <div className="list-card-meta">
                    {f.location?.name} · {new Date(f.scheduled_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary" onClick={() => decline(f.id)}>Decline</button>
                  <button className="btn btn-primary" onClick={() => approve(f.id)}>Approve</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-title">Approved — Confirm Result</div>
        {approved.length === 0 ? (
          <p className="muted">No approved fights waiting on a result.</p>
        ) : (
          <div className="card-list">
            {approved.map((f) => (
              <div className="list-card" key={f.id} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="list-card-name">
                      {names[f.match.user_a] || '…'} vs {names[f.match.user_b] || '…'}
                    </div>
                    <div className="list-card-meta">
                      {f.location?.name} · {new Date(f.scheduled_at).toLocaleString()}
                    </div>
                  </div>
                  <StatusBadge status={f.status} />
                </div>
                <div className="grid-2" style={{ marginTop: 12 }}>
                  <div className="field">
                    <label>Winner</label>
                    <select
                      defaultValue=""
                      onChange={(e) => setResultChoice((s) => ({ ...s, [f.id]: e.target.value }))}
                    >
                      <option value="" disabled>Select outcome…</option>
                      <option value={f.match.user_a}>{names[f.match.user_a]} wins</option>
                      <option value={f.match.user_b}>{names[f.match.user_b]} wins</option>
                      <option value="draw">Draw</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Proof photo (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setResultPhoto((s) => ({ ...s, [f.id]: e.target.files?.[0] || null }))}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <button className="btn btn-primary btn-block" onClick={() => confirmResult(f)}>
                      Confirm Result
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
