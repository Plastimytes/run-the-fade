import db from '../db/index.js';

export function notify(userId, type, title, body = '', link = '') {
  db.prepare(
    'INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, type, title, body, link);
}
