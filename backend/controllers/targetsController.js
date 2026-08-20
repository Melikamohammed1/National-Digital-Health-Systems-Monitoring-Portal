const asyncHandler = require('../utils/asyncHandler');
const targetService = require('../services/targetService');

function actorFrom(req) {
  return { userId: req.user.id, username: req.user.username };
}

exports.list = asyncHandler(async (req, res) => {
  res.json(await targetService.listTargets());
});

exports.create = asyncHandler(async (req, res) => {
  const target = await targetService.registerTarget(req.body, actorFrom(req));
  res.status(201).json(target);
});

exports.update = asyncHandler(async (req, res) => {
  const target = await targetService.updateTarget(req.params.key, req.body, actorFrom(req));
  res.json(target);
});

exports.remove = asyncHandler(async (req, res) => {
  await targetService.removeTarget(req.params.key, actorFrom(req));
  res.status(204).end();
});
