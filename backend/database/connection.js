const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config/env');
const { seedData } = require('./seed');

/**
 * Real SQLite storage, replacing the old JSON-file store. Uses Node's
 * built-in node:sqlite (stable-ish since Node 22.5, still flagged
 * "experimental" by Node itself) instead of a third-party driver like
 * better-sqlite3 — same synchronous, prepare/run/get/all API, but nothing
 * to npm install or native-compile, which matters most on a machine that
 * might not have build tools set up.
 *
 * Unlike the old JsonStore, models below talk to `db` directly with SQL —
 * there's no generic get()/set() layer to keep, since a real schema is
 * the whole point of this move (atomic writes, real query capability,
 * safe concurrent access — the old file-rewrite-the-whole-thing approach
 * had none of that).
 */
const isFreshDb = !fs.existsSync(config.DATA_FILE);
const db = new DatabaseSync(config.DATA_FILE);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin'
  );

  CREATE TABLE IF NOT EXISTS screens (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    ip TEXT,
    res TEXT,
    status TEXT NOT NULL DEFAULT 'standby',
    layout TEXT NOT NULL,
    slots TEXT NOT NULL DEFAULT '[]',
    slotSpans TEXT NOT NULL DEFAULT '[]',
    passcode TEXT,
    lastSeen INTEGER
  );

  CREATE TABLE IF NOT EXISTS targets (
    key TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    mode TEXT NOT NULL,
    deviceType TEXT NOT NULL DEFAULT 'desktop',
    color TEXT,
    note TEXT,
    refreshSeconds INTEGER
  );

  -- Login attempts (success and failure) and every create/update/delete —
  -- see services/activityLogService.js for what writes to this. A brand
  -- new table doesn't need the ensureColumn dance below: CREATE TABLE IF
  -- NOT EXISTS already handles "database existed before this feature did".
  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    userId TEXT,
    username TEXT,
    action TEXT NOT NULL,
    entityType TEXT,
    entityId TEXT,
    detail TEXT
  );
`);

// SQLite has no "ADD COLUMN IF NOT EXISTS" — for a database that already
// existed before slotSpans/refreshSeconds were added, the CREATE TABLE
// above is a no-op (table already exists) and skips them entirely. Add
// them by hand, once, if a pre-existing database is missing them.
function ensureColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}
ensureColumn('screens', 'slotSpans', "slotSpans TEXT NOT NULL DEFAULT '[]'");
ensureColumn('targets', 'refreshSeconds', 'refreshSeconds INTEGER');
// Every account that existed before roles did was, in effect, an admin —
// 'admin' is the correct backfilled value here, no separate reconciliation
// pass needed (unlike slotSpans, which needed a computed value per row).
ensureColumn('users', 'role', "role TEXT NOT NULL DEFAULT 'admin'");

// Backfill: a screen created before slotSpans existed gets '[]' from the
// column default above, which mismatches its actual slot count — every
// span defaults to 1 (no resize applied) once given the right length.
// Cheap and safe to run every startup, not just right after the ALTER.
{
  const mismatched = db.prepare('SELECT id, slots, slotSpans FROM screens').all()
    .filter((s) => JSON.parse(s.slotSpans).length !== JSON.parse(s.slots).length);
  if (mismatched.length) {
    const fix = db.prepare('UPDATE screens SET slotSpans = ? WHERE id = ?');
    for (const s of mismatched) {
      fix.run(JSON.stringify(JSON.parse(s.slots).map(() => 1)), s.id);
    }
  }
}

// Only the real, unoverridden DATA_FILE path is eligible for legacy
// migration — every test file points DATA_FILE at its own isolated
// throwaway path, and must never touch (or worse, consume-and-rename) the
// actual project's data.json.
const usingDefaultDataFile = !process.env.DATA_FILE;

if (isFreshDb) {
  if (usingDefaultDataFile && fs.existsSync(config.LEGACY_JSON_FILE)) {
    migrateFromLegacyJson(config.LEGACY_JSON_FILE);
  } else {
    const seed = seedData();
    const insertUser = db.prepare('INSERT INTO users (id, username, passwordHash, role) VALUES (?, ?, ?, ?)');
    for (const u of seed.users) insertUser.run(u.id, u.username, u.passwordHash, u.role || 'admin');
  }
}

// One-time migration from the old data.json — runs only when the SQLite
// file doesn't exist yet and a legacy JSON store is found sitting next to
// it, so real dev/demo data isn't lost by this storage swap. The old file
// is renamed (not deleted) as a backup once migrated.
function migrateFromLegacyJson(legacyPath) {
  const data = JSON.parse(fs.readFileSync(legacyPath, 'utf-8'));

  const insertScreen = db.prepare(`
    INSERT INTO screens (id, name, location, ip, res, status, layout, slots, slotSpans, passcode, lastSeen)
    VALUES (@id, @name, @location, @ip, @res, @status, @layout, @slots, @slotSpans, @passcode, @lastSeen)
  `);
  for (const s of data.screens || []) {
    const slots = s.slots || [];
    insertScreen.run({
      id: s.id,
      name: s.name,
      location: s.location ?? null,
      ip: s.ip ?? null,
      res: s.res ?? null,
      status: s.status || 'standby',
      layout: s.layout,
      slots: JSON.stringify(slots),
      slotSpans: JSON.stringify(slots.map(() => 1)),
      passcode: s.passcode ?? null,
      lastSeen: s.lastSeen ?? null
    });
  }

  const insertTarget = db.prepare(`
    INSERT INTO targets (key, name, url, mode, deviceType, color, note, refreshSeconds)
    VALUES (@key, @name, @url, @mode, @deviceType, @color, @note, @refreshSeconds)
  `);
  for (const [key, t] of Object.entries(data.targets || {})) {
    insertTarget.run({
      key,
      name: t.name,
      url: t.url,
      mode: t.mode,
      deviceType: t.deviceType || 'desktop',
      color: t.color ?? null,
      note: t.note ?? null,
      refreshSeconds: t.mode === 'screenshot' ? (t.refreshSeconds || 8) : null
    });
  }

  // Every user that existed before roles did was, in effect, an admin.
  const insertUser = db.prepare('INSERT INTO users (id, username, passwordHash, role) VALUES (?, ?, ?, ?)');
  for (const u of data.users || []) insertUser.run(u.id, u.username, u.passwordHash, u.role || 'admin');

  fs.renameSync(legacyPath, legacyPath + '.migrated');
  console.log(
    `[db] migrated ${data.screens?.length ?? 0} screen(s), ${Object.keys(data.targets || {}).length} target(s), ` +
    `${data.users?.length ?? 0} user(s) from ${path.basename(legacyPath)} into ${path.basename(config.DATA_FILE)}`
  );
}

module.exports = db;
