const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');
const { HttpError } = require('../utils/HttpError');
const activityLog = require('./activityLogService');

async function login(username, password) {
  const user = await User.findByUsername(username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    // Logged even when the username itself doesn't exist — that's the
    // actually useful half of a login history (spotting repeated failed
    // attempts), so it's recorded by the attempted username, not a userId.
    activityLog.log({ username, action: 'login_failed', entityType: 'session' });
    throw new HttpError(401, 'Invalid username or password');
  }
  const token = signToken({ sub: user.id, username: user.username });
  activityLog.log({ userId: user.id, username: user.username, action: 'login_success', entityType: 'session' });
  return { token, user: { id: user.id, username: user.username, role: user.role } };
}

module.exports = { login };
