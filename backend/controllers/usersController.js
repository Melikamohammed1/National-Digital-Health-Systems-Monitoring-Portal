const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');

function actorFrom(req) {
  return { userId: req.user.id, username: req.user.username };
}

exports.list = asyncHandler(async (req, res) => {
  res.json(await userService.listUsers());
});

exports.create = asyncHandler(async (req, res) => {
  const user = await userService.registerUser(req.body, actorFrom(req));
  res.status(201).json(user);
});

exports.remove = asyncHandler(async (req, res) => {
  await userService.removeUser(req.params.id, actorFrom(req));
  res.status(204).end();
});
