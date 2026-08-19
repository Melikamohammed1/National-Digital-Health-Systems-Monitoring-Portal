const router = require('express').Router();
const ctrl = require('../controllers/activityController');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// Admin-only — a login/action history is itself sensitive (usernames,
// what got deleted and when), not something a Viewer should be able to read.
router.get('/', requireAuth, requireRole('admin'), ctrl.list);

module.exports = router;
