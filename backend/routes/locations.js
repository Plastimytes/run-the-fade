import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// Any user can become an overseer by creating a location — flips is_overseer
// on. Requires a declared fighting background: overseers should at least
// know what they're overseeing, even if they're not competing themselves.
router.post('/', (req, res) => {
  const { name, address, lat, lng, rules, overseer_experience } = req.body;
  if (!name || !address) return res.status(400).json({ error: 'Name and address are required' });
  const experience = (overseer_experience ?? '').trim();
  const current = db.prepare('SELECT overseer_experience FROM fighter_profiles WHERE user_id = ?').get(req.userId);
  if (!experience && !current?.overseer_experience) {
    return res.status(400).json({ error: 'Tell us about your fighting background before you can oversee fights' });
  }

  const info = db
    .prepare('INSERT INTO locations (owner_id, name, address, lat, lng, rules) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.userId, name, address, lat ?? null, lng ?? null, rules ?? '');

  db.prepare(
    `UPDATE fighter_profiles SET is_overseer = 1, overseer_experience = ? WHERE user_id = ?`
  ).run(experience || current.overseer_experience, req.userId);

  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ location });
});

router.get('/', (req, res) => {
  const locations = db.prepare('SELECT * FROM locations ORDER BY name').all();
  res.json({ locations });
});

router.get('/mine', (req, res) => {
  const locations = db.prepare('SELECT * FROM locations WHERE owner_id = ?').all(req.userId);
  res.json({ locations });
});

export default router;
