const http = require('http');
const app = require('./app');
const config = require('./config/env');
const { init: initDb } = require('./database/connection');
const { attachInteractiveSessionServer } = require('./services/interactiveSessionService');
const { sweepOfflineScreens } = require('./services/screenService');

(async () => {
  // Schema creation (and, on a fresh database, the default admin seed) is
  // now a network round-trip against Turso when TURSO_DATABASE_URL is set —
  // must finish before anything tries to query. No top-level await in
  // CommonJS, hence the IIFE.
  await initDb();

  const httpServer = http.createServer(app);
  attachInteractiveSessionServer(httpServer);

  // Demotes screens that stopped heartbeating to 'offline' — see
  // Screen.sweepOffline / screenService.OFFLINE_TIMEOUT_MS.
  setInterval(sweepOfflineScreens, 15_000);

  httpServer.listen(config.PORT, () => {
    console.log(`Mosaic Wall backend running at http://localhost:${config.PORT}`);
  });
})().catch((err) => {
  console.error('[fatal] backend failed to start:', err);
  process.exit(1);
});
