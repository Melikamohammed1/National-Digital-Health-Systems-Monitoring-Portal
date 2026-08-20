const { db } = require('../database/connection');

const LAYOUT_SIZES = { single: 1, '2x2': 4, '3col': 3, custom: 2 };

// `slots` (an ordered list of nullable target-key references) and
// `slotSpans` (how many grid columns each position occupies) are stored as
// JSON-serialized arrays rather than a normalized child table — neither has
// independent identity or attributes of its own, so a JSON column is the
// pragmatic choice here without pulling in a join for something this simple.
function rowToScreen(row) {
  if (!row) return null;
  const screen = { ...row, slots: JSON.parse(row.slots), slotSpans: JSON.parse(row.slotSpans) };
  if (screen.lastSeen == null) delete screen.lastSeen;
  return screen;
}

class Screen {
  static async findAll() {
    const { rows } = await db.execute('SELECT * FROM screens');
    return rows.map(rowToScreen);
  }

  static async findById(id) {
    const { rows } = await db.execute({ sql: 'SELECT * FROM screens WHERE id = ?', args: [id] });
    return rowToScreen(rows[0]);
  }

  static async create({ name, layout, passcode }) {
    const safeLayout = LAYOUT_SIZES[layout] ? layout : '2x2';
    const screen = {
      id: 'scr_' + Date.now().toString().slice(-6),
      name,
      location: 'Unassigned Location',
      ip: '—',
      res: '1920x1080',
      status: 'standby',
      layout: safeLayout,
      slots: Array.from({ length: LAYOUT_SIZES[safeLayout] }, () => null),
      slotSpans: Array.from({ length: LAYOUT_SIZES[safeLayout] }, () => 1),
      passcode: passcode || null
    };
    await db.execute({
      sql: `INSERT INTO screens (id, name, location, ip, res, status, layout, slots, slotSpans, passcode)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [screen.id, screen.name, screen.location, screen.ip, screen.res, screen.status, screen.layout,
        JSON.stringify(screen.slots), JSON.stringify(screen.slotSpans), screen.passcode]
    });
    return screen;
  }

  static async update(id, patch) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const allowed = ['name', 'layout', 'slots', 'slotSpans', 'status', 'location', 'ip', 'res'];
    const next = { ...existing };
    for (const key of allowed) {
      if (key in patch) next[key] = patch[key];
    }
    // Keep slotSpans in sync with slots length whenever slots changed
    // (layout switch, custom slot count +/-) without the caller also
    // supplying a matching slotSpans — existing per-position spans carry
    // over, new positions default to span 1 (no resize applied).
    if ('slots' in patch && !('slotSpans' in patch)) {
      next.slotSpans = next.slots.map((_, i) => existing.slotSpans[i] || 1);
    }
    if (next.status !== 'offline') next.lastSeen = null;

    await db.execute({
      sql: `UPDATE screens SET name=?, location=?, ip=?, res=?, status=?, layout=?, slots=?, slotSpans=?, passcode=?, lastSeen=?
            WHERE id=?`,
      args: [next.name, next.location, next.ip, next.res, next.status, next.layout,
        JSON.stringify(next.slots), JSON.stringify(next.slotSpans), next.passcode, next.lastSeen ?? null, id]
    });
    return this.findById(id);
  }

  static async reconnect(id) {
    // Stamped "now", not cleared — gives the display page a full heartbeat
    // window to actually check in before sweepOffline() would otherwise
    // treat a missing lastSeen as instantly stale.
    const result = await db.execute({
      sql: "UPDATE screens SET status='online', lastSeen=? WHERE id=?",
      args: [Date.now(), id]
    });
    return result.rowsAffected > 0 ? this.findById(id) : null;
  }

  // Called by the (unauthenticated) /display/:id page itself, on an
  // interval — this is what makes `status` real-time instead of a
  // manually-set claim.
  static async heartbeat(id) {
    const result = await db.execute({
      sql: "UPDATE screens SET status='online', lastSeen=? WHERE id=?",
      args: [Date.now(), id]
    });
    return result.rowsAffected > 0 ? this.findById(id) : null;
  }

  // Runs on a timer (see server.js) — demotes any screen that stopped
  // heartbeating to 'offline'. Screens with no lastSeen at all are left
  // alone: they were either never connected or just manually reconnected,
  // not proven stale.
  static async sweepOffline(timeoutMs) {
    await db.execute({
      sql: `UPDATE screens SET status='offline'
            WHERE status='online' AND lastSeen IS NOT NULL AND (? - lastSeen) > ?`,
      args: [Date.now(), timeoutMs]
    });
  }

  static async remove(id) {
    const result = await db.execute({ sql: 'DELETE FROM screens WHERE id = ?', args: [id] });
    return result.rowsAffected > 0;
  }
}

module.exports = Screen;
