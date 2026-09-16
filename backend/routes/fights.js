import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { notify } from '../db/notify.js';
import { uploadPhoto, toDataUri } from '../middleware/upload.js';

const router = Router();
router.use(requireAuth);

const K = 32;
function eloDelta(ratingA, ratingB, scoreA) {
  const expectedA = 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
  return Math.round(K * (scoreA - expectedA));
}

function haversineKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v === null || v === undefined)) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fightWithDetails(id) {
  const fr = db.prepare('SELECT * FROM fight_requests WHERE id = ?').get(id);
  if (!fr) return null;
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(fr.match_id);
  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(fr.location_id);
  const overseer = location ? db.prepare('SELECT name FROM users WHERE id = ?').get(location.owner_id) : null;
  const result = db.prepare('SELECT * FROM fight_results WHERE fight_request_id = ?').get(id);
  return { ...fr, match, location, overseer_name: overseer?.name || null, result: result || null };
}

// Propose a fight between two matched fighters. The nearest overseer's
// location (by fighter location) is auto-assigned — fighters don't pick one.
router.post('/', (req, res) => {
  const { match_id, scheduled_at } = req.body;
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(match_id);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (req.userId !== match.user_a && req.userId !== match.user_b) {
    return res.status(403).json({ error: 'You are not part of this match' });
  }
  if (!scheduled_at) return res.status(400).json({ error: 'scheduled_at is required' });

  const pa = db.prepare('SELECT lat, lng FROM fighter_profiles WHERE user_id = ?').get(match.user_a);
  const pb = db.prepare('SELECT lat, lng FROM fighter_profiles WHERE user_id = ?').get(match.user_b);
  const points = [pa, pb].filter((p) => p.lat != null && p.lng != null);
  if (points.length === 0) {
    return res.status(400).json({ error: 'Set your location on your profile so the nearest overseer can be found' });
  }
  const refLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const refLng = points.reduce((s, p) => s + p.lng, 0) / points.length;

  const locations = db.prepare('SELECT * FROM locations WHERE lat IS NOT NULL AND lng IS NOT NULL').all();
  if (locations.length === 0) {
    return res.status(400).json({ error: 'No overseer locations available yet — an overseer needs to add one first' });
  }
  let nearest = locations[0];
  let nearestDist = haversineKm(refLat, refLng, nearest.lat, nearest.lng);
  for (const loc of locations.slice(1)) {
    const d = haversineKm(refLat, refLng, loc.lat, loc.lng);
    if (d < nearestDist) { nearest = loc; nearestDist = d; }
  }

  const info = db
    .prepare(
      'INSERT INTO fight_requests (match_id, location_id, proposed_by, scheduled_at) VALUES (?, ?, ?, ?)'
    )
    .run(match_id, nearest.id, req.userId, scheduled_at);

  notify(
    nearest.owner_id,
    'fight_status',
    "You've been called to oversee a fade",
    `A fight has been proposed at ${nearest.name} — review and approve it.`,
    '/overseer'
  );

  res.status(201).json({ fight: fightWithDetails(info.lastInsertRowid) });
});

// Fights I'm part of, or fights pending at locations I oversee
router.get('/mine', (req, res) => {
  const rows = db
    .prepare(
      `SELECT fr.id FROM fight_requests fr
       JOIN matches m ON m.id = fr.match_id
       WHERE m.user_a = ? OR m.user_b = ?
       ORDER BY fr.scheduled_at DESC`
    )
    .all(req.userId, req.userId);
  res.json({ fights: rows.map((r) => fightWithDetails(r.id)) });
});

router.get('/pending-approval', (req, res) => {
  const rows = db
    .prepare(
      `SELECT fr.id FROM fight_requests fr
       JOIN locations l ON l.id = fr.location_id
       WHERE l.owner_id = ? AND fr.status = 'pending'
       ORDER BY fr.scheduled_at ASC`
    )
    .all(req.userId);
  res.json({ fights: rows.map((r) => fightWithDetails(r.id)) });
});

function assertOverseer(req, res, fight) {
  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(fight.location_id);
  if (!location || location.owner_id !== req.userId) {
    res.status(403).json({ error: 'Only the overseer of this location can do that' });
    return false;
  }
  return true;
}

