const db = require('../database/connection');

// Muted slate/gray tones — enough hue drift between entries to tell panels
// apart at a glance, without a saturated rainbow look.
const PALETTE = ['#475569', '#4B5563', '#52525B', '#525252', '#57534E', '#334155', '#374151', '#3F3F46', '#404040', '#44403C'];

function rowToTarget(row) {
  if (!row) return null;
  const { key, ...rest } = row;
  return { key, ...rest };
}

class Target {
  static findAll() {
    const rows = db.prepare('SELECT * FROM targets').all();
    const targets = {};
    for (const { key, ...rest } of rows) targets[key] = rest;
    return targets;
  }

  static findByKey(key) {
    return rowToTarget(db.prepare('SELECT * FROM targets WHERE key = ?').get(key));
  }

  static create({ name, url, mode, note, deviceType, refreshSeconds }) {
    const { count } = db.prepare('SELECT COUNT(*) as count FROM targets').get();
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
    db.prepare(`
      INSERT INTO targets (key, name, url, mode, deviceType, color, note, refreshSeconds)
      VALUES (@key, @name, @url, @mode, @deviceType, @color, @note, @refreshSeconds)
    `).run({ key, ...target });
    return { key, ...target };
  }

  static update(key, patch) {
    const existing = db.prepare('SELECT * FROM targets WHERE key = ?').get(key);
    if (!existing) return null;
    const allowed = ['name', 'url', 'mode', 'deviceType', 'note', 'refreshSeconds'];
    const next = { ...existing };
    for (const field of allowed) {
      if (field in patch) next[field] = patch[field];
    }
    db.prepare(`
      UPDATE targets SET name=@name, url=@url, mode=@mode, deviceType=@deviceType,
        color=@color, note=@note, refreshSeconds=@refreshSeconds
      WHERE key=@key
    `).run(next);
    return rowToTarget(next);
  }

  static remove(key) {
    return db.prepare('DELETE FROM targets WHERE key = ?').run(key).changes > 0;
  }
}

module.exports = Target;
