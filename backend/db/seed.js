// Seeds 10 demo accounts with varied weight classes, fighting styles, and
// Ugandan cities, plus a handful of completed fights so rankings show a
// real spread rather than everyone at the default 1200. Idempotent — running
// it twice won't duplicate accounts.
//
// Run with: npm run seed   (from the backend/ folder)

import bcrypt from 'bcryptjs';
import db from './index.js';

const PASSWORD = 'RunTheFade1!';

const FIGHTERS = [
  { name: 'Amara Okello', email: 'amara@runthefade.app', weight_class: 'Bantamweight', height_class: 'Short', fighting_style: 'Muay Thai', city: 'Kampala', lat: 0.3476, lng: 32.5825, strengths: ['Speed', 'Footwork'], bio: 'Fast hands, faster feet. Kampala born and raised.' },
  { name: 'Kato Ssentongo', email: 'kato@runthefade.app', weight_class: 'Welterweight', height_class: 'Medium', fighting_style: 'Boxing', city: 'Mukono', lat: 0.3533, lng: 32.7553, strengths: ['Power', 'Chin'], bio: 'Runs Mukono Fight Club. Undefeated at home.', overseer: { name: 'Mukono Fight Club', address: 'Mukono Rd, Mukono', rules: 'Gloves mandatory. 3 rounds. No weight-class mixing.', experience: '12 years boxing, 4 as a licensed amateur coach.' } },
  { name: 'Grace Nabirye', email: 'grace@runthefade.app', weight_class: 'Featherweight', height_class: 'Medium', fighting_style: 'BJJ', city: 'Jinja', lat: 0.4478, lng: 33.2026, strengths: ['Grappling', 'Cardio'], bio: 'Ground game specialist out of Jinja.' },
  { name: 'Brian Tumwesigye', email: 'brian@runthefade.app', weight_class: 'Middleweight', height_class: 'Tall', fighting_style: 'Wrestling', city: 'Entebbe', lat: 0.0512, lng: 32.4637, strengths: ['Takedowns', 'Clinch work'], bio: 'Collegiate wrestling background, now fighting out of Entebbe.' },
  { name: 'Faith Namutebi', email: 'faith@runthefade.app', weight_class: 'Lightweight', height_class: 'Short', fighting_style: 'Kickboxing', city: 'Mbale', lat: 1.0801, lng: 34.1756, strengths: ['Speed', 'Counter-punching'], bio: 'Mbale kickboxing champ, 2024 regional title.' },
  { name: 'Daniel Okwir', email: 'daniel@runthefade.app', weight_class: 'Heavyweight', height_class: 'Tall', fighting_style: 'MMA', city: 'Gulu', lat: 2.7796, lng: 32.2990, strengths: ['Power', 'Reach'], bio: 'Runs Northern Grit Arena. Heavy hands, longer reach.', overseer: { name: 'Northern Grit Arena', address: 'Layibi Rd, Gulu', rules: 'MMA gloves. 3x5 min rounds. Medical check required.', experience: '8 years MMA, former regional amateur champion.' } },
  { name: 'Patricia Akello', email: 'patricia@runthefade.app', weight_class: 'Flyweight', height_class: 'Short', fighting_style: 'Judo', city: 'Mbarara', lat: -0.6072, lng: 30.6545, strengths: ['Footwork', 'Grappling'], bio: 'Judo black belt, quick throws.' },
  { name: 'Isaac Byaruhanga', email: 'isaac@runthefade.app', weight_class: 'Light Heavyweight', height_class: 'Tall', fighting_style: 'Karate', city: 'Masaka', lat: -0.3308, lng: 31.7341, strengths: ['Reach', 'Counter-punching'], bio: 'Shotokan karate, sharp counters.' },
  { name: 'Sarah Nakato', email: 'sarah@runthefade.app', weight_class: 'Welterweight', height_class: 'Medium', fighting_style: 'Taekwondo', city: 'Soroti', lat: 1.7146, lng: 33.6111, strengths: ['Speed', 'Footwork'], bio: 'Kicks first, asks questions never.' },
  { name: 'Moses Ojok', email: 'moses@runthefade.app', weight_class: 'Super Heavyweight', height_class: 'Tall', fighting_style: 'Freestyle', city: 'Arua', lat: 3.0201, lng: 30.9109, strengths: ['Power', 'Chin'], bio: 'Biggest fighter in the app. Moves surprisingly well for his size.' },
];

// [fighter email A, fighter email B, outcome] — outcome is A's email (winner), B's email, or 'draw'
const FIGHTS = [
  ['amara@runthefade.app', 'grace@runthefade.app', 'amara@runthefade.app'],
  ['kato@runthefade.app', 'brian@runthefade.app', 'kato@runthefade.app'],
  ['daniel@runthefade.app', 'isaac@runthefade.app', 'daniel@runthefade.app'],
  ['patricia@runthefade.app', 'sarah@runthefade.app', 'draw'],
  ['moses@runthefade.app', 'faith@runthefade.app', 'moses@runthefade.app'],
  ['amara@runthefade.app', 'kato@runthefade.app', 'kato@runthefade.app'],
  ['grace@runthefade.app', 'patricia@runthefade.app', 'grace@runthefade.app'],
  ['isaac@runthefade.app', 'sarah@runthefade.app', 'isaac@runthefade.app'],
];

