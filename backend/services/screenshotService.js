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
    // 'load' rather than 'networkidle2' — dashboards with a persistent
    // live-data connection (e.g. Grafana) never go network-idle, so
    // networkidle2 would just time out instead of ever capturing anything.
    await page.goto(targetUrl, { waitUntil: 'load', timeout: 15000 });
    // The 'load' event only means resources finished fetching, not that a
    // JS-heavy dashboard has actually painted its charts yet — give it a
    // beat to finish its initial client-side render before capturing.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // Recent Puppeteer returns a Uint8Array here, not a Node Buffer — Express's
    // res.send() only writes raw bytes for a real Buffer, otherwise it falls
    // back to JSON-stringifying the byte array (which silently corrupts the
    // image while keeping the image/jpeg Content-Type already set).
    const buffer = Buffer.from(await page.screenshot({ type: 'jpeg', quality: 65 }));
    await page.close();
    cache.set(targetUrl, { buffer, ts: Date.now() });
    return buffer;
  } catch (err) {
    if (cached) return cached.buffer; // serve stale rather than nothing
    throw new HttpError(502, 'Screenshot capture failed: ' + err.message);
  }
}

module.exports = { getScreenshot };
