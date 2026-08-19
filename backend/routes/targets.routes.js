const router = require('express').Router();
const ctrl = require('../controllers/targetsController');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { validateBody } = require('../middleware/validate');

// Read stays public — the unauthenticated /display/:id kiosk page needs
// target details to render its assigned slots with no login.
router.get('/', ctrl.list);

router.post('/', requireAuth, requireRole('admin'), validateBody(['name', 'url']), ctrl.create);
router.patch('/:key', requireAuth, requireRole('admin'), ctrl.update);
router.delete('/:key', requireAuth, requireRole('admin'), ctrl.remove);

module.exports = router;
