import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadPhoto, toDataUri } from '../middleware/upload.js';
import { notify } from '../db/notify.js';

const router = Router();
router.use(requireAuth);

function rowToProfile(row) {
  if (!row) return null;
  return {
    ...row,
    strengths: JSON.parse(row.strengths || '[]'),
    availability: JSON.parse(row.availability || '[]'),
    is_overseer: !!row.is_overseer,
  };
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

// GET my full profile
router.get('/me', (req, res) => {
  const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(req.userId);
  const profile = db.prepare('SELECT * FROM fighter_profiles WHERE user_id = ?').get(req.userId);
  res.json({ user, profile: rowToProfile(profile) });
});

// PUT update my profile
router.put('/me', (req, res) => {
  const {
    weight_class, height_class, fighting_style, strengths, bio,
    availability, city, lat, lng, is_overseer, status,
  } = req.body;

  const current = db.prepare('SELECT * FROM fighter_profiles WHERE user_id = ?').get(req.userId);
  if (!current) return res.status(404).json({ error: 'Profile not found' });

  db.prepare(
    `UPDATE fighter_profiles SET
      weight_class = ?, height_class = ?, fighting_style = ?, strengths = ?,
      bio = ?, availability = ?, city = ?, lat = ?, lng = ?, is_overseer = ?,
      status = ?, updated_at = datetime('now')
     WHERE user_id = ?`
  ).run(
    weight_class ?? current.weight_class,
    height_class ?? current.height_class,
    fighting_style ?? current.fighting_style,
    JSON.stringify(strengths ?? JSON.parse(current.strengths || '[]')),
    bio ?? current.bio,
    JSON.stringify(availability ?? JSON.parse(current.availability || '[]')),
    city ?? current.city,
    lat ?? current.lat,
    lng ?? current.lng,
    is_overseer === undefined ? current.is_overseer : (is_overseer ? 1 : 0),
    status ?? current.status,
    req.userId
  );

  const updated = db.prepare('SELECT * FROM fighter_profiles WHERE user_id = ?').get(req.userId);

  // Went from not-looking to looking: nudge nearby looking fighters within 25km.
  if (status === 'looking' && current.status !== 'looking' && updated.lat != null && updated.lng != null) {
    const me = db.prepare('SELECT name FROM users WHERE id = ?').get(req.userId);
    const others = db
      .prepare(
        `SELECT user_id, lat, lng FROM fighter_profiles WHERE status = 'looking' AND user_id != ? AND lat IS NOT NULL AND lng IS NOT NULL`
      )
      .all(req.userId);
    for (const o of others) {
      if (haversineKm(updated.lat, updated.lng, o.lat, o.lng) <= 25) {
        notify(o.user_id, 'nearby', `${me.name} is looking for a fade nearby`, '', '/swipe');
      }
    }
  }

  res.json({ profile: rowToProfile(updated) });
});

// POST upload/replace my profile photo
router.post('/me/photo', (req, res) => {
  uploadPhoto.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No photo provided' });
    const photo_url = toDataUri(req.file);
    db.prepare("UPDATE fighter_profiles SET photo_url = ?, updated_at = datetime('now') WHERE user_id = ?")
      .run(photo_url, req.userId);
    res.json({ photo_url });
  });
});

// GET all fighters signed up to the app, excluding self
router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT fp.*, u.name FROM fighter_profiles fp
       JOIN users u ON u.id = fp.user_id
       WHERE fp.user_id != ?
       ORDER BY u.name ASC`
    )
    .all(req.userId);

  res.json({ fighters: rows.map((row) => rowToProfile(row)) });
});

// GET nearby fighters who are "looking", excluding self and already-swiped
router.get('/nearby', (req, res) => {
  const { weight_class, fighting_style, radius_km } = req.query;
  const me = db.prepare('SELECT * FROM fighter_profiles WHERE user_id = ?').get(req.userId);

  const alreadySwiped = db
    .prepare('SELECT swiped_id FROM swipes WHERE swiper_id = ?')
    .all(req.userId)
    .map((r) => r.swiped_id);

  let rows = db
    .prepare(
      `SELECT fp.*, u.name FROM fighter_profiles fp
       JOIN users u ON u.id = fp.user_id
       WHERE fp.user_id != ? AND fp.status = 'looking'`
    )
    .all(req.userId);

  if (alreadySwiped.length) {
    rows = rows.filter((r) => !alreadySwiped.includes(r.user_id));
  }
  if (weight_class) rows = rows.filter((r) => r.weight_class === weight_class);
  if (fighting_style) rows = rows.filter((r) => r.fighting_style === fighting_style);

  let results = rows.map((r) => {
    const distance_km = me ? haversineKm(me.lat, me.lng, r.lat, r.lng) : null;
    return { ...rowToProfile(r), distance_km };
  });

  if (radius_km) {
    const max = parseFloat(radius_km);
    results = results.filter((r) => r.distance_km === null || r.distance_km <= max);
  }

  results.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
  res.json({ fighters: results });
});

// GET a specific fighter's public profile
router.get('/:id', (req, res) => {
  const row = db
    .prepare(
      `SELECT fp.*, u.name FROM fighter_profiles fp JOIN users u ON u.id = fp.user_id WHERE fp.user_id = ?`
    )
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Fighter not found' });
  res.json({ fighter: rowToProfile(row) });
});

export default router;
