import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Uses Node's built-in SQLite (stable API since Node 22.5, no native
// compilation needed — no Visual Studio / build-tools requirement on any
// platform, and no native binary to worry about on whatever host runs this).
// Requires Node >= 22.5. The "experimental" console warning it prints is
// expected and harmless.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, 'runthefade.db');

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// Lightweight migrations for DBs created before these columns existed.
const cols = db.prepare("PRAGMA table_info(fighter_profiles)").all().map((c) => c.name);
if (!cols.includes('photo_url')) {
  db.exec('ALTER TABLE fighter_profiles ADD COLUMN photo_url TEXT');
}
const resultCols = db.prepare("PRAGMA table_info(fight_results)").all().map((c) => c.name);
if (!resultCols.includes('photo_url')) {
  db.exec('ALTER TABLE fight_results ADD COLUMN photo_url TEXT');
}
if (!cols.includes('overseer_experience')) {
  db.exec('ALTER TABLE fighter_profiles ADD COLUMN overseer_experience TEXT');
}
const userCols = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
if (!userCols.includes('is_admin')) {
  db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0');
}

export default db;
