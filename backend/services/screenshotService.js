const { getBrowser } = require('./browserService');
const { HttpError } = require('../utils/HttpError');

const cache = new Map(); // url -> { buffer, ts }
const TTL_MS = 8000;

/** Only used for the small admin-grid thumbnails — deliberately NOT a live
 *  session, since running a real interactive browser tab for every tiny
 *  preview tile would be wasteful and pointless when nobody's driving it. */
async function getScreenshot(targetUrl) {
  if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
    throw new HttpError(400, 'Missing or invalid "url" query parameter.');
  }

  const cached = cache.get(targetUrl);
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.buffer;

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 640, height: 360 });
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    const buffer = await page.screenshot({ type: 'jpeg', quality: 65 });
    await page.close();
    cache.set(targetUrl, { buffer, ts: Date.now() });
    return buffer;
  } catch (err) {
    if (cached) return cached.buffer; // serve stale rather than nothing
    throw new HttpError(502, 'Screenshot capture failed: ' + err.message);
  }
}

module.exports = { getScreenshot };
