const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { HttpError } = require('../utils/HttpError');
const activityLog = require('./activityLogService');

const VALID_ROLES = new Set(['admin', 'viewer']);

function listUsers() {
  return User.findAll();
}

async function registerUser({ username, password, role }, actor) {
  if (!username || !username.trim()) throw new HttpError(400, 'username is required');
  if (!password || password.length < 6) throw new HttpError(400, 'password must be at least 6 characters');
  if (await User.findByUsername(username.trim())) throw new HttpError(409, 'That username is already taken');

  const safeRole = VALID_ROLES.has(role) ? role : 'viewer';
  const user = await User.create({
    id: 'usr_' + Date.now().toString(36),
    username: username.trim(),
    passwordHash: bcrypt.hashSync(password, 10),
    role: safeRole
  });
  activityLog.log({ ...actor, action: 'create', entityType: 'user', entityId: user.id, detail: `Created account "${user.username}" (${safeRole})` });
  return user;
}

async function removeUser(id, actor) {
  const target = await User.findById(id);
  if (!target) throw new HttpError(404, 'User not found');

  // The only real guard needed: removing the last admin — including
  // removing their own account — would lock everyone out of account
  // management, with no one left holding permission to create a
  // replacement. Deliberately not a separate "can't delete yourself" rule:
  // an admin stepping down is fine as long as another admin exists to
  // take over.
  if (target.role === 'admin' && (await User.countByRole('admin')) <= 1) {
    throw new HttpError(400, 'Cannot remove the last remaining admin account');
  }

  await User.remove(id);
  activityLog.log({ ...actor, action: 'delete', entityType: 'user', entityId: id, detail: `Removed account "${target.username}"` });
}

module.exports = { listUsers, registerUser, removeUser };
