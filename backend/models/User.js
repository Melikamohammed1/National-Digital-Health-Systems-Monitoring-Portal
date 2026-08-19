const db = require('../database/connection');

class User {
  static findAll() {
    return db.prepare('SELECT id, username, role FROM users').all();
  }

  static findByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username) || null;
  }

  static findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
  }

  static create({ id, username, passwordHash, role }) {
    db.prepare('INSERT INTO users (id, username, passwordHash, role) VALUES (?, ?, ?, ?)')
      .run(id, username, passwordHash, role);
    return { id, username, role };
  }

  static remove(id) {
    return db.prepare('DELETE FROM users WHERE id = ?').run(id).changes > 0;
  }

  static countByRole(role) {
    return db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get(role).count;
  }
}

module.exports = User;
