const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

// Isolated like every other test file — requiring app.js opens/creates the
// database as a side effect (see database/connection.js), even though
// /api/health itself never touches storage. Without this override it
// would fall through to the real default DATA_FILE.
process.env.DATA_FILE = path.join(__dirname, '.test-health-data.sqlite');
if (fs.existsSync(process.env.DATA_FILE)) fs.unlinkSync(process.env.DATA_FILE);

const app = require('../app');

test.before(async () => {
  await require('../database/connection').init();
});

test('GET /api/health returns ok status', async () => {
  const server = http.createServer(app).listen(0);
  const { port } = server.address();
  try {
    const res = await fetch(`http://localhost:${port}/api/health`);
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'ok');
    assert.ok(typeof body.uptimeSeconds === 'number');
  } finally {
    server.close();
  }
});

test.after(async () => {
  // libSQL's native binding releases its OS-level file lock asynchronously
  // after close() returns — on Windows an immediate unlink can still race
  // it with EBUSY, so retry briefly instead of failing the whole suite.
  require('../database/connection').db.close();
  for (let attempt = 0; ; attempt++) {
    try {
      if (fs.existsSync(process.env.DATA_FILE)) fs.unlinkSync(process.env.DATA_FILE);
      break;
    } catch (err) {
      if (err.code !== 'EBUSY') throw err;
      if (attempt >= 29) break; // still locked (AV/indexer) — self-cleans on the next run's startup unlink
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
});
