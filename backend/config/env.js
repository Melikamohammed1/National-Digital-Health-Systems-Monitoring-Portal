const path = require('path');
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Local fallback database file — used when TURSO_DATABASE_URL isn't set,
  // so solo/offline dev works with zero account/network setup.
  DATA_FILE: process.env.DATA_FILE || path.join(__dirname, '..', 'data.sqlite'),

  // Remote database (Turso/libSQL) — see database/connection.js. Leave both
  // unset to use the local file above instead.
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL || null,
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN || null,

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '12h',

  // Seeded demo admin account (see database/seed.js) — rotate/remove before production.
  DEMO_ADMIN_USERNAME: process.env.DEMO_ADMIN_USERNAME || 'admin',
  DEMO_ADMIN_PASSWORD: process.env.DEMO_ADMIN_PASSWORD || 'admin123'
};
