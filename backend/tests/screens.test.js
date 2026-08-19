const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

// Use an isolated data file so this test never touches real dev data.
process.env.DATA_FILE = path.join(__dirname, '.test-data.sqlite');
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

// POST/PATCH/DELETE /api/screens require a token now — logs in with the
// seeded demo admin (auto-seeded into every fresh data file) and returns
// an Authorization header ready to spread into a fetch() call.
async function authHeader(base) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: config.DEMO_ADMIN_USERNAME, password: config.DEMO_ADMIN_PASSWORD })
  });
  const { token } = await res.json();
  return { Authorization: `Bearer ${token}` };
}

test('GET /api/screens starts empty (no example/demo screens seeded)', withServer(async (base) => {
  const res = await fetch(`${base}/api/screens`);
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(body));
  assert.strictEqual(body.length, 0);
}));

test('POST /api/screens is rejected without a token', withServer(async (base) => {
  const res = await fetch(`${base}/api/screens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Screen', layout: '3col' })
  });
  assert.strictEqual(res.status, 401);
}));

test('POST /api/screens creates a screen with default slots for its layout', withServer(async (base) => {
  const res = await fetch(`${base}/api/screens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader(base)) },
    body: JSON.stringify({ name: 'Test Screen', layout: '3col' })
  });
  const body = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(body.name, 'Test Screen');
  assert.strictEqual(body.slots.length, 3);
}));

test('POST /api/screens without a name is rejected with 400', withServer(async (base) => {
  const res = await fetch(`${base}/api/screens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader(base)) },
    body: JSON.stringify({ layout: '2x2' })
  });
  assert.strictEqual(res.status, 400);
}));

test('GET /api/screens/:id 404s for an unknown id', withServer(async (base) => {
  const res = await fetch(`${base}/api/screens/does-not-exist`);
  assert.strictEqual(res.status, 404);
}));

test('POST /api/screens/:id/heartbeat is public and marks the screen online', withServer(async (base) => {
  const created = await fetch(`${base}/api/screens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader(base)) },
    body: JSON.stringify({ name: 'Heartbeat Screen' })
  }).then((r) => r.json());

  const res = await fetch(`${base}/api/screens/${created.id}/heartbeat`, { method: 'POST' });
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.status, 'online');
  assert.ok(body.lastSeen);
}));

test('slotSpans defaults to all 1s and stays in sync when slots length changes', withServer(async (base) => {
  const headers = { 'Content-Type': 'application/json', ...(await authHeader(base)) };
  const created = await fetch(`${base}/api/screens`, {
    method: 'POST', headers,
    body: JSON.stringify({ name: 'Span Screen', layout: 'custom' })
  }).then((r) => r.json());
  assert.deepStrictEqual(created.slotSpans, created.slots.map(() => 1));

  // Widen slot 0 to span 2 columns explicitly.
  const widened = await fetch(`${base}/api/screens/${created.id}`, {
    method: 'PATCH', headers,
    body: JSON.stringify({ slotSpans: [2, 1] })
  }).then((r) => r.json());
  assert.deepStrictEqual(widened.slotSpans, [2, 1]);

  // Growing slots without touching slotSpans preserves the existing spans
  // and pads new positions with 1 — it doesn't silently reset to all-1s.
  const grown = await fetch(`${base}/api/screens/${created.id}`, {
    method: 'PATCH', headers,
    body: JSON.stringify({ slots: [null, null, null] })
  }).then((r) => r.json());
  assert.deepStrictEqual(grown.slotSpans, [2, 1, 1]);
}));

test.after(() => {
  // node:sqlite holds an OS-level file lock until closed — on Windows the
  // unlink below fails with EBUSY otherwise.
  require('../database/connection').close();
  if (fs.existsSync(process.env.DATA_FILE)) fs.unlinkSync(process.env.DATA_FILE);
});
