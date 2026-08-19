const db = require('../database/connection');

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
  static findAll() {
    return db.prepare('SELECT * FROM screens').all().map(rowToScreen);
  }

  static findById(id) {
    return rowToScreen(db.prepare('SELECT * FROM screens WHERE id = ?').get(id));
  }

  static create({ name, layout, passcode }) {
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
    db.prepare(`
      INSERT INTO screens (id, name, location, ip, res, status, layout, slots, slotSpans, passcode)
      VALUES (@id, @name, @location, @ip, @res, @status, @layout, @slots, @slotSpans, @passcode)
    `).run({ ...screen, slots: JSON.stringify(screen.slots), slotSpans: JSON.stringify(screen.slotSpans) });
    return screen;
  }

  static update(id, patch) {
    const existing = db.prepare('SELECT * FROM screens WHERE id = ?').get(id);
    if (!existing) return null;
    const allowed = ['name', 'layout', 'slots', 'slotSpans', 'status', 'location', 'ip', 'res'];
    const next = { ...existing };
    for (const key of allowed) {
      if (key in patch) next[key] = (key === 'slots' || key === 'slotSpans') ? JSON.stringify(patch[key]) : patch[key];
    }
    // Keep slotSpans in sync with slots length whenever slots changed
    // (layout switch, custom slot count +/-) without the caller also
    // supplying a matching slotSpans — existing per-position spans carry
    // over, new positions default to span 1 (no resize applied).
    if ('slots' in patch && !('slotSpans' in patch)) {
      const slots = JSON.parse(next.slots);
      const prevSpans = JSON.parse(existing.slotSpans || '[]');
      next.slotSpans = JSON.stringify(slots.map((_, i) => prevSpans[i] || 1));
    }
    if (next.status !== 'offline') next.lastSeen = null;
    db.prepare(`
      UPDATE screens SET name=@name, location=@location, ip=@ip, res=@res, status=@status,
        layout=@layout, slots=@slots, slotSpans=@slotSpans, passcode=@passcode, lastSeen=@lastSeen
      WHERE id=@id
    `).run(next);
    return this.findById(id);
  }

  static reconnect(id) {
    // Stamped "now", not cleared — gives the display page a full heartbeat
    // window to actually check in before sweepOffline() would otherwise
    // treat a missing lastSeen as instantly stale.
    const result = db.prepare("UPDATE screens SET status='online', lastSeen=? WHERE id=?").run(Date.now(), id);
    return result.changes > 0 ? this.findById(id) : null;
  }

  // Called by the (unauthenticated) /display/:id page itself, on an
  // interval, to prove it's actually up — this is what makes `status`
  // real-time instead of a manually-set claim.
  static heartbeat(id) {
    const result = db.prepare("UPDATE screens SET status='online', lastSeen=? WHERE id=?").run(Date.now(), id);
    return result.changes > 0 ? this.findById(id) : null;
  }

  // Runs on a timer (see server.js) — demotes any screen that stopped
  // heartbeating to 'offline'. Screens with no lastSeen at all are left
  // alone: they were either never connected or just manually reconnected,
  // not proven stale.
  static sweepOffline(timeoutMs) {
    db.prepare(`
      UPDATE screens SET status='offline'
      WHERE status='online' AND lastSeen IS NOT NULL AND (? - lastSeen) > ?
    `).run(Date.now(), timeoutMs);
  }

  static remove(id) {
    return db.prepare('DELETE FROM screens WHERE id = ?').run(id).changes > 0;
  }
}

module.exports = Screen;
