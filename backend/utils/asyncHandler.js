/** Wrap an async (req, res, next) handler so a rejected promise or thrown
 *  error is forwarded to next() instead of crashing the process or hanging
 *  the request. Every controller below uses this instead of try/catch. */
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
