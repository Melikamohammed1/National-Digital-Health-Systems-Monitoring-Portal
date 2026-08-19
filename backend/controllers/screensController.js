const asyncHandler = require('../utils/asyncHandler');
const screenService = require('../services/screenService');

function actorFrom(req) {
  return { userId: req.user.id, username: req.user.username };
}

exports.list = asyncHandler(async (req, res) => {
  res.json(screenService.listScreens());
});

exports.getOne = asyncHandler(async (req, res) => {
  res.json(screenService.getScreen(req.params.id));
});

exports.create = asyncHandler(async (req, res) => {
  const screen = screenService.registerScreen(req.body, actorFrom(req));
  res.status(201).json(screen);
});

exports.update = asyncHandler(async (req, res) => {
  res.json(screenService.updateScreen(req.params.id, req.body, actorFrom(req)));
});

exports.reconnect = asyncHandler(async (req, res) => {
  res.json(screenService.reconnectScreen(req.params.id, actorFrom(req)));
});

exports.heartbeat = asyncHandler(async (req, res) => {
  res.json(screenService.heartbeatScreen(req.params.id));
});

exports.remove = asyncHandler(async (req, res) => {
  screenService.removeScreen(req.params.id, actorFrom(req));
  res.status(204).end();
});