const K = 32;
function eloDelta(ratingA, ratingB, scoreA) {
  const expectedA = 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
  return Math.round(K * (scoreA - expectedA));
}

function run() {
  const already = db.prepare('SELECT id FROM users WHERE email = ?').get(FIGHTERS[0].email);
  if (already) {
    console.log('Seed data already present (found amara@runthefade.app) — skipping. Delete the DB file to reseed.');
    return;
  }

  const hash = bcrypt.hashSync(PASSWORD, 10);
  const ids = {}; // email -> user_id
  const locationIds = {}; // owner email -> location_id

  for (const f of FIGHTERS) {
    const info = db
      .prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)')
      .run(f.email, hash, f.name);
    const userId = info.lastInsertRowid;
    ids[f.email] = userId;

    db.prepare(
      `INSERT INTO fighter_profiles
        (user_id, weight_class, height_class, fighting_style, strengths, bio, city, lat, lng, status, is_overseer, overseer_experience)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'looking', ?, ?)`
    ).run(
      userId, f.weight_class, f.height_class, f.fighting_style,
      JSON.stringify(f.strengths), f.bio, f.city, f.lat, f.lng,
      f.overseer ? 1 : 0, f.overseer ? f.overseer.experience : null
    );

    if (f.overseer) {
      const locInfo = db
        .prepare('INSERT INTO locations (owner_id, name, address, lat, lng, rules) VALUES (?, ?, ?, ?, ?, ?)')
        .run(userId, f.overseer.name, f.overseer.address, f.lat, f.lng, f.overseer.rules);
      locationIds[f.email] = locInfo.lastInsertRowid;
    }
  }

  // A third location so overseer coverage spans the middle of the country too.
  const kampalaLoc = db
    .prepare('INSERT INTO locations (owner_id, name, address, lat, lng, rules) VALUES (?, ?, ?, ?, ?, ?)')
    .run(ids['amara@runthefade.app'], 'Kampala Underground', 'Nakivubo Rd, Kampala', 0.3136, 32.5811, 'Bare-knuckle sparring. Overseer discretion on stoppage.');
  db.prepare('UPDATE fighter_profiles SET is_overseer = 1, overseer_experience = ? WHERE user_id = ?')
    .run('6 years Muay Thai, runs weekend sparring sessions in Kampala.', ids['amara@runthefade.app']);
  const anyLocationId = kampalaLoc.lastInsertRowid;

  for (const [emailA, emailB, outcome] of FIGHTS) {
    const [a, b] = [ids[emailA], ids[emailB]].sort((x, y) => x - y);
    const matchInfo = db.prepare('INSERT INTO matches (user_a, user_b) VALUES (?, ?)').run(a, b);
    const matchId = matchInfo.lastInsertRowid;

    const locId = locationIds[emailA] || locationIds[emailB] || anyLocationId;
    const overseerId = db.prepare('SELECT owner_id FROM locations WHERE id = ?').get(locId).owner_id;

    const frInfo = db
      .prepare(
        `INSERT INTO fight_requests (match_id, location_id, proposed_by, scheduled_at, status)
         VALUES (?, ?, ?, datetime('now', '-' || abs(random() % 20) || ' days'), 'approved')`
      )
      .run(matchId, locId, a);

    const pa = db.prepare('SELECT * FROM fighter_profiles WHERE user_id = ?').get(a);
    const pb = db.prepare('SELECT * FROM fighter_profiles WHERE user_id = ?').get(b);

    if (outcome === 'draw') {
      const deltaA = eloDelta(pa.rating, pb.rating, 0.5);
      db.prepare('UPDATE fighter_profiles SET rating = rating + ?, draws = draws + 1 WHERE user_id = ?').run(deltaA, a);
      db.prepare('UPDATE fighter_profiles SET rating = rating + ?, draws = draws + 1 WHERE user_id = ?').run(-deltaA, b);
      db.prepare(
        `INSERT INTO fight_results (fight_request_id, is_draw, confirmed_by, notes) VALUES (?, 1, ?, 'Seed data')`
      ).run(frInfo.lastInsertRowid, overseerId);
    } else {
      const winnerId = ids[outcome];
      const loserId = winnerId === a ? b : a;
      const winnerProfile = winnerId === a ? pa : pb;
      const loserProfile = winnerId === a ? pb : pa;
      const delta = eloDelta(winnerProfile.rating, loserProfile.rating, 1);
      db.prepare('UPDATE fighter_profiles SET rating = rating + ?, wins = wins + 1 WHERE user_id = ?').run(delta, winnerId);
      db.prepare('UPDATE fighter_profiles SET rating = rating - ?, losses = losses + 1 WHERE user_id = ?').run(delta, loserId);
      db.prepare(
        `INSERT INTO fight_results (fight_request_id, winner_id, loser_id, is_draw, confirmed_by, notes)
         VALUES (?, ?, ?, 0, ?, 'Seed data')`
      ).run(frInfo.lastInsertRowid, winnerId, loserId, overseerId);
    }

    db.prepare("UPDATE fight_requests SET status = 'completed' WHERE id = ?").run(frInfo.lastInsertRowid);
  }

  console.log(`Seeded ${FIGHTERS.length} fighters, 3 locations, and ${FIGHTS.length} completed fights.`);
  console.log(`Shared password for all seed accounts: ${PASSWORD}`);
}

run();
