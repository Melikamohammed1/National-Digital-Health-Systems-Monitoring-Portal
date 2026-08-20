const Target = require('../models/Target');
const { HttpError } = require('../utils/HttpError');
const { normalizeEmbedUrl } = require('../utils/normalizeEmbedUrl');
const activityLog = require('./activityLogService');

function listTargets() {
  return Target.findAll();
}

const VALID_DEVICE_TYPES = new Set(['desktop', 'tablet', 'mobile']);
const VALID_MODES = new Set(['iframe', 'interactive', 'screenshot']);
const MIN_REFRESH_SECONDS = 5;
const MAX_REFRESH_SECONDS = 300;
const DEFAULT_REFRESH_SECONDS = 8;

function safeMode(mode) {
  return VALID_MODES.has(mode) ? mode : 'interactive';
}

// Only 'screenshot' mode actually polls on an interval, so refreshSeconds
// is meaningless (and stored as null) for the other two.
function safeRefreshSeconds(mode, refreshSeconds) {
  if (mode !== 'screenshot') return null;
  const n = Number(refreshSeconds);
  if (!Number.isFinite(n)) return DEFAULT_REFRESH_SECONDS;
  return Math.min(MAX_REFRESH_SECONDS, Math.max(MIN_REFRESH_SECONDS, Math.round(n)));
}

async function registerTarget({ name, url, mode, deviceType, refreshSeconds }, actor) {
  if (!name || !url) throw new HttpError(400, 'name and url are required');

  let fixedUrl = /^https?:\/\//i.test(url) ? url : 'https://' + url;
  const useMode = safeMode(mode);
  const safeDeviceType = VALID_DEVICE_TYPES.has(deviceType) ? deviceType : 'desktop';
  let note = null;

  if (useMode === 'iframe') {
    const normalized = normalizeEmbedUrl(fixedUrl);
    fixedUrl = normalized.url;
    note = normalized.note;
  }

  const target = await Target.create({
    name: name.trim(),
    url: fixedUrl,
    mode: useMode,
    deviceType: safeDeviceType,
    note,
    refreshSeconds: safeRefreshSeconds(useMode, refreshSeconds)
  });
  activityLog.log({ ...actor, action: 'create', entityType: 'target', entityId: target.key, detail: `Added system "${target.name}"` });
  return target;
}

async function updateTarget(key, patch, actor) {
  const existing = await Target.findByKey(key);
  if (!existing) throw new HttpError(404, 'Target not found');

  const next = {};

  if ('name' in patch) {
    if (!patch.name || !patch.name.trim()) throw new HttpError(400, 'name cannot be empty');
    next.name = patch.name.trim();
  }

  const useMode = 'mode' in patch ? safeMode(patch.mode) : existing.mode;
  if ('mode' in patch) next.mode = useMode;

  if ('deviceType' in patch) {
    next.deviceType = VALID_DEVICE_TYPES.has(patch.deviceType) ? patch.deviceType : 'desktop';
  }

  // Re-normalize the URL (and its accompanying note) whenever the URL
  // itself changes, or the mode changes into/out of 'iframe' — the same
  // rewriting registerTarget applies at creation time.
  if ('url' in patch || 'mode' in patch) {
    if (!patch.url && !existing.url) throw new HttpError(400, 'url cannot be empty');
    let fixedUrl = patch.url ? (/^https?:\/\//i.test(patch.url) ? patch.url : 'https://' + patch.url) : existing.url;
    if (useMode === 'iframe') {
      const normalized = normalizeEmbedUrl(fixedUrl);
      fixedUrl = normalized.url;
      next.note = normalized.note;
    } else {
      next.note = null;
    }
    next.url = fixedUrl;
  }

  if ('refreshSeconds' in patch || 'mode' in patch) {
    next.refreshSeconds = safeRefreshSeconds(useMode, patch.refreshSeconds ?? existing.refreshSeconds);
  }

  const updated = await Target.update(key, next);
  activityLog.log({ ...actor, action: 'update', entityType: 'target', entityId: key, detail: `Updated system "${existing.name}"` });
  return updated;
}

async function removeTarget(key, actor) {
  const existing = await Target.findByKey(key);
  const removed = await Target.remove(key);
  if (!removed) throw new HttpError(404, 'Target not found');
  activityLog.log({ ...actor, action: 'delete', entityType: 'target', entityId: key, detail: `Removed system "${existing?.name || key}"` });
}

module.exports = { listTargets, registerTarget, updateTarget, removeTarget };
