import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { notify } from '../db/notify.js';

const router = Router();
router.use(requireAuth);

router.post('/', (req, res) => {
  const { swiped_id, direction } = req.body;
  if (!swiped_id || !['like', 'pass'].includes(direction)) {
    return res.status(400).json({ error: 'swiped_id and a valid direction are required' });
  }
  if (Number(swiped_id) === req.userId) {
    return res.status(400).json({ error: "You can't swipe on yourself" });
  }

  try {
    db.prepare(
      'INSERT INTO swipes (swiper_id, swiped_id, direction) VALUES (?, ?, ?)'
    ).run(req.userId, swiped_id, direction);
  } catch {
    return res.status(409).json({ error: 'Already swiped on this fighter' });
  }

  let matched = false;
  let match = null;
  if (direction === 'like') {
    const reciprocal = db
      .prepare("SELECT * FROM swipes WHERE swiper_id = ? AND swiped_id = ? AND direction = 'like'")
      .get(swiped_id, req.userId);

    const me = db.prepare('SELECT name FROM users WHERE id = ?').get(req.userId);

    if (reciprocal) {
      const [a, b] = [req.userId, Number(swiped_id)].sort((x, y) => x - y);
      const info = db
        .prepare('INSERT OR IGNORE INTO matches (user_a, user_b) VALUES (?, ?)')
        .run(a, b);
      matched = true;
      match = db.prepare('SELECT * FROM matches WHERE user_a = ? AND user_b = ?').get(a, b);

      const them = db.prepare('SELECT name FROM users WHERE id = ?').get(swiped_id);
      notify(req.userId, 'match', `It's a match!`, `You and ${them.name} are both hot for a fade.`, '/matches');
      notify(swiped_id, 'match', `It's a match!`, `You and ${me.name} are both hot for a fade.`, '/matches');
    } else {
      // Not a match yet — let the other fighter know someone's interested,
      // same as tapping the fire icon does on a dating app.
      notify(swiped_id, 'like', `${me.name} tapped your fire icon`, 'Swipe on them back to lock in a match.', '/swipe');
    }
  }

  res.status(201).json({ matched, match });
});

router.get('/matches', (req, res) => {
  const rows = db
    .prepare(
      `SELECT m.id as match_id, m.created_at,
        CASE WHEN m.user_a = ? THEN m.user_b ELSE m.user_a END as other_id
       FROM matches m WHERE m.user_a = ? OR m.user_b = ?`
    )
    .all(req.userId, req.userId, req.userId);

  const matches = rows.map((r) => {
    const other = db
      .prepare(
        `SELECT fp.*, u.name FROM fighter_profiles fp JOIN users u ON u.id = fp.user_id WHERE fp.user_id = ?`
      )
      .get(r.other_id);
    return {
      match_id: r.match_id,
      created_at: r.created_at,
      fighter: other
        ? { ...other, strengths: JSON.parse(other.strengths || '[]'), is_overseer: !!other.is_overseer }
        : null,
    };
  });

  res.json({ matches });
});

export default router;
