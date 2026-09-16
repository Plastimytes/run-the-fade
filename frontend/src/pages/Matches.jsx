import { useEffect, useState } from 'react';
import { api, photoSrc } from '../api.js';
import Layout from '../components/Layout.jsx';
import ChatPanel from '../components/ChatPanel.jsx';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [proposing, setProposing] = useState(null); // match_id being scheduled
  const [chatting, setChatting] = useState(null); // match_id with chat open
  const [scheduled, setScheduled] = useState({});
  const [confirmedFor, setConfirmedFor] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const m = await api.getMatches();
        setMatches(m.matches);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const propose = async (matchId) => {
    const details = scheduled[matchId];
    if (!details?.scheduled_at) {
      setError('Pick a date and time first');
      return;
    }
    try {
      const res = await api.proposeFight({
        match_id: matchId,
        scheduled_at: new Date(details.scheduled_at).toISOString(),
      });
      setProposing(null);
      setError('');
      setConfirmedFor({ matchId, location: res.fight?.location?.name });
      setTimeout(() => setConfirmedFor(null), 5000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Layout>
      <h1 className="page-title">Matches</h1>
      <p className="page-subtitle">Mutual call-outs. The nearest overseer is called automatically when you schedule.</p>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <div className="em-title">No matches yet</div>
          <p>Head to Find a Fade and start swiping.</p>
        </div>
      ) : (
        <div className="card-list">
          {matches.map((m) => (
            <div className="list-card" key={m.match_id} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {m.fighter?.photo_url ? (
                    <img className="list-avatar" src={photoSrc(m.fighter.photo_url)} alt={m.fighter.name} />
                  ) : (
                    <div className="list-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🥊</div>
                  )}
                  <div>
                    <div className="list-card-name">{m.fighter?.name}</div>
                    <div className="list-card-meta">
                      {m.fighter?.weight_class} · {m.fighter?.fighting_style} · {m.fighter?.rating} pts
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setChatting(chatting === m.match_id ? null : m.match_id)}
                  >
                    {chatting === m.match_id ? 'Close Chat' : 'Chat'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setProposing(proposing === m.match_id ? null : m.match_id)}
                  >
                    {proposing === m.match_id ? 'Cancel' : 'Schedule Fight'}
                  </button>
                </div>
              </div>

              {chatting === m.match_id && <ChatPanel matchId={m.match_id} />}

              {confirmedFor?.matchId === m.match_id && (
                <div className="error-banner" style={{ background: 'rgba(61,220,132,0.12)', borderColor: 'var(--win)', color: 'var(--win)', marginTop: 14 }}>
                  Proposed! {confirmedFor.location ? `${confirmedFor.location} is the nearest location — its overseer has been called.` : 'The nearest overseer has been notified.'}
                </div>
              )}

              {proposing === m.match_id && (
                <div className="grid-2" style={{ marginTop: 14 }}>
                  <div className="field" style={{ gridColumn: '1 / -1' }}>
                    <label>Date & time</label>
                    <input
                      type="datetime-local"
                      onChange={(e) =>
                        setScheduled((s) => ({ ...s, [m.match_id]: { ...s[m.match_id], scheduled_at: e.target.value } }))
                      }
                    />
                    <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                      We'll page the nearest overseer to your location automatically — no need to pick a venue.
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <button className="btn btn-primary" onClick={() => propose(m.match_id)}>
                      Send Proposal
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
