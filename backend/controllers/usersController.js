const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');

function actorFrom(req) {
  return { userId: req.user.id, username: req.user.username };
}

exports.list = asyncHandler(async (req, res) => {
  res.json(userService.listUsers());
});

exports.create = asyncHandler(async (req, res) => {
  const user = userService.registerUser(req.body, actorFrom(req));
  res.status(201).json(user);
});

exports.remove = asyncHandler(async (req, res) => {
  userService.removeUser(req.params.id, actorFrom(req));
  res.status(204).end();
});
