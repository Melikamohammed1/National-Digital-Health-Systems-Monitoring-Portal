const Screen = require('../models/Screen');
const { HttpError } = require('../utils/HttpError');
const activityLog = require('./activityLogService');

function listScreens() {
  return Screen.findAll();
}

async function getScreen(id) {
  const screen = await Screen.findById(id);
  if (!screen) throw new HttpError(404, 'Screen not found');
  return screen;
}

async function registerScreen({ name, layout, passcode }, actor) {
  if (!name || !name.trim()) throw new HttpError(400, 'name is required');
  const screen = await Screen.create({ name: name.trim(), layout, passcode });
  activityLog.log({ ...actor, action: 'create', entityType: 'screen', entityId: screen.id, detail: `Registered screen "${screen.name}"` });
  return screen;
}

async function updateScreen(id, patch, actor) {
  const existing = await Screen.findById(id);
  const updated = await Screen.update(id, patch);
  if (!updated) throw new HttpError(404, 'Screen not found');
  activityLog.log({ ...actor, action: 'update', entityType: 'screen', entityId: id, detail: `Updated screen "${existing?.name || id}"` });
  return updated;
}

async function reconnectScreen(id, actor) {
  const updated = await Screen.reconnect(id);
  if (!updated) throw new HttpError(404, 'Screen not found');
  activityLog.log({ ...actor, action: 'reconnect', entityType: 'screen', entityId: id, detail: `Force-reconnected screen "${updated.name}"` });
  return updated;
}

async function removeScreen(id, actor) {
  const existing = await Screen.findById(id);
  const removed = await Screen.remove(id);
  if (!removed) throw new HttpError(404, 'Screen not found');
  activityLog.log({ ...actor, action: 'delete', entityType: 'screen', entityId: id, detail: `Deleted screen "${existing?.name || id}"` });
}

// Called by the (unauthenticated) /display/:id page itself, on an
// interval — deliberately NOT logged to activity_log, or the log would
// fill up with a heartbeat entry every ~15s per open display and drown
// out everything a human actually did.
async function heartbeatScreen(id) {
  const updated = await Screen.heartbeat(id);
  if (!updated) throw new HttpError(404, 'Screen not found');
  return updated;
}

// A screen counts as offline once it's gone this long without a heartbeat —
// several missed check-ins, not one, so a single dropped request doesn't
// flip status.
const OFFLINE_TIMEOUT_MS = 45_000;

async function sweepOfflineScreens() {
  await Screen.sweepOffline(OFFLINE_TIMEOUT_MS);
}

module.exports = {
  listScreens,
  getScreen,
  registerScreen,
  updateScreen,
  reconnectScreen,
  removeScreen,
  heartbeatScreen,
  sweepOfflineScreens
};
