module.exports = function notFound(req, res) {
  res.status(404).json({ error: `No route matches ${req.method} ${req.originalUrl}` });
};
