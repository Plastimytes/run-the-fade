-- Run The Fade — schema

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Every user can hold a fighter profile. is_overseer just flags that this
-- person can also own locations and confirm results there — no separate
-- account type, per the brief.
CREATE TABLE IF NOT EXISTS fighter_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  weight_class TEXT NOT NULL,
  height_class TEXT NOT NULL,
  fighting_style TEXT NOT NULL,
  strengths TEXT NOT NULL DEFAULT '[]', -- JSON array
  bio TEXT DEFAULT '',
  availability TEXT NOT NULL DEFAULT '[]', -- JSON array of {day, from, to}
  city TEXT DEFAULT '',
  lat REAL,
  lng REAL,
  is_overseer INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_looking', -- 'looking' | 'not_looking'
  photo_url TEXT,
  rating INTEGER NOT NULL DEFAULT 1200,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat REAL,
  lng REAL,
  rules TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS swipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  swiper_id INTEGER NOT NULL REFERENCES users(id),
  swiped_id INTEGER NOT NULL REFERENCES users(id),
  direction TEXT NOT NULL CHECK(direction IN ('like','pass')),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(swiper_id, swiped_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_a INTEGER NOT NULL REFERENCES users(id),
  user_b INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_a, user_b)
);

CREATE TABLE IF NOT EXISTS fight_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL REFERENCES matches(id),
  location_id INTEGER NOT NULL REFERENCES locations(id),
  proposed_by INTEGER NOT NULL REFERENCES users(id),
  scheduled_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | declined | completed | cancelled
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fight_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fight_request_id INTEGER NOT NULL REFERENCES fight_requests(id),
  winner_id INTEGER REFERENCES users(id),
  loser_id INTEGER REFERENCES users(id),
  is_draw INTEGER NOT NULL DEFAULT 0,
  confirmed_by INTEGER NOT NULL REFERENCES users(id),
  notes TEXT DEFAULT '',
  photo_url TEXT,
  confirmed_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL REFERENCES matches(id),
  sender_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL, -- 'match' | 'message' | 'nearby' | 'fight_status'
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  link TEXT DEFAULT '', -- e.g. '/matches', '/chat/3'
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
