const db = require('../database/db');

function record({ username, success, ipAddress }) {
  db.prepare(
    'INSERT INTO login_history (username, success, ip_address) VALUES (?, ?, ?)'
  ).run(username, success ? 1 : 0, ipAddress || null);
}

function listAll() {
  return db
    .prepare('SELECT * FROM login_history ORDER BY id DESC')
    .all();
}

module.exports = { record, listAll };
