const asyncHandler = require('../utils/asyncHandler');
const screenService = require('../services/screenService');

exports.health = asyncHandler(async (req, res) => {
  res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()), timestamp: new Date().toISOString() });
});

// "Monitoring: Screen Status, System Status" — a simple aggregate over the
// same data /api/screens already exposes, useful for a dashboard widget
// that doesn't want to fetch and count the full list itself.
exports.status = asyncHandler(async (req, res) => {
  const screens = screenService.listScreens();
  const counts = screens.reduce(
    (acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; },
    { online: 0, standby: 0, offline: 0 }
  );
  res.json({ totalScreens: screens.length, ...counts });
});
