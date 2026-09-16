import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { notify } from '../db/notify.js';

const router = Router();
router.use(requireAuth);

function assertInMatch(req, res, matchId) {
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!match) {
    res.status(404).json({ error: 'Match not found' });
    return null;
  }
  if (match.user_a !== req.userId && match.user_b !== req.userId) {
    res.status(403).json({ error: 'You are not part of this match' });
    return null;
  }
  return match;
}

router.get('/:matchId/messages', (req, res) => {
  const match = assertInMatch(req, res, req.params.matchId);
  if (!match) return;
  const rows = db
    .prepare('SELECT * FROM messages WHERE match_id = ? ORDER BY created_at ASC')
    .all(match.id);
  res.json({ messages: rows });
});

router.post('/:matchId/messages', (req, res) => {
  const match = assertInMatch(req, res, req.params.matchId);
  if (!match) return;
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Message cannot be empty' });
  if (body.length > 2000) return res.status(400).json({ error: 'Message is too long' });

  const info = db
    .prepare('INSERT INTO messages (match_id, sender_id, body) VALUES (?, ?, ?)')
    .run(match.id, req.userId, body.trim());
  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid);

  const recipientId = match.user_a === req.userId ? match.user_b : match.user_a;
  const sender = db.prepare('SELECT name FROM users WHERE id = ?').get(req.userId);
  notify(recipientId, 'message', `New message from ${sender.name}`, body.trim().slice(0, 80), '/matches');

  res.status(201).json({ message });
});

export default router;
