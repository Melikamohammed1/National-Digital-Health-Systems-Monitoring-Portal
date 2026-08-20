const { verifyToken } = require('../utils/jwt');
const { HttpError } = require('../utils/HttpError');
const User = require('../models/User');

/** Attaches req.user when a valid `Authorization: Bearer <token>` header
 *  is present; otherwise rejects with 401. Not currently applied to
 *  /api/screens or /api/targets — see README for why. */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Missing or malformed Authorization header'));
  }
  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user) return next(new HttpError(401, 'Token refers to a user that no longer exists'));
    // Role comes from the DB record, not the token payload — a role change
    // (or account removal) takes effect on the user's very next request
    // instead of only once their existing token expires.
    req.user = { id: user.id, username: user.username, role: user.role };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

module.exports = requireAuth;
