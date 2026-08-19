const router = require('express').Router();
const ctrl = require('../controllers/screensController');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { validateBody } = require('../middleware/validate');

// Reads stay public — the unauthenticated /display/:id kiosk page needs
// these with no login. Only admin mutations require a token AND the
// admin role — a signed-in Viewer can see the Orchestrator dashboard but
// can't change anything through it.
router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);

// Public — called by the unauthenticated /display/:id page itself (not an
// admin action), so it must not require a token.
router.post('/:id/heartbeat', ctrl.heartbeat);

router.post('/', requireAuth, requireRole('admin'), validateBody(['name']), ctrl.create);
router.patch('/:id', requireAuth, requireRole('admin'), ctrl.update);
router.post('/:id/reconnect', requireAuth, requireRole('admin'), ctrl.reconnect);
router.delete('/:id', requireAuth, requireRole('admin'), ctrl.remove);

module.exports = router;
