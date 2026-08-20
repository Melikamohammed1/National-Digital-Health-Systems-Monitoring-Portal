// One-time migration: copy the local dev database (data.sqlite) into the
// Turso database configured in .env. Run this once, right after setting
// TURSO_DATABASE_URL/TURSO_AUTH_TOKEN, before teammates start writing to
// the shared remote database — it wipes whatever's already on the target
// (e.g. the auto-seeded default admin) so the local copy is the one true
// source, not merged with it.
//
// Usage: node scripts/migrate-to-turso.js
const path = require('path');
const { createClient } = require('@libsql/client');
const config = require('../config/env');

if (!config.TURSO_DATABASE_URL) {
  console.error('[migrate] TURSO_DATABASE_URL is not set in .env — nothing to migrate to.');
  process.exit(1);
}

const sourcePath = path.join(__dirname, '..', 'data.sqlite');
const source = createClient({ url: `file:${sourcePath}` });
const target = createClient({ url: config.TURSO_DATABASE_URL, authToken: config.TURSO_AUTH_TOKEN });

// Same schema as database/connection.js — the target may be a brand-new
// database that init() has never run against.
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

// Dependency order doesn't actually matter here (no FK constraints in this
// schema), but activity_log last reads naturally as "history goes in once
// everything it refers to already exists".
const TABLES = ['users', 'screens', 'targets', 'activity_log'];

async function main() {
  await target.batch(SCHEMA, 'write');

  for (const table of TABLES) {
    await target.execute(`DELETE FROM ${table}`);
  }

  let totalRows = 0;
  for (const table of TABLES) {
    const { rows } = await source.execute(`SELECT * FROM ${table}`);
    if (rows.length === 0) {
      console.log(`[migrate] ${table}: nothing to copy`);
      continue;
    }
    const columns = Object.keys(rows[0]);
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
    const statements = rows.map((row) => ({ sql, args: columns.map((c) => row[c]) }));
    await target.batch(statements, 'write');
    console.log(`[migrate] ${table}: copied ${rows.length} row(s)`);
    totalRows += rows.length;
  }

  console.log(`[migrate] done — ${totalRows} row(s) copied from ${sourcePath} into Turso.`);
  source.close();
  target.close();
}

main().catch((err) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
