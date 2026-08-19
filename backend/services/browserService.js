let browserPromise = null;

/** Lazily launches one shared Chromium instance (via the optional
 *  "puppeteer" package) and reuses it across screenshot requests and
 *  interactive sessions. A failed launch isn't cached, so the next
 *  request retries instead of staying broken until a server restart. */
async function getBrowser() {
  if (!browserPromise) {
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
    } catch {
      throw new Error('This feature requires the optional "puppeteer" package. Run: npm install puppeteer');
    }
    browserPromise = puppeteer
      .launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
      .catch((err) => {
        console.error('[browserService] Chromium launch failed:', err.message);
        browserPromise = null;
        throw err;
      });
  }
  return browserPromise;
}

module.exports = { getBrowser };
