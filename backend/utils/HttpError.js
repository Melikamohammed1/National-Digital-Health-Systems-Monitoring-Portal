/** Error with an HTTP status code attached, read by middleware/errorHandler.js. */
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = { HttpError };
