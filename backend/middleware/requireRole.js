const { HttpError } = require('../utils/HttpError');

/** Must run after requireAuth (needs req.user.role already set). Rejects
 *  with 403 — as opposed to requireAuth's 401 — since the caller does have
 *  a valid session, it just isn't allowed to do this particular thing. */
function requireRole(...roles) {
  return function (req, res, next) {
    if (!roles.includes(req.user?.role)) {
      return next(new HttpError(403, `Forbidden — requires role: ${roles.join(' or ')}`));
    }
    next();
  };
}

module.exports = requireRole;
