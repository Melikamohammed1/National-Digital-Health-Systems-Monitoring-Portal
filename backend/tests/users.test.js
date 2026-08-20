const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

process.env.DATA_FILE = path.join(__dirname, '.test-users-data.sqlite');
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

async function login(base, username, password) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}
async function adminAuthHeader(base) {
  const { token } = await login(base, config.DEMO_ADMIN_USERNAME, config.DEMO_ADMIN_PASSWORD);
  return { Authorization: `Bearer ${token}` };
}

test('login response and /api/auth/me both report the account role', withServer(async (base) => {
  const { token, user } = await login(base, config.DEMO_ADMIN_USERNAME, config.DEMO_ADMIN_PASSWORD);
  assert.strictEqual(user.role, 'admin');

  const me = await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
  assert.strictEqual(me.user.role, 'admin');
}));

test('POST /api/users is admin-only', withServer(async (base) => {
  const headers = { 'Content-Type': 'application/json', ...(await adminAuthHeader(base)) };
  const viewer = await fetch(`${base}/api/users`, {
    method: 'POST', headers,
    body: JSON.stringify({ username: 'viewer1', password: 'viewpass', role: 'viewer' })
  }).then((r) => r.json());
  assert.strictEqual(viewer.role, 'viewer');
  assert.strictEqual(viewer.username, 'viewer1');
  assert.ok(!('passwordHash' in viewer), 'password hash is never returned to the client');

  const viewerHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${(await login(base, 'viewer1', 'viewpass')).token}` };
  const rejected = await fetch(`${base}/api/users`, {
    method: 'POST', headers: viewerHeaders,
    body: JSON.stringify({ username: 'viewer2', password: 'viewpass2', role: 'viewer' })
  });
  assert.strictEqual(rejected.status, 403, 'a viewer cannot create other accounts');
}));

test('a Viewer can read screens/targets but every mutation is rejected with 403', withServer(async (base) => {
  const adminHeaders = { 'Content-Type': 'application/json', ...(await adminAuthHeader(base)) };
  await fetch(`${base}/api/users`, {
    method: 'POST', headers: adminHeaders,
    body: JSON.stringify({ username: 'viewer3', password: 'viewpass', role: 'viewer' })
  });
  const { token } = await login(base, 'viewer3', 'viewpass');
  const viewerHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const read = await fetch(`${base}/api/screens`, { headers: viewerHeaders });
  assert.strictEqual(read.status, 200, 'reads stay allowed for a logged-in viewer');

  const create = await fetch(`${base}/api/screens`, {
    method: 'POST', headers: viewerHeaders,
    body: JSON.stringify({ name: 'Viewer Attempt' })
  });
  assert.strictEqual(create.status, 403);

  const createTarget = await fetch(`${base}/api/targets`, {
    method: 'POST', headers: viewerHeaders,
    body: JSON.stringify({ name: 'x', url: 'https://example.com', mode: 'iframe' })
  });
  assert.strictEqual(createTarget.status, 403);
}));

test('the last admin account cannot be removed', withServer(async (base) => {
  const headers = { 'Content-Type': 'application/json', ...(await adminAuthHeader(base)) };
  const me = await fetch(`${base}/api/auth/me`, { headers }).then((r) => r.json());
  const res = await fetch(`${base}/api/users/${me.user.id}`, { method: 'DELETE', headers });
  assert.strictEqual(res.status, 400);
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
