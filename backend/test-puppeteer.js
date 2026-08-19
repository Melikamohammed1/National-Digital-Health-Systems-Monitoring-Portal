/**
 * Standalone Puppeteer diagnostic — run this directly to check whether
 * Chromium launches and can navigate, completely separate from the
 * server/WebSocket code.
 *
 *   node test-puppeteer.js
 */
const puppeteer = require('puppeteer');

(async () => {
  console.log('1. Launching Chromium...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }).catch(err => {
    console.error('❌ LAUNCH FAILED:', err.message);
    process.exit(1);
  });
  console.log('   ✅ Chromium launched.');

  console.log('2. Opening a new page...');
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  console.log('   ✅ Page opened.');

  console.log('3. Navigating to https://en.wikipedia.org ...');
  try {
    const response = await page.goto('https://en.wikipedia.org', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    console.log(`   ✅ Navigated — HTTP status: ${response.status()}`);
  } catch (err) {
    console.error('   ❌ NAVIGATION FAILED:', err.message);
    console.error('   Usually means no outbound internet access, or a firewall/proxy blocking Chromium.');
    await browser.close();
    process.exit(1);
  }

  console.log('4. Taking a screenshot...');
  await page.screenshot({ path: 'screenshot.jpg', type: 'jpeg', quality: 70 });
  console.log('   ✅ Saved screenshot.jpg');

  await browser.close();
  console.log('\nAll steps passed. Puppeteer works fine on this machine.');
})();
