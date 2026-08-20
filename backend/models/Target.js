const { db } = require('../database/connection');

// Muted slate/gray tones — enough hue drift between entries to tell panels
// apart at a glance, without a saturated rainbow look.
const PALETTE = ['#475569', '#4B5563', '#52525B', '#525252', '#57534E', '#334155', '#374151', '#3F3F46', '#404040', '#44403C'];

function rowToTarget(row) {
  if (!row) return null;
  const { key, ...rest } = row;
  return { key, ...rest };
}

class Target {
  static async findAll() {
    const { rows } = await db.execute('SELECT * FROM targets');
    const targets = {};
    for (const { key, ...rest } of rows) targets[key] = rest;
    return targets;
  }

  static async findByKey(key) {
    const { rows } = await db.execute({ sql: 'SELECT * FROM targets WHERE key = ?', args: [key] });
    return rowToTarget(rows[0]);
  }

  static async create({ name, url, mode, note, deviceType, refreshSeconds }) {
    const { rows } = await db.execute('SELECT COUNT(*) as count FROM targets');
    const count = Number(rows[0].count);
    const key = 'custom_' + Date.now();
    const target = {
      name,
      url,
      mode,
      deviceType: deviceType || 'desktop',
      color: PALETTE[count % PALETTE.length],
      note: note || null,
      refreshSeconds: refreshSeconds ?? null
    };
    await db.execute({
      sql: `INSERT INTO targets (key, name, url, mode, deviceType, color, note, refreshSeconds)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [key, target.name, target.url, target.mode, target.deviceType, target.color, target.note, target.refreshSeconds]
    });
    return { key, ...target };
  }

  static async update(key, patch) {
    const existing = await this.findByKey(key);
    if (!existing) return null;
    const next = { ...existing, ...patch };
    await db.execute({
      sql: `UPDATE targets SET name=?, url=?, mode=?, deviceType=?, color=?, note=?, refreshSeconds=? WHERE key=?`,
      args: [next.name, next.url, next.mode, next.deviceType, next.color, next.note, next.refreshSeconds, key]
    });
    return rowToTarget(next);
  }

  static async remove(key) {
    const result = await db.execute({ sql: 'DELETE FROM targets WHERE key = ?', args: [key] });
    return result.rowsAffected > 0;
  }
}

module.exports = Target;
