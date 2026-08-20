const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

process.env.DATA_FILE = path.join(__dirname, '.test-auth-data.sqlite');
if (fs.existsSync(process.env.DATA_FILE)) fs.unlinkSync(process.env.DATA_FILE);

const config = require('../config/env');
const app = require('../app');

test.before(async () => {
  await require('../database/connection').init();
});

function withServer(fn) {
  return async () => {
    const server = http.createServer(app).listen(0);
    const { port } = server.address();
    try {
      await fn(`http://localhost:${port}`);
    } finally {
      server.close();
    }
  };
}

test('POST /api/auth/login succeeds with the seeded demo credentials', withServer(async (base) => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: config.DEMO_ADMIN_USERNAME, password: config.DEMO_ADMIN_PASSWORD })
  });
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(body.token);
  assert.strictEqual(body.user.username, config.DEMO_ADMIN_USERNAME);
}));

test('POST /api/auth/login rejects a wrong password with 401', withServer(async (base) => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: config.DEMO_ADMIN_USERNAME, password: 'wrong-password' })
  });
  assert.strictEqual(res.status, 401);
}));

test('GET /api/auth/me requires a token', withServer(async (base) => {
  const res = await fetch(`${base}/api/auth/me`);
  assert.strictEqual(res.status, 401);
}));

test('GET /api/auth/me succeeds with a valid token from login', withServer(async (base) => {
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: config.DEMO_ADMIN_USERNAME, password: config.DEMO_ADMIN_PASSWORD })
  });
  const { token } = await loginRes.json();

  const meRes = await fetch(`${base}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await meRes.json();
  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(body.user.username, config.DEMO_ADMIN_USERNAME);
}));

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
