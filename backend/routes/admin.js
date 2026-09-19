import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { signAdminToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get((email || '').toLowerCase());
  if (!row || !row.is_admin || !bcrypt.compareSync(password || '', row.password_hash)) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  const admin = { id: row.id, email: row.email, name: row.name };
  res.json({ token: signAdminToken(admin), admin });
});

router.get('/me', requireAdmin, (req, res) => {
  const row = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(req.adminId);
  res.json({ admin: row });
});

export default router;