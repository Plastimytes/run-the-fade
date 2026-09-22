import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';

const router = Router();

// One-time admin creation endpoint. Protected by ADMIN_SETUP_TOKEN env var.
// Call once, then remove the route and the token from environment.
router.post('/one-time-create', async (req, res) => {
  const token = req.get('x-admin-setup-token') || '';
  if (!process.env.ADMIN_SETUP_TOKEN || token !== process.env.ADMIN_SETUP_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const email = (req.body.email || process.env.ADMIN_EMAIL || 'admin@runthefade.app').toLowerCase();
  const password = req.body.password || process.env.ADMIN_PASSWORD || 'ChangeThisAdmin1!';
  const name = req.body.name || process.env.ADMIN_NAME || 'RunTheFade Admin';

  try {
    const existing = db.prepare('SELECT id, is_admin FROM users WHERE email = ?').get(email);
    if (existing) {
      if (!existing.is_admin) {
        db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(existing.id);
      }
      return res.json({ ok: true, message: 'Admin already exists (flagged if needed).' });
    }

    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (email, password_hash, name, is_admin) VALUES (?, ?, ?, 1)').run(email, hash, name);
    return res.json({ ok: true, message: 'Admin account created.' });
  } catch (err) {
    console.error('admin-setup error', err);
    return res.status(500).json({ error: err.message || 'Failed' });
  }
});

export default router;
