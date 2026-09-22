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

router.use(requireAdmin);

router.get('/stats', (req, res) => {
  const q = (sql) => db.prepare(sql).get();
  const totalFighters = q("SELECT COUNT(*) c FROM users WHERE is_admin = 0").c;
  const looking = q("SELECT COUNT(*) c FROM fighter_profiles WHERE status = 'looking'").c;
  const totalMatches = q("SELECT COUNT(*) c FROM matches").c;
  const totalFights = q("SELECT COUNT(*) c FROM fight_requests").c;
  const completedFights = q("SELECT COUNT(*) c FROM fight_requests WHERE status = 'completed'").c;
  const pendingChallenges = q("SELECT COUNT(*) c FROM fight_requests WHERE status = 'awaiting_opponent'").c;
  const pendingApproval = q("SELECT COUNT(*) c FROM fight_requests WHERE status = 'pending'").c;
  const totalLocations = q("SELECT COUNT(*) c FROM locations").c;
  const totalOverseers = q("SELECT COUNT(*) c FROM fighter_profiles WHERE is_overseer = 1").c;
  const newSignups7d = q("SELECT COUNT(*) c FROM users WHERE is_admin = 0 AND created_at >= datetime('now', '-7 days')").c;
  const bannedCount = q("SELECT COUNT(*) c FROM users WHERE is_banned = 1").c;
  const topFighter = db
    .prepare(
      `SELECT u.name, fp.rating FROM fighter_profiles fp JOIN users u ON u.id = fp.user_id
       WHERE fp.wins + fp.losses + fp.draws > 0 ORDER BY fp.rating DESC LIMIT 1`
    )
    .get();

  res.json({
    totalFighters, looking, totalMatches, totalFights, completedFights,
    pendingChallenges, pendingApproval, totalLocations, totalOverseers,
    newSignups7d, bannedCount, topFighter: topFighter || null,
  });
});

router.get('/signups-series', (req, res) => {
  const days = Math.min(Number(req.query.days) || 14, 90);
  const rows = db
    .prepare(
      `SELECT date(created_at) as day, COUNT(*) as count FROM users
       WHERE is_admin = 0 AND created_at >= datetime('now', '-' || ? || ' days')
       GROUP BY date(created_at) ORDER BY day ASC`
    )
    .all(days);

  const byDay = Object.fromEntries(rows.map((r) => [r.day, r.count]));
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    series.push({ day: key, count: byDay[key] || 0 });
  }
  res.json({ series });
});

router.get('/style-breakdown', (req, res) => {
  const rows = db
    .prepare(
      `SELECT fighting_style, COUNT(*) as count FROM fighter_profiles
       WHERE fighting_style != 'Unset' GROUP BY fighting_style ORDER BY count DESC`
    )
    .all();
  res.json({ breakdown: rows });
});

