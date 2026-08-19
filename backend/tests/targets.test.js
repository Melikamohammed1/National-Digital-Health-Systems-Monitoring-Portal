const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

process.env.DATA_FILE = path.join(__dirname, '.test-targets-data.sqlite');
if (fs.existsSync(process.env.DATA_FILE)) fs.unlinkSync(process.env.DATA_FILE);

const config = require('../config/env');
const app = require('../app');

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

// POST/DELETE /api/targets require a token now — logs in with the seeded
// demo admin (auto-seeded into every fresh data file) and returns an
// Authorization header ready to spread into a fetch() call.
async function authHeader(base) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: config.DEMO_ADMIN_USERNAME, password: config.DEMO_ADMIN_PASSWORD })
  });
  const { token } = await res.json();
  return { Authorization: `Bearer ${token}` };
}

test('GET /api/targets starts empty', withServer(async (base) => {
  const res = await fetch(`${base}/api/targets`);
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(body, {});
}));

test('POST /api/targets is rejected without a token', withServer(async (base) => {
  const res = await fetch(`${base}/api/targets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test System', url: 'https://example.com', mode: 'interactive' })
  });
  assert.strictEqual(res.status, 401);
}));

test('POST /api/targets defaults deviceType to "desktop" when not provided', withServer(async (base) => {
  const res = await fetch(`${base}/api/targets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader(base)) },
    body: JSON.stringify({ name: 'Test System', url: 'https://example.com', mode: 'interactive' })
  });
  const body = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(body.deviceType, 'desktop');
  assert.strictEqual(body.mode, 'interactive');
}));

test('POST /api/targets accepts an explicit deviceType', withServer(async (base) => {
  const res = await fetch(`${base}/api/targets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader(base)) },
    body: JSON.stringify({ name: 'Mobile System', url: 'https://example.com', mode: 'interactive', deviceType: 'mobile' })
  });
  const body = await res.json();
  assert.strictEqual(body.deviceType, 'mobile');
}));

test('POST /api/targets falls back to "desktop" for an invalid deviceType', withServer(async (base) => {
  const res = await fetch(`${base}/api/targets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader(base)) },
    body: JSON.stringify({ name: 'Bad Device', url: 'https://example.com', mode: 'interactive', deviceType: 'smart-fridge' })
  });
  const body = await res.json();
  assert.strictEqual(body.deviceType, 'desktop');
}));

test('POST /api/targets without name/url is rejected with 400', withServer(async (base) => {
  const res = await fetch(`${base}/api/targets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader(base)) },
    body: JSON.stringify({ mode: 'interactive' })
  });
  assert.strictEqual(res.status, 400);
}));

test('PATCH /api/targets/:key is rejected without a token', withServer(async (base) => {
  const res = await fetch(`${base}/api/targets/nonexistent`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'x' })
  });
  assert.strictEqual(res.status, 401);
}));

test('PATCH /api/targets/:key updates fields and 404s for an unknown key', withServer(async (base) => {
  const headers = { 'Content-Type': 'application/json', ...(await authHeader(base)) };
  const created = await fetch(`${base}/api/targets`, {
    method: 'POST', headers,
    body: JSON.stringify({ name: 'Original', url: 'https://example.com', mode: 'iframe' })
  }).then((r) => r.json());

  const res = await fetch(`${base}/api/targets/${created.key}`, {
    method: 'PATCH', headers,
    body: JSON.stringify({ name: 'Renamed' })
  });
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.name, 'Renamed');
  assert.strictEqual(body.url, created.url, 'unpatched fields are left alone');

  const missing = await fetch(`${base}/api/targets/does-not-exist`, { method: 'PATCH', headers, body: JSON.stringify({ name: 'x' }) });
  assert.strictEqual(missing.status, 404);
}));

test('screenshot mode stores a clamped refreshSeconds; other modes store null', withServer(async (base) => {
  const headers = { 'Content-Type': 'application/json', ...(await authHeader(base)) };

  const shot = await fetch(`${base}/api/targets`, {
    method: 'POST', headers,
    body: JSON.stringify({ name: 'Shot', url: 'https://example.com', mode: 'screenshot', refreshSeconds: 2 })
  }).then((r) => r.json());
  assert.strictEqual(shot.mode, 'screenshot');
  assert.strictEqual(shot.refreshSeconds, 5, 'clamped up to the 5s minimum');

  const iframe = await fetch(`${base}/api/targets`, {
    method: 'POST', headers,
    body: JSON.stringify({ name: 'Frame', url: 'https://example.com', mode: 'iframe', refreshSeconds: 30 })
  }).then((r) => r.json());
  assert.strictEqual(iframe.refreshSeconds, null, 'refreshSeconds is meaningless outside screenshot mode');
}));

test.after(() => {
  // node:sqlite holds an OS-level file lock until closed — on Windows the
  // unlink below fails with EBUSY otherwise.
  require('../database/connection').close();
  if (fs.existsSync(process.env.DATA_FILE)) fs.unlinkSync(process.env.DATA_FILE);
});
