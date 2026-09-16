import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// Any user can become an overseer by creating a location — flips is_overseer on.
router.post('/', (req, res) => {
  const { name, address, lat, lng, rules } = req.body;
  if (!name || !address) return res.status(400).json({ error: 'Name and address are required' });

  const info = db
    .prepare('INSERT INTO locations (owner_id, name, address, lat, lng, rules) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.userId, name, address, lat ?? null, lng ?? null, rules ?? '');

  db.prepare('UPDATE fighter_profiles SET is_overseer = 1 WHERE user_id = ?').run(req.userId);

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
