const { db } = require('../database/connection');

class ActivityLog {
  static async record({ userId, username, action, entityType, entityId, detail }) {
    await db.execute({
      sql: `INSERT INTO activity_log (timestamp, userId, username, action, entityType, entityId, detail)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [Date.now(), userId ?? null, username ?? null, action, entityType ?? null, entityId ?? null, detail ?? null]
    });
  }

  static async recent(limit) {
    const { rows } = await db.execute({ sql: 'SELECT * FROM activity_log ORDER BY id DESC LIMIT ?', args: [limit] });
    return rows;
  }
}

module.exports = ActivityLog;
