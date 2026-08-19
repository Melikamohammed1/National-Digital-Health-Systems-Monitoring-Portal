const WebSocket = require('ws');
const { getBrowser } = require('./browserService');

const SPECIAL_KEYS = new Set([
  'Backspace', 'Enter', 'Tab', 'Escape', 'Space', 'Delete',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Shift', 'Control', 'Alt', 'Meta', 'Home', 'End', 'PageUp', 'PageDown'
]);

/**
 * The AnyDesk-style mechanism: don't frame the target site at all. A real
 * headless Chrome tab renders it server-side, streams JPEG frames to the
 * browser over WebSocket, and replays the viewer's mouse/keyboard/touch
 * back onto that tab. Since nothing is ever put in an <iframe>,
 * X-Frame-Options / CSP / frame-busting JS are all irrelevant — this
 * works on literally any site.
 *
 * Touch is dispatched via the raw CDP Input.dispatchTouchEvent primitive
 * (not Puppeteer's page.touchscreen.tap(), which only supports simple
 * taps) so that drag/swipe gestures produce real touchstart/touchmove/
 * touchend sequences on the target page — this gives native momentum
 * scrolling instead of a synthesized click.
 *
 * Call attachInteractiveSessionServer(httpServer) once, from server.js.
 */
function attachInteractiveSessionServer(httpServer) {
  const wss = new WebSocket.Server({ server: httpServer, path: '/ws/interact' });

  wss.on('connection', (ws) => {
    let page = null, cdp = null, closed = false;
    console.log('[interact] client connected');

    ws.on('message', async (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }

      if (msg.type === 'start') {
        const width = msg.width || 1280;
        const height = msg.height || 720;
        const isMobile = !!msg.isMobile;
        const hasTouch = msg.hasTouch !== false; // default true — physical displays are touchscreens
        console.log(`[interact] starting session for ${msg.url} (${width}x${height}, touch=${hasTouch}, mobile=${isMobile})`);
        try {
          const browser = await getBrowser();
          page = await browser.newPage();
          await page.setViewport({ width, height, isMobile, hasTouch });
          if (msg.userAgent) await page.setUserAgent(msg.userAgent);

          cdp = await page.target().createCDPSession();
          await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 60, maxWidth: width, maxHeight: height, everyNthFrame: 1 });
          cdp.on('Page.screencastFrame', async ({ data, sessionId }) => {
            if (!closed) ws.send(JSON.stringify({ type: 'frame', data }));
            try { await cdp.send('Page.screencastFrameAck', { sessionId }); } catch {}
          });
          try {
            const response = await page.goto(msg.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
            console.log(`[interact] navigated to ${msg.url} — HTTP ${response ? response.status() : '?'}`);
          } catch (navErr) {
            console.error(`[interact] navigation to ${msg.url} failed:`, navErr.message);
            ws.send(JSON.stringify({ type: 'error', message: `Page failed to load: ${navErr.message}` }));
            return;
          }
          ws.send(JSON.stringify({ type: 'ready' }));
        } catch (err) {
          console.error('[interact] session start failed:', err);
          ws.send(JSON.stringify({ type: 'error', message: err.message }));
        }
        return;
      }

      if (!page || closed) return;
      try {
        if (msg.type === 'mouseMove') await page.mouse.move(msg.x, msg.y);
        else if (msg.type === 'mouseDown') await page.mouse.down({ button: msg.button || 'left' });
        else if (msg.type === 'mouseUp') await page.mouse.up({ button: msg.button || 'left' });
        else if (msg.type === 'wheel') await page.mouse.wheel({ deltaY: msg.deltaY });

        // Real touch events (not synthesized mouse clicks) — gives native
        // press states, momentum scrolling, and swipe/drag gestures.
        else if (msg.type === 'touchStart') {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: msg.x, y: msg.y, id: 0 }] });
        } else if (msg.type === 'touchMove') {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: msg.x, y: msg.y, id: 0 }] });
        } else if (msg.type === 'touchEnd') {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        }

        else if (msg.type === 'type') await page.keyboard.sendCharacter(msg.text);
        else if (msg.type === 'keyDown' && SPECIAL_KEYS.has(msg.key)) await page.keyboard.down(msg.key);
        else if (msg.type === 'keyUp' && SPECIAL_KEYS.has(msg.key)) await page.keyboard.up(msg.key);
        else if (msg.type === 'navigate') page.goto(msg.url, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch((e) => console.error('[interact] navigate failed:', e.message));
      } catch (actionErr) {
        console.error(`[interact] action "${msg.type}" failed:`, actionErr.message);
      }
    });

    ws.on('close', async () => {
      console.log('[interact] client disconnected, closing tab');
      closed = true;
      try { if (cdp) await cdp.send('Page.stopScreencast'); } catch {}
      try { if (page) await page.close(); } catch {}
    });
  });

  return wss;
}

module.exports = { attachInteractiveSessionServer };
