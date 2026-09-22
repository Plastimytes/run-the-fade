import jwt from 'jsonwebtoken';
import db from '../db/index.js';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '30d' });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, SECRET);
    const row = db.prepare('SELECT is_banned FROM users WHERE id = ?').get(payload.id);
    if (!row) return res.status(401).json({ error: 'Invalid or expired token' });
    if (row.is_banned) return res.status(403).json({ error: 'This account has been suspended.' });
    req.userId = payload.id;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Admin tokens are a separate scope (role: 'admin') and expire much sooner
// than regular fighter tokens, since they carry elevated access.
export function signAdminToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: 'admin' }, SECRET, { expiresIn: '12h' });
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, SECRET);
    if (payload.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const row = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(payload.id);
    if (!row || !row.is_admin) return res.status(403).json({ error: 'Admin access required' });
    req.adminId = payload.id;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}