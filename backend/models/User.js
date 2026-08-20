const { db } = require('../database/connection');

class User {
  static async findAll() {
    const { rows } = await db.execute('SELECT id, username, role FROM users');
    return rows;
  }

  static async findByUsername(username) {
    const { rows } = await db.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: [username] });
    return rows[0] || null;
  }

  static async findById(id) {
    const { rows } = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] });
    return rows[0] || null;
  }

  static async create({ id, username, passwordHash, role }) {
    await db.execute({
      sql: 'INSERT INTO users (id, username, passwordHash, role) VALUES (?, ?, ?, ?)',
      args: [id, username, passwordHash, role]
    });
    return { id, username, role };
  }

  static async remove(id) {
    const result = await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [id] });
    return result.rowsAffected > 0;
  }

  static async countByRole(role) {
    const { rows } = await db.execute({ sql: 'SELECT COUNT(*) as count FROM users WHERE role = ?', args: [role] });
    return Number(rows[0].count);
  }
}

module.exports = User;
