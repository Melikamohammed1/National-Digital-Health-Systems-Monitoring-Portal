/**
 * ============================================================================
 * DATA LAYER — frontend-only phase
 * ============================================================================
 * USE_MOCK = true:  everything below reads/writes an in-memory array — no
 *                    server required. This is what runs today.
 * USE_MOCK = false: every function instead calls the real Express backend
 *                    at /api/* (see the project root README for that server).
 *
 * Every exported function has the exact same name, arguments, and return
 * shape in both modes — components never check USE_MOCK themselves.
 * ============================================================================
 */
export const USE_MOCK = false;

const LATENCY_MS = 350;
const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
const clone = (value) => JSON.parse(JSON.stringify(value));

/* ---------------------------------------------------------------------------
 * MOCK IN-MEMORY STORE
 * ------------------------------------------------------------------------- */
import { SEED_SCREENS } from './mockData.js';

let mockScreens = clone(SEED_SCREENS);
let mockTargets = {};
const LAYOUT_SIZES = { single: 1, '2x2': 4, '3col': 3, custom: 2 };
// Muted slate/gray tones — mirrors the backend's Target.js palette.
const PALETTE = ['#475569', '#4B5563', '#52525B', '#525252', '#57534E', '#334155', '#374151', '#3F3F46', '#404040', '#44403C'];

async function mockGetScreens() {
  return delay(clone(mockScreens));
}
async function mockGetScreen(id) {
  const found = mockScreens.find((s) => s.id === id);
  if (!found) throw new Error('Screen not found');
  return delay(clone(found));
}
async function mockCreateScreen({ name, layout }) {
  const safeLayout = LAYOUT_SIZES[layout] ? layout : '2x2';
  const screen = {
    id: 'scr_' + Date.now().toString().slice(-6),
    name: name?.trim() || 'Untitled Screen',
    location: 'Unassigned Location',
    ip: '—',
    res: '1920x1080',
    status: 'standby',
    layout: safeLayout,
    slots: Array.from({ length: LAYOUT_SIZES[safeLayout] }, () => null)
  };
  mockScreens.push(screen);
  return delay(clone(screen));
}
async function mockPatchScreen(id, patch) {
  const screen = mockScreens.find((s) => s.id === id);
  if (!screen) throw new Error('Screen not found');
  Object.assign(screen, patch);
  if (screen.status !== 'offline') delete screen.lastSeen;
  return delay(clone(screen));
}
async function mockReconnectScreen(id) {
  const screen = mockScreens.find((s) => s.id === id);
  if (!screen) throw new Error('Screen not found');
  screen.status = 'online';
  delete screen.lastSeen;
  return delay(clone(screen));
}
async function mockHeartbeatScreen(id) {
  const screen = mockScreens.find((s) => s.id === id);
  if (!screen) throw new Error('Screen not found');
  screen.status = 'online';
  screen.lastSeen = Date.now();
  return delay(clone(screen));
}
async function mockDeleteScreen(id) {
  const before = mockScreens.length;
  mockScreens = mockScreens.filter((s) => s.id !== id);
  if (mockScreens.length === before) throw new Error('Screen not found');
  return delay(null);
}
async function mockGetTargets() {
  return delay(clone(mockTargets));
}
async function mockCreateTarget({ name, url, mode, deviceType }) {
  const fixedUrl = /^https?:\/\//i.test(url) ? url : 'https://' + url;
  const key = 'custom_' + Date.now();
  const target = {
    name: name?.trim() || 'Untitled System',
    url: fixedUrl,
    mode: mode === 'iframe' ? 'iframe' : 'interactive',
    deviceType: ['desktop', 'tablet', 'mobile'].includes(deviceType) ? deviceType : 'desktop',
    color: PALETTE[Object.keys(mockTargets).length % PALETTE.length],
    note: null
  };
  mockTargets[key] = target;
  return delay({ key, ...target });
}
async function mockUpdateTarget(key, patch) {
  const target = mockTargets[key];
  if (!target) throw new Error('Target not found');
  Object.assign(target, patch);
  return delay({ key, ...target });
}
async function mockDeleteTarget(key) {
  if (!mockTargets[key]) throw new Error('Target not found');
  delete mockTargets[key];
  return delay(null);
}
let mockUsers = [{ id: 'usr_admin', username: 'admin', role: 'admin' }];
async function mockGetUsers() {
  return delay(clone(mockUsers));
}
async function mockCreateUser({ username, role }) {
  const user = { id: 'usr_' + Date.now(), username, role: role === 'admin' ? 'admin' : 'viewer' };
  mockUsers.push(user);
  return delay(clone(user));
}
async function mockDeleteUser(id) {
  mockUsers = mockUsers.filter((u) => u.id !== id);
  return delay(null);
}
async function mockGetActivity() {
  return delay([]);
}

