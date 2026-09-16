import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { weight_class, fighting_style } = req.query;
  let rows = db
    .prepare(
      `SELECT fp.user_id, fp.weight_class, fp.fighting_style, fp.rating, fp.wins, fp.losses, fp.draws, fp.photo_url, u.name
       FROM fighter_profiles fp JOIN users u ON u.id = fp.user_id
       WHERE fp.wins + fp.losses + fp.draws > 0`
    )
    .all();

  if (weight_class) rows = rows.filter((r) => r.weight_class === weight_class);
  if (fighting_style) rows = rows.filter((r) => r.fighting_style === fighting_style);

  rows.sort((a, b) => b.rating - a.rating);
  res.json({ rankings: rows.map((r, i) => ({ rank: i + 1, ...r })) });
});

export default router;
