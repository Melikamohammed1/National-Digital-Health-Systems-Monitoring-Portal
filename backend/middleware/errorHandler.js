const config = require('../config/env');

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    console.error('[error]', err);
  }
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(config.NODE_ENV !== 'production' && status >= 500 ? { stack: err.stack } : {})
  });
};
