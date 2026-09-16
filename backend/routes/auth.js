import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

router.post('/signup', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'An account with that email already exists' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)')
    .run(email.toLowerCase(), hash, name);

  db.prepare(
    `INSERT INTO fighter_profiles (user_id, weight_class, height_class, fighting_style)
     VALUES (?, 'Unset', 'Unset', 'Unset')`
  ).run(info.lastInsertRowid);

  const user = { id: info.lastInsertRowid, email, name };
  res.status(201).json({ token: signToken(user), user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get((email || '').toLowerCase());
  if (!row || !bcrypt.compareSync(password || '', row.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const user = { id: row.id, email: row.email, name: row.name };
  res.json({ token: signToken(user), user });
});

export default router;
