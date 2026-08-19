const router = require('express').Router();

router.use('/screens', require('./screens.routes'));
router.use('/targets', require('./targets.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/users', require('./users.routes'));
router.use('/activity', require('./activity.routes'));
router.use('/', require('./embedding.routes'));   // -> /api/proxy, /api/screenshot
router.use('/', require('./monitoring.routes'));   // -> /api/health, /api/monitoring/status

module.exports = router;