router.get('/fighters', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  let rows = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.is_banned, u.created_at,
        fp.weight_class, fp.fighting_style, fp.city, fp.status, fp.rating,
        fp.wins, fp.losses, fp.draws, fp.is_overseer, fp.photo_url
       FROM users u JOIN fighter_profiles fp ON fp.user_id = u.id
       WHERE u.is_admin = 0
       ORDER BY u.created_at DESC`
    )
    .all();
  if (q) {
    rows = rows.filter(
      (r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || (r.city || '').toLowerCase().includes(q)
    );
  }
  res.json({ fighters: rows });
});

router.post('/fighters/:id/ban', (req, res) => {
  db.prepare('UPDATE users SET is_banned = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.post('/fighters/:id/unban', (req, res) => {
  db.prepare('UPDATE users SET is_banned = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/fights', (req, res) => {
  const rows = db
    .prepare(
      `SELECT fr.id, fr.status, fr.scheduled_at, fr.created_at,
        m.user_a, m.user_b, ua.name as fighter_a_name, ub.name as fighter_b_name,
        l.name as location_name, res.winner_id, res.is_draw
       FROM fight_requests fr
       JOIN matches m ON m.id = fr.match_id
       JOIN users ua ON ua.id = m.user_a
       JOIN users ub ON ub.id = m.user_b
       JOIN locations l ON l.id = fr.location_id
       LEFT JOIN fight_results res ON res.fight_request_id = fr.id
       ORDER BY fr.created_at DESC`
    )
    .all();
  res.json({ fights: rows });
});

router.get('/locations', (req, res) => {
  const rows = db
    .prepare(
      `SELECT l.id, l.name, l.address, l.rules, l.created_at, u.name as owner_name, fp.overseer_experience,
        (SELECT COUNT(*) FROM fight_requests WHERE location_id = l.id) as fight_count
       FROM locations l JOIN users u ON u.id = l.owner_id
       JOIN fighter_profiles fp ON fp.user_id = l.owner_id
       ORDER BY l.created_at DESC`
    )
    .all();
  res.json({ locations: rows });
});

router.get('/activity', (req, res) => {
  const signups = db
    .prepare(`SELECT id, name, created_at FROM users WHERE is_admin = 0 ORDER BY created_at DESC LIMIT 8`)
    .all()
    .map((r) => ({ type: 'signup', text: `${r.name} joined`, at: r.created_at }));

  const matches = db
    .prepare(
      `SELECT m.created_at, ua.name as a, ub.name as b FROM matches m
       JOIN users ua ON ua.id = m.user_a JOIN users ub ON ub.id = m.user_b
       ORDER BY m.created_at DESC LIMIT 8`
    )
    .all()
    .map((r) => ({ type: 'match', text: `${r.a} and ${r.b} matched`, at: r.created_at }));

  const results = db
    .prepare(
      `SELECT res.confirmed_at, res.is_draw, w.name as winner, l.name as loser, loc.name as loc
       FROM fight_results res
       LEFT JOIN users w ON w.id = res.winner_id
       LEFT JOIN users l ON l.id = res.loser_id
       JOIN fight_requests fr ON fr.id = res.fight_request_id
       JOIN locations loc ON loc.id = fr.location_id
       ORDER BY res.confirmed_at DESC LIMIT 8`
    )
    .all()
    .map((r) => ({
      type: 'result',
      text: r.is_draw ? `Draw confirmed at ${r.loc}` : `${r.winner} beat ${r.loser} at ${r.loc}`,
      at: r.confirmed_at,
    }));

  const locations = db
    .prepare(`SELECT l.name, l.created_at, u.name as owner FROM locations l JOIN users u ON u.id = l.owner_id ORDER BY l.created_at DESC LIMIT 8`)
    .all()
    .map((r) => ({ type: 'location', text: `${r.owner} opened ${r.name}`, at: r.created_at }));

  const feed = [...signups, ...matches, ...results, ...locations]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 15);

  res.json({ activity: feed });
});

router.get('/alerts', (req, res) => {
  const q = (sql) => db.prepare(sql).get().c;
  const alerts = [];
  const pendingChallenges = q("SELECT COUNT(*) c FROM fight_requests WHERE status = 'awaiting_opponent'");
  if (pendingChallenges > 0) alerts.push({ text: `${pendingChallenges} challenge${pendingChallenges === 1 ? '' : 's'} awaiting a response` });
  const pendingApproval = q("SELECT COUNT(*) c FROM fight_requests WHERE status = 'pending'");
  if (pendingApproval > 0) alerts.push({ text: `${pendingApproval} fight${pendingApproval === 1 ? '' : 's'} awaiting overseer approval` });
  const newSignups = q("SELECT COUNT(*) c FROM users WHERE is_admin = 0 AND created_at >= datetime('now', '-1 days')");
  if (newSignups > 0) alerts.push({ text: `${newSignups} new fighter${newSignups === 1 ? '' : 's'} in the last 24h` });
  const incompleteProfiles = q("SELECT COUNT(*) c FROM fighter_profiles WHERE weight_class = 'Unset'");
  if (incompleteProfiles > 0) alerts.push({ text: `${incompleteProfiles} fighter${incompleteProfiles === 1 ? '' : 's'} haven't finished their profile` });
  const banned = q("SELECT COUNT(*) c FROM users WHERE is_banned = 1");
  if (banned > 0) alerts.push({ text: `${banned} account${banned === 1 ? '' : 's'} currently suspended` });

  res.json({ alerts });
});

export default router;