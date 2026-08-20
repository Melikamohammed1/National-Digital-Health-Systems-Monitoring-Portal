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
      .launch({
        headless: 'new',
        // Canvas/WebGL-based map tiles (e.g. OpenStreetMap) render solid
        // black in headless Chrome without a software GL backend — there's
        // no real GPU to hand it, so point it at SwiftShader instead.
        // --disable-dev-shm-usage: containerized hosts (Render, Docker, etc.)
        // often give /dev/shm far less space than Chrome expects, which
        // crashes it outright — this makes Chrome use disk-backed temp
        // files instead. Harmless locally, necessary in production.
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
      })
      .catch((err) => {
        console.error('[browserService] Chromium launch failed:', err.message);
        browserPromise = null;
        throw err;
      });
  }
  return browserPromise;
}

module.exports = { getBrowser };
