const bcrypt = require('bcryptjs');
const config = require('../config/env');

/**
 * "Database (To Be Finalized)" — this file is where the seed data lives
 * regardless of what storage ends up backing it. Swapping JSON-file
 * storage for a real database (Postgres/Mongo/SQLite) means rewriting
 * connection.js's read/write and each model's methods — this seed shape
 * doesn't need to change.
 */
function seedData() {
  return {
    // No pre-registered screens, no pre-loaded example systems. The
    // first real action is "+ Register New Physical Screen", then
    // "+ Add New System / Website" to fill its slots.
    screens: [],
    targets: {},
    users: [
      {
        id: 'usr_admin',
        username: config.DEMO_ADMIN_USERNAME,
        passwordHash: bcrypt.hashSync(config.DEMO_ADMIN_PASSWORD, 10),
        role: 'admin'
      }
    ]
  };
}

module.exports = { seedData };
