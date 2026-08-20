const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const result = await authService.login(username, password);
  res.json(result);
});

// JWTs are stateless — there's no server-side session to destroy here.
// This exists so the frontend has a real endpoint to call; the actual
// "logout" is the client discarding its token. A refresh-token/blacklist
// scheme is the natural next step if server-side invalidation is needed.
exports.logout = asyncHandler(async (req, res) => {
  res.json({ ok: true });
});

// Protected — requires requireAuth middleware. Lets the frontend verify a
// stored token is still valid and fetch the current user on app load.
exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
