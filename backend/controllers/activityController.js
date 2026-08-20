const asyncHandler = require('../utils/asyncHandler');
const activityLogService = require('../services/activityLogService');

exports.list = asyncHandler(async (req, res) => {
  res.json(await activityLogService.listRecent(req.query.limit));
});
