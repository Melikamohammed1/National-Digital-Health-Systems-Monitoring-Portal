const { HttpError } = require('../utils/HttpError');

/** validateBody(['name', 'url']) -> middleware that 400s if any of those
 *  keys are missing/empty on req.body. Enough for this project's simple
 *  payloads without pulling in a schema-validation library. */
function validateBody(requiredFields) {
  return function (req, res, next) {
    const missing = requiredFields.filter((field) => {
      const value = req.body?.[field];
      return value === undefined || value === null || value === '';
    });
    if (missing.length) {
      return next(new HttpError(400, `Missing required field(s): ${missing.join(', ')}`));
    }
    next();
  };
}

module.exports = { validateBody };
