const path = require('path');
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // SQLite database file — see database/connection.js.
  DATA_FILE: process.env.DATA_FILE || path.join(__dirname, '..', 'data.sqlite'),

  // Fixed, not overridable via env — the old JSON-file store's path, kept
  // only so connection.js can migrate real data from it once on first run.
  LEGACY_JSON_FILE: path.join(__dirname, '..', 'data.json'),

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '12h',

  // Seeded demo admin account (see database/seed.js) — rotate/remove before production.
  DEMO_ADMIN_USERNAME: process.env.DEMO_ADMIN_USERNAME || 'admin',
  DEMO_ADMIN_PASSWORD: process.env.DEMO_ADMIN_PASSWORD || 'admin123'
};
