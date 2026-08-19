const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

process.env.DATA_FILE = path.join(__dirname, '.test-activity-data.sqlite');
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

async function login(base, username, password) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

test('GET /api/activity is admin-only', withServer(async (base) => {
  const res = await fetch(`${base}/api/activity`);
  assert.strictEqual(res.status, 401);
}));

test('a failed login is recorded by the attempted username, no userId', withServer(async (base) => {
  await login(base, config.DEMO_ADMIN_USERNAME, 'wrong-password');
  const { token } = await login(base, config.DEMO_ADMIN_USERNAME, config.DEMO_ADMIN_PASSWORD);

  const entries = await fetch(`${base}/api/activity`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
  const failed = entries.find((e) => e.action === 'login_failed');
  assert.ok(failed, 'expected a login_failed entry');
  assert.strictEqual(failed.username, config.DEMO_ADMIN_USERNAME);
  assert.strictEqual(failed.userId, null);

  const success = entries.find((e) => e.action === 'login_success');
  assert.ok(success, 'expected a login_success entry');
  assert.strictEqual(success.username, config.DEMO_ADMIN_USERNAME);
  assert.ok(success.userId);
}));

test('creating and deleting a screen is recorded with a readable detail', withServer(async (base) => {
  const { token } = await login(base, config.DEMO_ADMIN_USERNAME, config.DEMO_ADMIN_PASSWORD);
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const screen = await fetch(`${base}/api/screens`, {
    method: 'POST', headers,
    body: JSON.stringify({ name: 'Logged Screen' })
  }).then((r) => r.json());
  await fetch(`${base}/api/screens/${screen.id}`, { method: 'DELETE', headers });

  const entries = await fetch(`${base}/api/activity`, { headers }).then((r) => r.json());
  const created = entries.find((e) => e.action === 'create' && e.entityType === 'screen' && e.entityId === screen.id);
  const deleted = entries.find((e) => e.action === 'delete' && e.entityType === 'screen' && e.entityId === screen.id);
  assert.ok(created, 'expected a create entry for the screen');
  assert.match(created.detail, /Logged Screen/);
  assert.ok(deleted, 'expected a delete entry for the screen');
  assert.match(deleted.detail, /Logged Screen/, 'delete detail still names the screen even though it no longer exists');
}));

test('heartbeat pings do not get logged', withServer(async (base) => {
  const { token } = await login(base, config.DEMO_ADMIN_USERNAME, config.DEMO_ADMIN_PASSWORD);
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const screen = await fetch(`${base}/api/screens`, { method: 'POST', headers, body: JSON.stringify({ name: 'Quiet Screen' }) }).then((r) => r.json());

  await fetch(`${base}/api/screens/${screen.id}/heartbeat`, { method: 'POST' });
  await fetch(`${base}/api/screens/${screen.id}/heartbeat`, { method: 'POST' });

  const entries = await fetch(`${base}/api/activity`, { headers }).then((r) => r.json());
  assert.ok(!entries.some((e) => e.action === 'heartbeat'), 'heartbeats would flood the log and drown out real activity');
}));

test.after(() => {
  require('../database/connection').close();
  if (fs.existsSync(process.env.DATA_FILE)) fs.unlinkSync(process.env.DATA_FILE);
});
