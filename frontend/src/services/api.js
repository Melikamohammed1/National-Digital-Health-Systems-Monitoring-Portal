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
 * shape in both modes. Pages and components only ever call these functions
 * — they never check USE_MOCK themselves — so flipping this one flag (once
 * the backend is running) is the entire migration. No component changes.
 * ============================================================================
 */
export const USE_MOCK = true;

const LATENCY_MS = 350; // simulated network delay, so loading states are visible/testable
const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
const clone = (value) => JSON.parse(JSON.stringify(value));

/* ---------------------------------------------------------------------------
 * MOCK IN-MEMORY STORE
 * ------------------------------------------------------------------------- */
import { SEED_SCREENS } from './mockData.js';

let mockScreens = clone(SEED_SCREENS);
let mockTargets = {}; // custom targets added via "Add System" / quick-browse
const LAYOUT_SIZES = { single: 1, '2x2': 4, '3col': 3, custom: 2 };
const PALETTE = ['#3A4FC4', '#7C3AED', '#0891A8', '#B91C1C', '#0F766E', '#C2410C', '#15803D', '#9F1239', '#0369A1', '#4D7C0F'];

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
async function mockGetTargets() {
  return delay(clone(mockTargets));
}
async function mockCreateTarget({ name, url, mode }) {
  const fixedUrl = /^https?:\/\//i.test(url) ? url : 'https://' + url;
  const key = 'custom_' + Date.now();
  const target = {
    name: name?.trim() || 'Untitled System',
    url: fixedUrl,
    mode: mode === 'iframe' ? 'iframe' : 'interactive',
    color: PALETTE[Object.keys(mockTargets).length % PALETTE.length],
    note: null
  };
  mockTargets[key] = target;
  return delay({ key, ...target });
}

/* ---------------------------------------------------------------------------
 * REAL BACKEND CALLS (used once USE_MOCK is flipped to false)
 * ------------------------------------------------------------------------- */
async function http(path, opts) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) {
    let msg = 'Request failed';
    try { msg = (await res.json()).error || msg; } catch { /* non-JSON error body */ }
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

/* ---------------------------------------------------------------------------
 * PUBLIC API — what the rest of the app imports and calls
 * ------------------------------------------------------------------------- */
export const getScreens = () => (USE_MOCK ? mockGetScreens() : http('/api/screens'));
export const getScreen = (id) => (USE_MOCK ? mockGetScreen(id) : http(`/api/screens/${id}`));
export const createScreen = (body) => (USE_MOCK ? mockCreateScreen(body) : http('/api/screens', { method: 'POST', body: JSON.stringify(body) }));
export const patchScreen = (id, body) => (USE_MOCK ? mockPatchScreen(id, body) : http(`/api/screens/${id}`, { method: 'PATCH', body: JSON.stringify(body) }));
export const reconnectScreen = (id) => (USE_MOCK ? mockReconnectScreen(id) : http(`/api/screens/${id}/reconnect`, { method: 'POST' }));
export const getTargets = () => (USE_MOCK ? mockGetTargets() : http('/api/targets'));
export const createTarget = (body) => (USE_MOCK ? mockCreateTarget(body) : http('/api/targets', { method: 'POST', body: JSON.stringify(body) }));
