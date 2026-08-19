const http = require('http');
const app = require('./app');
const config = require('./config/env');
const { attachInteractiveSessionServer } = require('./services/interactiveSessionService');
const { sweepOfflineScreens } = require('./services/screenService');

const httpServer = http.createServer(app);
attachInteractiveSessionServer(httpServer);

// Demotes screens that stopped heartbeating to 'offline' — see
// Screen.sweepOffline / screenService.OFFLINE_TIMEOUT_MS.
setInterval(sweepOfflineScreens, 15_000);

httpServer.listen(config.PORT, () => {
  console.log(`Mosaic Wall backend running at http://localhost:${config.PORT}`);
});
