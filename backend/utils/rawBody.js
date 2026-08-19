/**
 * express.json() only consumes the request stream when Content-Type is
 * application/json — for anything else (multipart/form-data,
 * x-www-form-urlencoded, plain text, etc.) the stream is left untouched.
 * This middleware captures the exact bytes either way, so the proxy
 * routes can forward the body to the upstream target unmodified:
 *
 *  - If express.json() already parsed it (content-type was JSON), we
 *    re-serialize req.body back to a Buffer.
 *  - Otherwise we read the raw stream ourselves.
 *
 * Attaches `req.rawBody` (Buffer, possibly zero-length) before calling next().
 */
function captureRawBody(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    req.rawBody = Buffer.alloc(0);
    return next();
  }

  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json') && req.body && typeof req.body === 'object') {
    req.rawBody = Buffer.from(JSON.stringify(req.body));
    return next();
  }

  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    req.rawBody = Buffer.concat(chunks);
    next();
  });
  req.on('error', next);
}

module.exports = { captureRawBody };
