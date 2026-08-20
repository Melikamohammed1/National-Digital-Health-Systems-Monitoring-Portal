const ActivityLog = require('../models/ActivityLog');

// Deliberately not awaited by callers — logging a mutation is a network
// write now (remote database), and it must never add latency to, or be the
// reason for failure of, the mutation it's describing. Errors are caught
// internally so an un-awaited call can never produce an unhandled rejection.
function log(entry) {
  ActivityLog.record(entry).catch((err) => {
    console.error('[activity-log] failed to record entry:', err);
  });
}

async function listRecent(limit = 100) {
  return ActivityLog.recent(Math.min(500, Math.max(1, Number(limit) || 100)));
}

module.exports = { log, listRecent };
