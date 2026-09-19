// Creates the one admin account for the dashboard. Idempotent — running it
// again just confirms it already exists rather than duplicating or resetting
// the password.
//
// Run with: npm run seed:admin   (from the backend/ folder)
//
// Override the default credentials by setting ADMIN_EMAIL and ADMIN_PASSWORD
// as environment variables before running this — recommended before your
// first real deploy, since the fallback below is a public default.

import bcrypt from 'bcryptjs';
import db from './index.js';

const EMAIL = (process.env.ADMIN_EMAIL || 'admin@runthefade.app').toLowerCase();
const PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeThisAdmin1!';
const NAME = process.env.ADMIN_NAME || 'RunTheFade Admin';

function run() {
  const existing = db.prepare('SELECT id, is_admin FROM users WHERE email = ?').get(EMAIL);
  if (existing) {
    if (!existing.is_admin) {
      db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(existing.id);
      console.log(`Flagged existing account ${EMAIL} as admin.`);
    } else {
      console.log(`Admin account ${EMAIL} already exists — nothing to do.`);
    }
    return;
  }

  const hash = bcrypt.hashSync(PASSWORD, 10);
  db.prepare('INSERT INTO users (email, password_hash, name, is_admin) VALUES (?, ?, ?, 1)').run(EMAIL, hash, NAME);
  console.log(`Admin account created.`);
  console.log(`Email:    ${EMAIL}`);
  console.log(`Password: ${PASSWORD}`);
  console.log(`Log in at /admin/login. Change the password via ADMIN_PASSWORD env var and reseed if this is a real deploy.`);
}

run();