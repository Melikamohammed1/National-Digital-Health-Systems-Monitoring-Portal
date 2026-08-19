const router = require('express').Router();
const ctrl = require('../controllers/usersController');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { validateBody } = require('../middleware/validate');

// Account management is entirely admin-only — there's no self-service
// registration (see the "should we have a signup page" discussion this
// was built out of: an open signup would defeat the point of access
// control by letting anyone grant themselves a dashboard login).
router.use(requireAuth, requireRole('admin'));

router.get('/', ctrl.list);
router.post('/', validateBody(['username', 'password']), ctrl.create);
router.delete('/:id', ctrl.remove);

module.exports = router;