/* ---------------------------------------------------------------------------
 * REAL BACKEND CALLS (used once USE_MOCK is flipped to false)
 * ------------------------------------------------------------------------- */
async function http(path, opts) {
  const token = localStorage.getItem('ndhs_token');
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    ...opts
  });
  if (!res.ok) {
    let msg = 'Request failed';
    try { msg = (await res.json()).error || msg; } catch { /* non-JSON error body */ }
    if (res.status === 401) {
      // Token is missing/expired/invalid — drop the stale session so the
      // next navigation reflects logged-out state instead of retrying
      // every future request with a token the backend already rejected.
      localStorage.removeItem('ndhs_token');
      localStorage.removeItem('ndhs_auth_user');
    }
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

/* ---------------------------------------------------------------------------
 * PUBLIC API
 * ------------------------------------------------------------------------- */
export const getScreens = () => (USE_MOCK ? mockGetScreens() : http('/api/screens'));
export const getScreen = (id) => (USE_MOCK ? mockGetScreen(id) : http(`/api/screens/${id}`));
export const createScreen = (body) => (USE_MOCK ? mockCreateScreen(body) : http('/api/screens', { method: 'POST', body: JSON.stringify(body) }));
export const patchScreen = (id, body) => (USE_MOCK ? mockPatchScreen(id, body) : http(`/api/screens/${id}`, { method: 'PATCH', body: JSON.stringify(body) }));
export const reconnectScreen = (id) => (USE_MOCK ? mockReconnectScreen(id) : http(`/api/screens/${id}/reconnect`, { method: 'POST' }));
export const heartbeatScreen = (id) => (USE_MOCK ? mockHeartbeatScreen(id) : http(`/api/screens/${id}/heartbeat`, { method: 'POST' }));
export const deleteScreen = (id) => (USE_MOCK ? mockDeleteScreen(id) : http(`/api/screens/${id}`, { method: 'DELETE' }));
export const getTargets = () => (USE_MOCK ? mockGetTargets() : http('/api/targets'));
export const createTarget = (body) => (USE_MOCK ? mockCreateTarget(body) : http('/api/targets', { method: 'POST', body: JSON.stringify(body) }));
export const updateTarget = (key, body) => (USE_MOCK ? mockUpdateTarget(key, body) : http(`/api/targets/${key}`, { method: 'PATCH', body: JSON.stringify(body) }));
export const deleteTarget = (key) => (USE_MOCK ? mockDeleteTarget(key) : http(`/api/targets/${key}`, { method: 'DELETE' }));
export const getUsers = () => (USE_MOCK ? mockGetUsers() : http('/api/users'));
export const createUser = (body) => (USE_MOCK ? mockCreateUser(body) : http('/api/users', { method: 'POST', body: JSON.stringify(body) }));
export const deleteUser = (id) => (USE_MOCK ? mockDeleteUser(id) : http(`/api/users/${id}`, { method: 'DELETE' }));
export const getActivity = (limit = 100) => (USE_MOCK ? mockGetActivity() : http(`/api/activity?limit=${limit}`));
