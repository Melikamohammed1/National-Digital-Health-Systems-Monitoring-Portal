const db = require('../database/connection');

class ActivityLog {
  static record({ userId, username, action, entityType, entityId, detail }) {
    db.prepare(`
      INSERT INTO activity_log (timestamp, userId, username, action, entityType, entityId, detail)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(Date.now(), userId ?? null, username ?? null, action, entityType ?? null, entityId ?? null, detail ?? null);
  }

  static recent(limit) {
    return db.prepare('SELECT * FROM activity_log ORDER BY id DESC LIMIT ?').all(limit);
  }
}

module.exports = ActivityLog;
