const db = require('./db');
const User = require('../models/User');
const { hashPassword } = require('../utils/hash');

const DEMO_USERS = [
  { username: 'admin', password: 'Admin123!', role: 'admin' },
  { username: 'viewer', password: 'Viewer123!', role: 'viewer' },
  { username: 'demo', password: 'Demo123!', role: 'demo' },
];

async function seed() {
  for (const { username, password, role } of DEMO_USERS) {
    const existing = User.findByUsername(username);
    if (existing) {
      console.log(`Skipping "${username}" — already exists`);
      continue;
    }
    const passwordHash = await hashPassword(password);
    User.create({ username, passwordHash, role });
    console.log(`Created "${username}" (role: ${role})`);
  }
}

seed()
  .then(() => {
    console.log('Seeding complete.');
    db.close();
  })
  .catch((err) => {
    console.error('Seeding failed:', err);
    db.close();
    process.exit(1);
  });
