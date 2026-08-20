const { createClient } = require('@libsql/client');
const config = require('../config/env');
const { seedData } = require('./seed');

/**
 * Remote-capable database via libSQL (Turso) — same SQLite dialect and
 * schema as before, but every call is now a Promise. When TURSO_DATABASE_URL
 * isn't set, this transparently falls back to a local file at DATA_FILE
 * (same client, same API, zero network, no account needed) — solo/offline
 * dev doesn't require a Turso account.
 *
 * Callers must `await init()` once before making any query — see
 * server.js (production) and each test file's `test.before()` hook.
 */
const usingRemote = !!config.TURSO_DATABASE_URL;
const db = usingRemote
  ? createClient({ url: config.TURSO_DATABASE_URL, authToken: config.TURSO_AUTH_TOKEN })
  : createClient({ url: `file:${config.DATA_FILE}` });

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin'
  )`,
  `CREATE TABLE IF NOT EXISTS screens (
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
  )`,
  `CREATE TABLE IF NOT EXISTS targets (
    key TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    mode TEXT NOT NULL,
    deviceType TEXT NOT NULL DEFAULT 'desktop',
    color TEXT,
    note TEXT,
    refreshSeconds INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    userId TEXT,
    username TEXT,
    action TEXT NOT NULL,
    entityType TEXT,
    entityId TEXT,
    detail TEXT
  )`
];

let initPromise = null;

// Idempotent and safe to call from multiple test files / hot-reload — the
// underlying work only actually runs once per process.
function init() {
  if (!initPromise) initPromise = doInit();
  return initPromise;
}

async function doInit() {
  await db.batch(SCHEMA, 'write');

  const { rows } = await db.execute('SELECT COUNT(*) as count FROM users');
  if (Number(rows[0].count) === 0) {
    const seed = seedData();
    for (const u of seed.users) {
      await db.execute({
        sql: 'INSERT INTO users (id, username, passwordHash, role) VALUES (?, ?, ?, ?)',
        args: [u.id, u.username, u.passwordHash, u.role || 'admin']
      });
    }
    console.log(`[db] seeded default admin account (${usingRemote ? 'remote/Turso' : 'local file'} database)`);
  }
}

module.exports = { db, init };
