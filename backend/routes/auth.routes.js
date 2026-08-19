const router = require('express').Router();
const ctrl = require('../controllers/authController');
const requireAuth = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

router.post('/login', validateBody(['username', 'password']), ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me', requireAuth, ctrl.me);

module.exports = router;