router.post('/:id/approve', (req, res) => {
  const fight = db.prepare('SELECT * FROM fight_requests WHERE id = ?').get(req.params.id);
  if (!fight) return res.status(404).json({ error: 'Fight not found' });
  if (!assertOverseer(req, res, fight)) return;
  db.prepare("UPDATE fight_requests SET status = 'approved' WHERE id = ?").run(fight.id);
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(fight.match_id);
  const loc = db.prepare('SELECT name FROM locations WHERE id = ?').get(fight.location_id);
  [match.user_a, match.user_b].forEach((uid) =>
    notify(uid, 'fight_status', 'Fight approved', `Your fade at ${loc.name} is confirmed.`, '/fights')
  );
  res.json({ fight: fightWithDetails(fight.id) });
});

router.post('/:id/decline', (req, res) => {
  const fight = db.prepare('SELECT * FROM fight_requests WHERE id = ?').get(req.params.id);
  if (!fight) return res.status(404).json({ error: 'Fight not found' });
  if (!assertOverseer(req, res, fight)) return;
  db.prepare("UPDATE fight_requests SET status = 'declined' WHERE id = ?").run(fight.id);
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(fight.match_id);
  const loc = db.prepare('SELECT name FROM locations WHERE id = ?').get(fight.location_id);
  [match.user_a, match.user_b].forEach((uid) =>
    notify(uid, 'fight_status', 'Fight declined', `The overseer declined your fade at ${loc.name}.`, '/fights')
  );
  res.json({ fight: fightWithDetails(fight.id) });
});

// Overseer confirms the outcome; ratings + records update here. Accepts an
// optional photo as proof (multipart/form-data).
router.post('/:id/result', (req, res) => {
  uploadPhoto.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const fight = db.prepare('SELECT * FROM fight_requests WHERE id = ?').get(req.params.id);
    if (!fight) return res.status(404).json({ error: 'Fight not found' });
    if (!assertOverseer(req, res, fight)) return;
    if (fight.status !== 'approved') {
      return res.status(400).json({ error: 'Fight must be approved before a result can be confirmed' });
    }

    const { winner_id, loser_id, notes } = req.body;
    const is_draw = req.body.is_draw === 'true' || req.body.is_draw === true;
    const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(fight.match_id);
    const [pa, pb] = [
      db.prepare('SELECT * FROM fighter_profiles WHERE user_id = ?').get(match.user_a),
      db.prepare('SELECT * FROM fighter_profiles WHERE user_id = ?').get(match.user_b),
    ];

    if (is_draw) {
      const deltaA = eloDelta(pa.rating, pb.rating, 0.5);
      db.prepare('UPDATE fighter_profiles SET rating = rating + ?, draws = draws + 1 WHERE user_id = ?')
        .run(deltaA, pa.user_id);
      db.prepare('UPDATE fighter_profiles SET rating = rating + ?, draws = draws + 1 WHERE user_id = ?')
        .run(-deltaA, pb.user_id);
    } else {
      if (![match.user_a, match.user_b].includes(Number(winner_id))) {
        return res.status(400).json({ error: 'winner_id must be one of the two matched fighters' });
      }
      const winnerProfile = Number(winner_id) === pa.user_id ? pa : pb;
      const loserProfile = Number(winner_id) === pa.user_id ? pb : pa;
      const delta = eloDelta(winnerProfile.rating, loserProfile.rating, 1);
      db.prepare('UPDATE fighter_profiles SET rating = rating + ?, wins = wins + 1 WHERE user_id = ?')
        .run(delta, winnerProfile.user_id);
      db.prepare('UPDATE fighter_profiles SET rating = rating - ?, losses = losses + 1 WHERE user_id = ?')
        .run(delta, loserProfile.user_id);
    }

    const photo_url = req.file ? toDataUri(req.file) : null;

    db.prepare(
      `INSERT INTO fight_results (fight_request_id, winner_id, loser_id, is_draw, confirmed_by, notes, photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      fight.id,
      is_draw ? null : Number(winner_id),
      is_draw ? null : Number(loser_id),
      is_draw ? 1 : 0,
      req.userId,
      notes ?? '',
      photo_url
    );

    db.prepare("UPDATE fight_requests SET status = 'completed' WHERE id = ?").run(fight.id);
    [match.user_a, match.user_b].forEach((uid) =>
      notify(uid, 'fight_status', 'Result confirmed', is_draw ? 'Your fade ended in a draw.' : 'Your fade result is in — check your record.', '/rankings')
    );
    res.json({ fight: fightWithDetails(fight.id) });
  });
});

export default router;
