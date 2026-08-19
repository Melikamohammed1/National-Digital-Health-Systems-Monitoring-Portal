const asyncHandler = require('../utils/asyncHandler');
const { fetchForEmbedding, fetchResource, renderErrorPage } = require('../services/embeddingProxyService');
const { getScreenshot } = require('../services/screenshotService');
const { HttpError } = require('../utils/HttpError');

/** Live Embed mode — full page load, and the page-navigation POST the
 *  injected script issues for framed <form> submits. Errors always
 *  render as a styled in-slot placeholder, never raw JSON/stack traces,
 *  since the response goes straight into an iframe on a live display. */
exports.proxy = asyncHandler(async (req, res) => {
  try {
    const result = await fetchForEmbedding(req.query.url, {
      method: req.method,
      reqHeaders: req.headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? null : req.rawBody,
      bodyContentType: req.headers['content-type'] || null
    });
    res.status(result.status || 200);
    res.set('Content-Type', result.contentType);
    res.send(result.body ?? result.buffer);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 502;
    res.status(status);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(renderErrorPage(err.message, status));
  }
});

/** Background fetch()/XHR passthrough for pages loaded via /proxy. Pure
 *  data — callers are the framed page's own JS, not a human looking at
 *  the response, so failures come back as compact JSON, not HTML. */
exports.proxyResource = asyncHandler(async (req, res) => {
  try {
    const result = await fetchResource(req.query.url, {
      method: req.method,
      reqHeaders: req.headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? null : req.rawBody,
      bodyContentType: req.headers['content-type'] || null
    });
    res.status(result.status || 200);
    res.set('Content-Type', result.contentType);
    res.set('Access-Control-Allow-Origin', '*');
    res.send(result.buffer);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 502;
    res.status(status).json({ error: err.message || 'Resource proxy failed' });
  }
});

exports.screenshot = asyncHandler(async (req, res) => {
  const buffer = await getScreenshot(req.query.url);
  res.set('Content-Type', 'image/jpeg');
  res.send(buffer);
});
