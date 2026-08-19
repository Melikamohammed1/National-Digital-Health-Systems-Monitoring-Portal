const ActivityLog = require('../models/ActivityLog');

// Fire-and-forget from every other service's perspective — logging a
// mutation must never be the reason the mutation itself fails, so a
// logging bug can't take down create/update/delete/login.
function log(entry) {
  try {
    ActivityLog.record(entry);
  } catch (err) {
    console.error('[activity-log] failed to record entry:', err);
  }
}

function listRecent(limit = 100) {
  return ActivityLog.recent(Math.min(500, Math.max(1, Number(limit) || 100)));
}

module.exports = { log, listRecent };
